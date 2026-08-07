import { whatsappSvg } from '../icons/index.js';
import { enlaceWhatsApp } from '../utils/whatsapp.js';
import { COLORES } from '../../data/colores.js';
import { LOGOS } from '../../data/logos.js';
import { store } from '../../core/Store.js';

/**
 * WhatsAppButton: botón "Comprar por WhatsApp" reutilizable
 * (componente sin estado / renderless).
 *
 * Uso:
 *   whatsappButton({ text, href, iconClass, classes }) -> string HTML
 *
 * Si `href` se omite, el botón se enlaza automáticamente a la
 * selección actual del configurador vía `enlazarWhatsApp()`.
 *
 * @param {object} opciones
 * @param {string} opciones.text        - Texto del botón.
 * @param {string} [opciones.href]      - Enlace estático (si no se pasa, se deriva del Store).
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

/**
 * Enlaza un elemento `<a>` a la selección actual del configurador.
 * Actualiza el `href` cuando cambia la selección en el Store.
 *
 * @param {HTMLAnchorElement} enlace
 * @returns {Function} Función para desuscribirse.
 */
export function enlazarWhatsApp(enlace) {
  const aplicar = ({ color, logo }) => {
    enlace.href = enlaceWhatsApp(color, logo, COLORES, LOGOS);
  };

  const seleccion = store.get('seleccion');
  if (seleccion) aplicar(seleccion);

  return store.subscribe('seleccion', aplicar);
}
