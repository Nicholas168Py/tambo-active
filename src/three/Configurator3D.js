import * as THREE from 'three';
import { crearEscena } from './Scene.js';
import { crearCamara, ajustarProporcion, ajustarCamaraAlModelo } from './Camera.js';
import { crearRenderer, redimensionar } from './Renderer.js';
import { crearLuces } from './Lights.js';
import { cargarModelo, centrarModelo, disponerModelo, aplicarAcabadoTela } from './ModelLoader.js';
import { crearControles } from './Controls.js';
import { Animator } from './Animator.js';
import { COLORES } from '../data/colores.js';
import rutaModelo from '../assets/models/camisa.glb';

const FOTOGRAFIAS_TRAS_INTERACCION = 26;

/**
 * Configurator3D: orquesta el visor 3D del configurador.
 * Único punto de entrada que conecta escena, cámara, renderer,
 * luces, modelo, controles y animaciones. Expone el ciclo de vida
 * (montar / aplicarSeleccion / dispose) que usa el componente.
 */
export class Configurator3D {
  /**
   * @param {HTMLElement} contenedor - Elemento donde se monta el canvas.
   */
  constructor(contenedor) {
    this.contenedor = contenedor;
    this._escena = crearEscena();
    this._camara = crearCamara();
    this._renderizador = crearRenderer(contenedor);
    this._luces = crearLuces(this._escena, this._renderizador);
    this._controles = crearControles(this._camara, this._renderizador);
    this._animador = null;
    this._modelo = null;
    this._seleccion = null;

    this._raf = 0;
    this._fotogramas = 0;
    this._destruido = false;
    this._observador = null;

    this._redimensionar();
    this._observador = new ResizeObserver(() => this._redimensionar());
    this._observador.observe(contenedor);
  }

  /** Carga el modelo, encuadra la cámara y arranca la animación. */
  async montar() {
    this._iniciarBucle();

    try {
      const modelo = await cargarModelo(rutaModelo);
      if (this._destruido) {
        disponerModelo(modelo);
        return;
      }

      this._modelo = modelo;
      this._escena.add(modelo);

      aplicarAcabadoTela(modelo);
      if (this._seleccion) this._aplicarSeleccion(this._seleccion);

      const caja = centrarModelo(modelo);
      const { distancia } = ajustarCamaraAlModelo(this._camara, caja);
      this._controles.minDistance = distancia * 0.82;
      this._controles.maxDistance = distancia * 1.28;
      this._controles.target.set(0, 0, 0);
      this._controles.update();

      this._animador = new Animator({
        camara: this._camara,
        controles: this._controles,
        modelo,
        contenedor: this.contenedor
      });
      this._animador.definirPosicionInicial();
      this._animador.reproducirIntro();
      this._vincularInteraccion();

      this.contenedor.dataset.modeloListo = 'true';
      this._solicitarRender();
      if (import.meta.env.DEV) window.__tambo3D = this;
    } catch (error) {
      console.error('[Configurator3D] No se pudo cargar el modelo:', error);
      this.contenedor.dataset.modeloError = 'true';
    }
  }

  /**
   * Aplica la selección del configurador sobre el modelo 3D.
   * Por ahora solo colorea la camiseta; el logo se conectará más adelante.
   * @param {{ color: string, logo: string }} seleccion
   */
  aplicarSeleccion(seleccion) {
    this._seleccion = seleccion;
    this._aplicarSeleccion(seleccion);
  }

  /** Colorea los materiales del modelo con el hex del color elegido. */
  _aplicarSeleccion({ color }) {
    if (!this._modelo) return;

    const hex = COLORES.find((c) => c.id === color)?.hex;
    if (!hex) return;

    this._modelo.traverse((objeto) => {
      if (!objeto.isMesh) return;
      const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
      materiales.forEach((material) => material.color?.set(hex));
    });
    this._solicitarRender();
  }

  _vincularInteraccion() {
    this._controles.addEventListener('start', () => {
      this._animador?.alInteractuar();
      this._fotogramas = 999999;
    });
    this._controles.addEventListener('change', () => {
      this._fotogramas = Math.max(this._fotogramas, 4);
    });
    this._controles.addEventListener('end', () => {
      this._fotogramas = FOTOGRAFIAS_TRAS_INTERACCION;
      this._animador?.programarRetorno();
    });
  }

  _redimensionar() {
    const ancho = this.contenedor.clientWidth || 1;
    const alto = this.contenedor.clientHeight || 1;
    redimensionar(this._renderizador, ancho, alto);
    ajustarProporcion(this._camara, ancho, alto);
    if (this._modelo) this._fotogramas = Math.max(this._fotogramas, 2);
  }

  _solicitarRender() {
    this._fotogramas = Math.max(this._fotogramas, 2);
  }

  /** Bucle on-demand: solo renderiza cuando hay algo que pintar. */
  _iniciarBucle() {
    const ciclo = () => {
      if (this._destruido) return;
      this._raf = requestAnimationFrame(ciclo);

      const animando = this._animador?.tieneAnimacion();
      if (animando || this._fotogramas > 0) {
        if (this._fotogramas > 0) this._fotogramas--;
        this._controles.update();
        this._renderizador.render(this._escena, this._camara);
      }
    };
    this._raf = requestAnimationFrame(ciclo);
  }

  /**
   * Medición de encuadre para verificación (solo dev).
   * Proyecta el bounding box del modelo a la pantalla y reporta
   * centrado, ocupación y distancia de cámara.
   * @returns {object|null}
   */
  medir() {
    if (!this._modelo) return null;

    const caja = new THREE.Box3().setFromObject(this._modelo);
    const camara = this._camara;
    const canvas = this._renderizador.domElement;
    const v = new THREE.Vector3();
    const esquinas = [
      [caja.min.x, caja.min.y, caja.min.z],
      [caja.max.x, caja.min.y, caja.min.z],
      [caja.min.x, caja.max.y, caja.min.z],
      [caja.max.x, caja.max.y, caja.min.z],
      [caja.min.x, caja.min.y, caja.max.z],
      [caja.max.x, caja.min.y, caja.max.z],
      [caja.min.x, caja.max.y, caja.max.z],
      [caja.max.x, caja.max.y, caja.max.z]
    ];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let dentro = true;

    esquinas.forEach(([x, y, z]) => {
      v.set(x, y, z).project(camara);
      if (v.z > 1 || v.z < -1) dentro = false;
      const sx = ((v.x + 1) / 2) * canvas.clientWidth;
      const sy = ((1 - v.y) / 2) * canvas.clientHeight;
      minX = Math.min(minX, sx);
      maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy);
      maxY = Math.max(maxY, sy);
    });

    const tam = caja.getSize(v);
    return {
      canvas: { w: canvas.clientWidth, h: canvas.clientHeight },
      caja: { min: caja.min.toArray(), max: caja.max.toArray(), tam: tam.toArray() },
      camara: { pos: camara.position.toArray(), distancia: camara.position.distanceTo(this._controles.target) },
      controles: {
        min: this._controles.minDistance,
        max: this._controles.maxDistance,
        polar: this._controles.getPolarAngle(),
        azimut: this._controles.getAzimuthalAngle()
      },
      encuadre: { minX, maxX, minY, maxY, dentro },
      ocupacionW: (maxX - minX) / canvas.clientWidth,
      ocupacionH: (maxY - minY) / canvas.clientHeight,
      centro: { x: (minX + maxX) / 2 / canvas.clientWidth, y: (minY + maxY) / 2 / canvas.clientHeight }
    };
  }

  /** Libera todos los recursos del visor 3D. */
  dispose() {
    this._destruido = true;
    cancelAnimationFrame(this._raf);
    this._observador?.disconnect();
    this._animador?.dispose();
    this._controles.dispose();
    if (this._modelo) disponerModelo(this._modelo);
    this._renderizador.dispose();
    this._renderizador.domElement.remove();
    if (window.__tambo3D === this) window.__tambo3D = null;
  }
}
