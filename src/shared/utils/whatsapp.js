import { SITIO } from '../../data/site.js';

/**
 * Construye la etiqueta legible de una combinación, p. ej. "Negro · TAMBO ACTIVE".
 * @param {string} colorId
 * @param {string} logoId
 * @param {Array} colores
 * @param {Array} logos
 * @returns {string}
 */
export function etiquetaCombinacion(colorId, logoId, colores, logos) {
  const color = colores.find((c) => c.id === colorId);
  const logo = logos.find((l) => l.id === logoId);
  return `${color ? color.label : colorId} · ${logo ? logo.label : logoId}`;
}

/**
 * Genera el enlace de WhatsApp con el mensaje de la combinación.
 * @param {string} colorId
 * @param {string} logoId
 * @param {Array} colores
 * @param {Array} logos
 * @returns {string}
 */
export function enlaceWhatsApp(colorId, logoId, colores, logos) {
  const mensaje = `Hola Tambo Active, quiero solicitar la camiseta en color ${etiquetaCombinacion(
    colorId,
    logoId,
    colores,
    logos
  )}`;
  return `https://wa.me/${SITIO.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
}
