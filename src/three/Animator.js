import gsap from 'gsap';
import * as THREE from 'three';
import { prefiereMovimientoReducido } from '../shared/utils/reduceMotion.js';

const ESPERA_RETORNO = 4000;
const ROTACION_INTRO = -0.15;

/**
 * Animator: animaciones GSAP del configurador 3D.
 * - Intro elegante (fade + escala + ligera rotación) al cargar.
 * - Auto-retorno suave a la posición inicial tras unos segundos sin
 *   interacción.
 * Respeta prefers-reduced-motion (sin tween de retorno).
 */
export class Animator {
  /**
   * @param {{ camara: THREE.Camera, controles: import('three/examples/jsm/controls/OrbitControls.js').OrbitControls, modelo: THREE.Object3D, contenedor: HTMLElement }} opciones
   */
  constructor({ camara, controles, modelo, contenedor }) {
    this.camara = camara;
    this.controles = controles;
    this.modelo = modelo;
    this.contenedor = contenedor;
    this.movimientoReducido = prefiereMovimientoReducido();

    this._tween = null;
    this._temporizador = null;
    this._inicio = null;
  }

  /** Captura la posición inicial (esférica) como destino del auto-retorno. */
  definirPosicionInicial() {
    this._inicio = this._esferico();
  }

  /** Animación de entrada: fade + escala + rotación, muy sutil. */
  reproducirIntro() {
    if (this.movimientoReducido) {
      this.contenedor.style.opacity = '1';
      return;
    }

    gsap.set(this.contenedor, { opacity: 0 });
    this.modelo.scale.setScalar(0.86);
    this.modelo.rotation.y = ROTACION_INTRO;

    const tl = gsap.timeline({ onComplete: () => (this._tween = null) });
    this._tween = tl;
    tl.to(this.modelo.rotation, { y: 0, duration: 1.1, ease: 'power2.out' }, 0)
      .to(this.modelo.scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'power3.out' }, 0)
      .to(this.contenedor, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.1);
  }

  /** El usuario interactúa: cancela tween y retorno pendiente. */
  alInteractuar() {
    this._cancelarTween();
    this._limpiarRetorno();
  }

  /** Programa el auto-retorno tras unos segundos sin interacción. */
  programarRetorno() {
    if (this.movimientoReducido) return;
    this._limpiarRetorno();
    this._temporizador = setTimeout(() => {
      this._temporizador = null;
      this._regresarAlInicio();
    }, ESPERA_RETORNO);
  }

  /** ¿Hay una animación en curso (para el bucle de render)? */
  tieneAnimacion() {
    return !!this._tween;
  }

  /** Libera tween y temporizador. */
  dispose() {
    this._cancelarTween();
    this._limpiarRetorno();
  }

  _regresarAlInicio() {
    const actual = this._esferico();
    const inicio = this._inicio;
    if (!inicio) return;

    const objetivo = {
      theta: actual.theta,
      phi: actual.phi,
      radio: actual.radio
    };
    let deltaTheta = inicio.theta - actual.theta;
    deltaTheta = ((deltaTheta + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

    if (Math.abs(deltaTheta) < 0.001 && Math.abs(inicio.phi - actual.phi) < 0.001) return;

    const tween = gsap.to(objetivo, {
      theta: actual.theta + deltaTheta,
      phi: inicio.phi,
      radio: inicio.radio,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => this._aplicar(objetivo),
      onComplete: () => (this._tween = null)
    });
    this._tween = tween;
  }

  /** Posición de la cámara en coordenadas esféricas alrededor del objetivo. */
  _esferico() {
    const offset = this.camara.position.clone().sub(this.controles.target);
    const radio = offset.length();
    return {
      radio,
      theta: Math.atan2(offset.x, offset.z),
      phi: Math.acos(THREE.MathUtils.clamp(offset.y / radio, -1, 1))
    };
  }

  /** Aplica las coordenadas esféricas a la cámara. */
  _aplicar({ radio, theta, phi }) {
    const offset = new THREE.Vector3().setFromSphericalCoords(radio, phi, theta);
    this.camara.position.copy(this.controles.target).add(offset);
    this.controles.update();
  }

  _cancelarTween() {
    if (this._tween) {
      this._tween.kill();
      this._tween = null;
    }
  }

  _limpiarRetorno() {
    if (this._temporizador) {
      clearTimeout(this._temporizador);
      this._temporizador = null;
    }
  }
}
