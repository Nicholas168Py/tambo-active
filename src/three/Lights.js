import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Lights: iluminación elegante de la escena.
 * Ambient + Hemisphere + Directional, más un EnvironmentMap de estudio
 * (PMREM) para reflejos suaves que dan acabado premium sin sombras
 * exageradas.
 * @param {THREE.Scene} escena
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{ ambiental: THREE.AmbientLight, hemisferio: THREE.HemisphereLight, direccional: THREE.DirectionalLight }}
 */
export function crearLuces(escena, renderer) {
  const ambiental = new THREE.AmbientLight(0xffffff, 0.45);
  const hemisferio = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.55);
  const direccional = new THREE.DirectionalLight(0xffffff, 1.1);
  direccional.position.set(2, 3.5, 4);

  escena.add(ambiental, hemisferio, direccional);

  const entorno = generarEntorno(renderer);
  if (entorno) escena.environment = entorno;

  return { ambiental, hemisferio, direccional };
}

/**
 * Genera un mapa de entorno tipo estudio. Si falla, la escena sigue
 * con la iluminación directa.
 * @param {THREE.WebGLRenderer} renderer
 * @returns {THREE.Texture | null}
 */
function generarEntorno(renderer) {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const textura = pmrem.fromScene(new RoomEnvironment()).texture;
    pmrem.dispose();
    return textura;
  } catch {
    return null;
  }
}
