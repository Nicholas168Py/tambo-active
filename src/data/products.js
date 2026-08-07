import { LOGOS } from './logos.js';
import { assetUrl } from '../shared/utils/assetUrl.js';

/**
 * Imagen por defecto de cada color.
 * Para una variante específica según el logo, define la ruta en
 * `PRODUCTOS[color][logo]` (p. ej. PRODUCTOS.negro.nike = '...').
 *
 * Compatibilidad de formato: las rutas apuntan a PNG. Para usar WebP,
 * basta con añadir la variante `.webp` junto al PNG y actualizar la ruta;
 * el error handler mantiene el fallback a la camiseta hero.
 */
const IMAGEN_POR_COLOR = {
  blanco: assetUrl('camisetas/blanco.png'),
  azul: assetUrl('camisetas/azul.png'),
  negro: assetUrl('camisetas/negro.png'),
  gris: assetUrl('camisetas/gris.png'),
  'verde-oliva': assetUrl('camisetas/verde-oliva.png'),
  'verde-menta': assetUrl('camisetas/verde-menta.png')
};

/**
 * Catálogo de variantes: PRODUCTOS[color][logo] -> ruta de imagen.
 * Data driven: toda la app consume este mapa.
 */
export const PRODUCTOS = Object.fromEntries(
  Object.entries(IMAGEN_POR_COLOR).map(([color, img]) => [
    color,
    Object.fromEntries(LOGOS.map((logo) => [logo.id, img]))
  ])
);

/**
 * Resuelve la ruta de la variante seleccionada.
 */
export function rutaProducto(colorId, logoId) {
  return PRODUCTOS[colorId]?.[logoId] ?? null;
}
