import { assetUrl } from '../shared/utils/assetUrl.js';

/**
 * Configuración global del sitio.
 */
export const SITIO = {
  nombre: 'Tambo Active',
  descripcion:
    'Camiseta deportiva premium de alto gramaje. Personaliza tu color y logo y recibe tu camiseta en la puerta de tu casa.',
  dominio: 'https://tamboactive.com',
  canonical: 'https://tamboactive.com/',
  telefonoDisplay: '+57 311 224 7905',
  telefonoWa: '573112247905',
  instagram: 'https://www.instagram.com/tamboactive/',
  email: 'info@tamboactive.com'
};

/**
 * Selección inicial del configurador.
 */
export const COLOR_INICIAL = 'negro';
export const LOGO_INICIAL = 'tambo';

/**
 * Imagen de respaldo cuando una variante aún no existe en el proyecto.
 */
export const IMAGEN_FALLBACK = assetUrl('hero/camisa-hero.png');
