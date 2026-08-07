import adidasUrl from '../assets/models/Adidas-Logo-w.png';
import nikeUrl from '../assets/models/Logo_NIKE.svg';
import tamboUrl from '../assets/models/Tambo-Logo-w.png';

/**
 * Logos disponibles en el configurador.
 * - tipo 'imagen': logo local importado (PNG/SVG).
 * @type {{ id: string, label: string, tipo: string, src: string, tamanoMax?: number }[]}
 */
export const LOGOS = [
  { id: 'tambo', label: 'TAMBO ACTIVE', tipo: 'imagen', src: tamboUrl, tamanoMax: 0.25 },
  { id: 'adidas', label: 'Adidas', tipo: 'imagen', src: adidasUrl },
  { id: 'nike', label: 'Nike', tipo: 'imagen', src: nikeUrl }
];
