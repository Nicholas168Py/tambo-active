import * as THREE from 'three';
import { crearEscena } from './Scene.js';
import { crearCamara, ajustarProporcion, ajustarCamaraAlModelo } from './Camera.js';
import { crearRenderer, redimensionar } from './Renderer.js';
import { crearLuces } from './Lights.js';
import { cargarModelo, centrarModelo, disponerModelo, aplicarAcabadoTela } from './ModelLoader.js';
import { crearControles } from './Controls.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { Animator } from './Animator.js';
import { COLORES } from '../data/colores.js';
import { LOGOS } from '../data/logos.js';
import rutaModelo from '../assets/models/camisa.glb';

const FOTOGRAFIAS_TRAS_INTERACCION = 26;
const LOGO_ALTURA_PECHO = 0.75;
const LOGO_X_PECHO = 0.27;
const LOGO_TAMANO_MAX = 0.16;
const LOGO_ESPESOR = 0.15;
const PECHO_EXPANSION = 0.22;
const PECHO_PROFUNDIDAD = 0.2;

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

    this._caja = null;
    this._cargadorTexturas = new THREE.TextureLoader();
    this._raycaster = new THREE.Raycaster();
    this._texturas = new Map();
    this._logoIdActual = null;
    this._logoMalla = null;
    this._logoMaterial = null;
    this._decalGeometrias = new Map();
    this._frenteReducido = null;
    this._posicionLogo = null;
    this._orientacionLogo = null;

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
      this._caja = caja;
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
   * Aplica la selección del configurador sobre el modelo 3D:
   * colorea la camiseta y coloca el logo en el pecho.
   * @param {{ color: string, logo: string }} seleccion
   */
  aplicarSeleccion(seleccion) {
    this._seleccion = seleccion;
    this._aplicarSeleccion(seleccion);
  }

  /** Colorea los materiales del modelo con el hex del color elegido. */
  _aplicarSeleccion({ color, logo }) {
    if (!this._modelo) return;

    const hex = COLORES.find((c) => c.id === color)?.hex;
    if (hex) {
      this._modelo.traverse((objeto) => {
        if (!objeto.isMesh || objeto === this._logoMalla) return;
        const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
        materiales.forEach((material) => material.color?.set(hex));
      });
    }

    this._aplicarLogo(logo);
    this._solicitarRender();
  }

  /**
   * Coloca en el pecho la textura del logo seleccionado.
   * @param {string} logoId
   */
  _aplicarLogo(logoId) {
    this._logoIdActual = logoId;
    if (!this._modelo) return;

    const logo = LOGOS.find((l) => l.id === logoId);
    if (!logo || !logo.src) {
      this._quitarLogo();
      return;
    }

    this._cargarTextoLogo(logo.src).then((texto) => {
      if (this._destruido || this._logoIdActual !== logoId || !this._modelo) return;
      this._colocarLogo(texto, logo.tamanoMax);
    });
  }

  /**
   * Carga (y cachea) la textura del logo.
   * @param {string} url
   * @returns {Promise<THREE.Texture>}
   */
  _cargarTextoLogo(url) {
    if (!this._texturas.has(url)) {
      this._texturas.set(
        url,
        new Promise((resolver, rechazar) => {
          this._cargadorTexturas.load(
            url,
            (texto) => {
              texto.colorSpace = THREE.SRGBColorSpace;
              texto.anisotropy = Math.min(8, this._renderizador.capabilities.getMaxAnisotropy());
              resolver(texto);
            },
            undefined,
            rechazar
          );
        })
      );
    }
    return this._texturas.get(url);
  }

  /**
   * Crea/actualiza el logo sobre el pecho. El logo se pega a la superficie
   * con DecalGeometry sobre una fracción reducida de la malla (solo los
   * triángulos cercanos al punto de impacto), evitando que quede flotando
   * o recortado y siguiendo la curvatura del pecho.
   * @param {THREE.Texture} texto
   * @param {number} [tamanoMax] - Tamaño máximo propio del logo (por defecto LOGO_TAMANO_MAX).
   */
  _colocarLogo(texto, tamanoMax = LOGO_TAMANO_MAX) {
    const anchoImg = texto.image?.width || 1;
    const altoImg = texto.image?.height || 1;
    const aspecto = anchoImg / altoImg;
    const ancho = aspecto >= 1 ? tamanoMax : tamanoMax * aspecto;
    const alto = aspecto >= 1 ? tamanoMax / aspecto : tamanoMax;

    const decal = this._obtenerDecal(ancho, alto);
    if (!decal) {
      this._quitarLogo();
      return;
    }

    if (!this._logoMalla) {
      this._logoMaterial = new THREE.MeshBasicMaterial({
        map: texto,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -24
      });
      this._logoMalla = new THREE.Mesh(decal, this._logoMaterial);
      this._logoMalla.renderOrder = 1;
      this._modelo.add(this._logoMalla);
    }

    this._logoMalla.geometry = decal;
    this._logoMaterial.map = texto;
    this._logoMaterial.needsUpdate = true;
    this._logoMalla.visible = true;
    this._solicitarRender();
  }

  /**
   * Obtiene (y cachea) la geometría del decal del logo para un tamaño dado.
   * @param {number} ancho
   * @param {number} alto
   * @returns {THREE.BufferGeometry|null}
   */
  _obtenerDecal(ancho, alto) {
    const clave = ancho.toFixed(4) + 'x' + alto.toFixed(4);
    if (!this._decalGeometrias.has(clave)) {
      const frente = this._obtenerFrenteReducido();
      if (!frente) return null;
      this._decalGeometrias.set(
        clave,
        new DecalGeometry(frente, this._posicionLogo, this._orientacionLogo, new THREE.Vector3(ancho, alto, LOGO_ESPESOR))
      );
    }
    return this._decalGeometrias.get(clave);
  }

  /**
   * Malla reducida con los triángulos del pecho (espacio local del modelo),
   * suficiente para el DecalGeometry sin recorrer las ~500k caras completas.
   * Se construye una única vez y se cachea.
   * @returns {THREE.Mesh|null}
   */
  _obtenerFrenteReducido() {
    if (this._frenteReducido) return this._frenteReducido;

    const malla = this._modelo.getObjectByProperty('isMesh', true);
    if (!malla) return null;

    const geo = malla.geometry;
    const pos = geo.attributes.position;
    const normal = geo.attributes.normal;
    const indice = geo.index;
    if (!pos || !indice) return null;

    const cajaMundo = new THREE.Box3().setFromObject(this._modelo);
    const yCentro = cajaMundo.min.y + (cajaMundo.max.y - cajaMundo.min.y) * LOGO_ALTURA_PECHO;

    this._raycaster.set(new THREE.Vector3(LOGO_X_PECHO, yCentro, 20), new THREE.Vector3(0, 0, -1));
    const golpes = this._raycaster.intersectObject(this._modelo, true);
    if (!golpes.length) return null;
    const golpe = golpes[0];

    this._posicionLogo = new THREE.Vector3(
      LOGO_X_PECHO - this._modelo.position.x,
      yCentro - this._modelo.position.y,
      golpe.point.z - this._modelo.position.z
    );
    this._orientacionLogo = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      golpe.face.normal.clone().normalize()
    );

    const aabbMin = new THREE.Vector3(
      LOGO_X_PECHO - PECHO_EXPANSION,
      yCentro - PECHO_EXPANSION,
      golpe.point.z - PECHO_PROFUNDIDAD
    ).sub(this._modelo.position);
    const aabbMax = new THREE.Vector3(
      LOGO_X_PECHO + PECHO_EXPANSION,
      yCentro + PECHO_EXPANSION,
      golpe.point.z + PECHO_PROFUNDIDAD
    ).sub(this._modelo.position);

    const verts = [];
    const normales = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const nTri = indice.count / 3;

    for (let t = 0; t < nTri; t++) {
      const i0 = indice.getX(t * 3);
      const i1 = indice.getX(t * 3 + 1);
      const i2 = indice.getX(t * 3 + 2);
      a.fromBufferAttribute(pos, i0);
      b.fromBufferAttribute(pos, i1);
      c.fromBufferAttribute(pos, i2);

      const minX = Math.min(a.x, b.x, c.x);
      const maxX = Math.max(a.x, b.x, c.x);
      const minY = Math.min(a.y, b.y, c.y);
      const maxY = Math.max(a.y, b.y, c.y);
      const minZ = Math.min(a.z, b.z, c.z);
      const maxZ = Math.max(a.z, b.z, c.z);
      if (maxX < aabbMin.x || minX > aabbMax.x || maxY < aabbMin.y || minY > aabbMax.y || maxZ < aabbMin.z || minZ > aabbMax.z) {
        continue;
      }

      verts.push(pos.getX(i0), pos.getY(i0), pos.getZ(i0));
      verts.push(pos.getX(i1), pos.getY(i1), pos.getZ(i1));
      verts.push(pos.getX(i2), pos.getY(i2), pos.getZ(i2));
      if (normal) {
        normales.push(normal.getX(i0), normal.getY(i0), normal.getZ(i0));
        normales.push(normal.getX(i1), normal.getY(i1), normal.getZ(i1));
        normales.push(normal.getX(i2), normal.getY(i2), normal.getZ(i2));
      }
    }

    if (!verts.length) return null;

    const reducida = new THREE.BufferGeometry();
    reducida.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    if (normales.length) reducida.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3));

    this._frenteReducido = new THREE.Mesh(reducida);
    this._frenteReducido.updateMatrixWorld(true);
    return this._frenteReducido;
  }

  /** Oculta el logo del pecho. */
  _quitarLogo() {
    if (this._logoMalla) this._logoMalla.visible = false;
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
    this._texturas.forEach((texto) => texto.then?.((t) => t.dispose()));
    this._logoMaterial?.dispose();
    if (this._logoMalla) {
      this._modelo?.remove(this._logoMalla);
      this._logoMalla.geometry.dispose();
    }
    this._decalGeometrias.forEach((g) => g.dispose());
    if (this._frenteReducido) this._frenteReducido.geometry.dispose();
    this._renderizador.dispose();
    this._renderizador.domElement.remove();
    if (window.__tambo3D === this) window.__tambo3D = null;
  }
}
