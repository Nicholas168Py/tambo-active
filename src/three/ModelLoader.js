import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * ModelLoader: carga y prepara el modelo GLB del configurador.
 * Únicamente manipula el modelo; la escena y la cámara se encargan
 * del resto.
 */

/**
 * Carga un modelo GLB y resuelve con la escena raíz del glTF.
 * @param {string} url
 * @returns {Promise<THREE.Group>}
 */
export function cargarModelo(url) {
  const loader = new GLTFLoader();
  return new Promise((resolver, rechazar) => {
    loader.load(url, (gltf) => resolver(gltf.scene), undefined, rechazar);
  });
}

/**
 * Centra el modelo en el origen para que la cámara lo enfoque y el
 * pivote de rotación quede en su centro geométrico.
 * @param {THREE.Object3D} modelo
 * @returns {THREE.Box3} Caja ya centrada.
 */
export function centrarModelo(modelo) {
  const caja = new THREE.Box3().setFromObject(modelo);
  const centro = caja.getCenter(new THREE.Vector3());
  modelo.position.sub(centro);
  return new THREE.Box3().setFromObject(modelo);
}

/**
 * Ajusta los materiales del modelo para que el acabado parezca tela
 * y no plástico: superficie mate (roughness alto, sin metal), reflejos
 * de entorno suaves y un bump map procedimental con tejido sutil.
 * @param {THREE.Object3D} modelo
 */
export function aplicarAcabadoTela(modelo) {
  modelo.traverse((objeto) => {
    if (!objeto.isMesh) return;
    const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
    materiales.forEach((material) => {
      if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) return;
      material.roughness = 0.95;
      material.metalness = 0;
      material.envMapIntensity = 0.35;
      material.bumpMap = texturaTejido();
      material.bumpScale = 0.08;
      material.needsUpdate = true;
    });
  });
}

/**
 * Genera una textura de tejido procedimental (canvas) para el bump map.
 * @returns {THREE.CanvasTexture}
 */
function texturaTejido() {
  const ancho = 256;
  const alto = 256;
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const contexto = canvas.getContext('2d');
  const datos = contexto.createImageData(ancho, alto);

  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * 4;
      const trama = 6 * Math.sin((x * Math.PI) / 9) + 6 * Math.cos((y * Math.PI) / 9);
      const ruido = (Math.random() - 0.5) * 8;
      const v = 128 + trama + ruido;
      datos.data[i] = v;
      datos.data[i + 1] = v;
      datos.data[i + 2] = v;
      datos.data[i + 3] = 255;
    }
  }
  contexto.putImageData(datos, 0, 0);

  const textura = new THREE.CanvasTexture(canvas);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(3, 3);
  return textura;
}

/**
 * Libera geometrías, materiales y texturas del modelo.
 * @param {THREE.Object3D} modelo
 */
export function disponerModelo(modelo) {
  modelo.traverse((objeto) => {
    if (!objeto.isMesh) return;
    objeto.geometry?.dispose();

    const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
    materiales.forEach((material) => {
      for (const clave in material) {
        const valor = material[clave];
        if (valor?.isTexture) valor.dispose();
      }
      material.dispose();
    });
  });
}
