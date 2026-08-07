import * as THREE from 'three';

/**
 * Scene: crea la escena 3D independiente del configurador.
 * El fondo es transparente (lo define el renderer), de modo que el
 * modelo se integra con el diseño actual de la landing.
 * @returns {THREE.Scene}
 */
export function crearEscena() {
  return new THREE.Scene();
}
