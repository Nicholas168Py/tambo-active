/**
 * SectionHeading: encabezado de sección reutilizable.
 * Genera el HTML de los títulos centrados de las secciones
 * con el patrón visual de la marca (uppercase, tracking).
 *
 * Devuelve el markup; el reveal lo gestiona cada componente
 * que lo consume (atributo `data-reveal`).
 *
 * @param {object} opciones
 * @param {string} opciones.title        - Texto del h2.
 * @param {string} [opciones.subtitle]   - Subtítulo opcional.
 * @param {string} [opciones.wrapperClass] - Clases del contenedor.
 * @param {string} [opciones.h2Class]    - Clases extra del h2.
 * @returns {string}
 */
export function sectionHeading({
  title,
  subtitle = '',
  wrapperClass = 'mb-16',
  h2Class = ''
} = {}) {
  return [
    `<div class="text-center ${wrapperClass}" data-reveal>`,
    `<h2 class="text-3xl md:text-4xl font-bold ${h2Class} uppercase tracking-wide">${title}</h2>`,
    subtitle ? `<p class="text-gray-500 text-base md:text-lg">${subtitle}</p>` : '',
    '</div>'
  ].join('');
}
