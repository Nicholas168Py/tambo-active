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
 * Enlace genérico de WhatsApp con mensaje de "quiero más información".
 * @returns {string}
 */
export function enlaceWhatsAppInformacion() {
  const mensaje = 'Hola Tambo Active, quiero más información';
  return `https://wa.me/${SITIO.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace de WhatsApp con el mensaje del pedido de la combinación.
 * @param {string} colorId
 * @param {string} logoId
 * @param {Array} colores
 * @param {Array} logos
 * @returns {string}
 */
export function enlaceWhatsApp(colorId, logoId, colores, logos) {
  const color = colores.find((c) => c.id === colorId);
  const logo = logos.find((l) => l.id === logoId);
  const mensaje = `Hola Tambo Active, quiero realizar el pedido de las camisetas de color ${
    color ? color.label : colorId
  } con el logo ${logo ? logo.label : logoId}`;
  return `https://wa.me/${SITIO.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
}
