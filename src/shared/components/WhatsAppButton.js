import { whatsappSvg } from '../icons/index.js';

/**
 * WhatsAppButton: botón "Comprar por WhatsApp" reutilizable
 * (componente sin estado / renderless).
 *
 * Uso:
 *   whatsappButton({ text, href, iconClass, classes }) -> string HTML
 *
 * @param {object} opciones
 * @param {string} opciones.text        - Texto del botón.
 * @param {string} [opciones.href]      - Enlace estático (si no se pasa, usa "#").
 * @param {string} [opciones.id]        - Id opcional del enlace.
 * @param {string} [opciones.iconClass] - Clases del icono.
 * @param {string} [opciones.classes]   - Clases del enlace.
 * @param {string} [opciones.target]    - Si se pasa, añade target="_blank" rel="noopener".
 * @returns {string}
 */
export function whatsappButton({
  text,
  href = '#',
  id = null,
  iconClass = 'w-5 h-5',
  classes = '',
  target = null
} = {}) {
  const idAttr = id ? ` id="${id}"` : '';
  const targetAttr = target ? ` target="_blank" rel="noopener"` : '';
  return `<a${idAttr}${targetAttr} class="${classes}" href="${href}">${whatsappSvg(iconClass)}${text}</a>`;
}
