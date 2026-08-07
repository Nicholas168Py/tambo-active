import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Controls: orbit controls con restricciones para que el modelo nunca
 * se pierda de vista.
 * - Rotación horizontal libre.
 * - Rotación vertical limitada.
 * - Zoom muy limitado.
 * - Pan deshabilitado.
 * - Damping suave.
 * @param {THREE.Camera} camara
 * @param {THREE.WebGLRenderer} renderizador
 * @param {{ distancia?: number }} limites - Rango de zoom relativo al encuadre inicial.
 * @returns {import('three/examples/jsm/controls/OrbitControls.js').OrbitControls}
 */
export function crearControles(camara, renderizador, limites = {}) {
  const controles = new OrbitControls(camara, renderizador.domElement);

  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.enablePan = false;
  controles.autoRotate = false;
  controles.enableZoom = true;
  controles.minPolarAngle = Math.PI * 0.18;
  controles.maxPolarAngle = Math.PI * 0.72;

  if (limites.distancia) {
    controles.minDistance = limites.distancia * 0.82;
    controles.maxDistance = limites.distancia * 1.28;
  }

  return controles;
}
