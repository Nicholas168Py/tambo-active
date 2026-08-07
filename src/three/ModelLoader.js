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
 * deportiva real: superficie mate (roughness alto, sin metal), sheen de
 * fibra, bump map de tejido y oclusión ambiental en los pliegues para
 * que el blanco conserve volumen, relieve y detalle.
 * @param {THREE.Object3D} modelo
 */
export function aplicarAcabadoTela(modelo) {
  modelo.traverse((objeto) => {
    if (!objeto.isMesh) return;
    const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
    const colorBase = (materiales[0]?.color ?? new THREE.Color(0xffffff)).clone();

    const geo = objeto.geometry;
    if (geo.attributes.uv && !geo.attributes.uv2) {
      geo.setAttribute('uv2', geo.attributes.uv.clone());
    }

    const nuevo = new THREE.MeshPhysicalMaterial({
      color: colorBase,
      roughness: 0.92,
      metalness: 0,
      clearcoat: 0,
      sheen: 0.45,
      sheenRoughness: 0.9,
      envMapIntensity: 0.4,
      bumpMap: texturaTejido(),
      bumpScale: 0.12,
      aoMap: texturaAO(),
      aoMapIntensity: 0.6
    });

    objeto.material = Array.isArray(objeto.material) ? [nuevo] : nuevo;
    objeto.castShadow = true;
    objeto.receiveShadow = true;

    materiales.forEach((material) => {
      for (const clave in material) {
        const valor = material[clave];
        if (valor?.isTexture) valor.dispose();
      }
      material.dispose();
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
 * AO map procedimental: ondas suaves de oclusión que oscurecen los
 * pliegues y dan profundidad sin negros duros.
 * @returns {THREE.CanvasTexture}
 */
function texturaAO() {
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
      const onda = Math.sin((y + Math.sin(x * 0.04) * 20) * 0.09) * 24 + Math.sin((x + y) * 0.06) * 14;
      const v = Math.max(0, Math.min(255, 205 + onda));
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
  textura.repeat.set(2, 3);
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
