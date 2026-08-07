import * as THREE from 'three';

const DPR_MAX = 2;

/**
 * Renderer: renderizador WebGL transparente y optimizado.
 * - Fondo transparente (alpha) para integrarse con la landing.
 * - Pixel ratio limitado para rendimiento en pantallas de alta densidad.
 * - Tone mapping cinematográfico para un acabado premium.
 * @param {HTMLElement} contenedor
 * @returns {THREE.WebGLRenderer}
 */
export function crearRenderer(contenedor) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_MAX));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  renderer.domElement.classList.add('config-3d-canvas');
  contenedor.appendChild(renderer.domElement);
  return renderer;
}

/**
 * Ajusta el buffer del renderer al tamaño del contenedor.
 * El tamaño visual lo controla CSS (100% del contenedor).
 * @param {THREE.WebGLRenderer} renderer
 * @param {number} ancho
 * @param {number} alto
 */
export function redimensionar(renderer, ancho, alto) {
  renderer.setSize(ancho, alto, false);
}
