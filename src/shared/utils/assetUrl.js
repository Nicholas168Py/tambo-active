/**
 * Resuelve una ruta de asset público respetando el base de Vite.
 * @param {string} path - Ruta dentro de public/, con o sin '/' inicial.
 * @returns {string}
 */
export function assetUrl(path) {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return import.meta.env.BASE_URL + clean;
}
