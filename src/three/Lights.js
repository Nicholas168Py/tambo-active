import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Lights: iluminación tipo estudio con contraste para revelar el volumen
 * de la tela (clave para el blanco, que tiende a verse plano).
 * - Luz principal (key): directional suave desde arriba-izquierda, con
 *   shadow map que define los pliegues de la tela.
 * - Luz de relleno: hemisphere MUY suave para no eliminar las sombras.
 * - Luz de borde (rim): contraluz que separa la prenda del fondo.
 * El environment map (PMREM) aporta reflejos suaves sin aplanar el mate.
 * @param {THREE.Scene} escena
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{ principal: THREE.DirectionalLight, relleno: THREE.HemisphereLight, borde: THREE.DirectionalLight }}
 */
export function crearLuces(escena, renderer) {
  const principal = new THREE.DirectionalLight(0xffffff, 1.15);
  principal.position.set(-2.5, 3.5, 4.5);
  principal.castShadow = true;
  principal.shadow.mapSize.set(2048, 2048);
  const sombra = principal.shadow;
  sombra.camera.left = -1.8;
  sombra.camera.right = 1.8;
  sombra.camera.top = 1.8;
  sombra.camera.bottom = -1.8;
  sombra.camera.near = 0.5;
  sombra.camera.far = 12;
  sombra.bias = -0.0004;
  sombra.normalBias = 0.02;
  sombra.radius = 4;

  const relleno = new THREE.HemisphereLight(0xffffff, 0x141414, 0.3);

  const borde = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  borde.position.set(-3, 1.5, -4);

  escena.add(principal, relleno, borde);

  const entorno = generarEntorno(renderer);
  if (entorno) escena.environment = entorno;

  return { principal, relleno, borde };
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
