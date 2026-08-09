import adidasUrl from '../assets/models/Adidas-Logo-w.png';
import nikeUrl from '../assets/models/Logo_NIKE.svg';
import tamboUrl from '../assets/models/Tambo-Logo-w.png';

/**
 * Logos disponibles en el configurador.
 * - tipo 'imagen': logo local importado (PNG/SVG).
 * - tamanoMax: límite del decal en el modelo 3D (solo tambo).
 * - altoDisp: altura del logo en el selector (px), para que todos se vean parejos.
 * @type {{ id: string, label: string, tipo: string, src: string, tamanoMax?: number, altoDisp?: number }[]}
 */
export const LOGOS = [
  { id: 'tambo', label: 'TAMBO ACTIVE', tipo: 'imagen', src: tamboUrl, altoDisp: 100 },
  { id: 'adidas', label: 'Adidas', tipo: 'imagen', src: adidasUrl, altoDisp: 42 },
  { id: 'nike', label: 'Nike', tipo: 'imagen', src: nikeUrl, altoDisp: 24 }
];
