/**
 * Utilidades genéricas reutilizables.
 */

/**
 * Activa el lazy loading de una imagen: copia `data-src` a `src`.
 * @param {HTMLImageElement} img
 */
export function cargarImagen(img) {
  const src = img.dataset.src;
  if (src) {
    img.src = src;
    img.removeAttribute('data-src');
  }
}

/**
 * Limita la frecuencia de ejecución de una función.
 * @param {Function} fn
 * @param {number} espera - Milisegundos.
 * @returns {Function}
 */
export function debounce(fn, espera = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), espera);
  };
}
