import * as THREE from 'three';

const FOV = 32;

/**
 * Camera: cámara perspectiva y ajuste automático al modelo.
 * Encuadre calculado para que la camiseta quede centrada y nunca
 * cortada, sin importar el tamaño del GLB.
 * @returns {THREE.PerspectiveCamera}
 */
export function crearCamara() {
  const camara = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camara.position.set(0, 0.3, 4);
  return camara;
}

/**
 * Mantiene la proporción del canvas al redimensionar.
 * @param {THREE.PerspectiveCamera} camara
 * @param {number} ancho
 * @param {number} alto
 */
export function ajustarProporcion(camara, ancho, alto) {
  camara.aspect = ancho / alto;
  camara.updateProjectionMatrix();
}

/**
 * Encuadra la cámara al bounding box del modelo: lo centra en la
 * vista y elige la distancia mínima que lo contiene por completo.
 * @param {THREE.PerspectiveCamera} camara
 * @param {THREE.Box3} caja
 * @returns {{ distancia: number, centro: THREE.Vector3 }}
 */
export function ajustarCamaraAlModelo(camara, caja) {
  const tam = caja.getSize(new THREE.Vector3());
  const centro = caja.getCenter(new THREE.Vector3());
  const fovV = THREE.MathUtils.degToRad(camara.fov);
  const fovH = 2 * Math.atan(Math.tan(fovV * 0.5) * camara.aspect);
  const distV = tam.y * 0.5 / Math.tan(fovV * 0.5);
  const distH = tam.x * 0.5 / Math.tan(fovH * 0.5);
  const distancia = Math.max(distV, distH) * 1.12;

  camara.position.set(centro.x, centro.y, centro.z + distancia);
  return { distancia, centro };
}
