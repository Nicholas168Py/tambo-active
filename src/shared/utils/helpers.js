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
