/**
 * Configuración de productos, modalidades de combo y precios de Tambo Active.
 */

// 1. Tipos de Producto Base
export const TIPOS_PRODUCTO = {
  CAMISETA: {
    id: 'camiseta-deportiva',
    nombre: 'Camiseta Deportiva',
    handle: 'camiseta-deportiva',
    descripcion: 'Silueta boxy deportiva confeccionada en algodón pesado 240 GSM. Caída estructurada y cuello rib reforzado.',
    precios: {
      individual: 39900,
      combo2: 69900,
      combo3: 99900,
      combo6: 179900
    },
    ahorros: {
      individual: '',
      combo2: 'Ahorra 12%',
      combo3: 'Ahorra 17%',
      combo6: 'Ahorra 25%'
    }
  },
  MANGA_SIZA: {
    id: 'manga-siza-deportiva',
    nombre: 'Camiseta Manga Siza Deportiva',
    handle: 'manga-siza-deportiva',
    descripcion: 'Corte siza atlético con sisa reforzada para entrenamiento de alta intensidad y máxima libertad de movimiento.',
    precios: {
      individual: 35900,
      combo2: 65900,
      combo3: 94900,
      combo6: 169900
    },
    ahorros: {
      individual: '',
      combo2: 'Ahorra 8%',
      combo3: 'Ahorra 12%',
      combo6: 'Ahorra 21%'
    }
  }
};

// 2. Tallas Disponibles para todos los modelos
export const TALLAS_DISPONIBLES = ['S', 'M', 'L', 'XL', 'XXL'];

// 3. Colores Base Oficiales
export const COLORES_BASE = [
  { id: 'negro', label: 'Negro', hex: '#111111' },
  { id: 'blanco', label: 'Blanco', hex: '#dadada' },
  { id: 'azul-oscuro', label: 'Azul Oscuro', hex: '#172349' },
  { id: 'verde-militar', label: 'Verde Militar', hex: '#4B5320' },
  { id: 'gris-claro', label: 'Gris Claro', hex: '#858B93' },
  { id: 'gris-oscuro', label: 'Gris Oscuro', hex: '#3f4043' }
];

// 4. Modalidades de Compra
export const MODALIDADES_BUNDLE = [
  {
    id: 'individual',
    titulo: 'Individual',
    subtitulo: '1 Unidad',
    badge: 'Libre',
    cantidadPrendas: 1
  },
  {
    id: 'combo2',
    titulo: 'Combo x2',
    subtitulo: '2 Camisetas Negras',
    badge: 'Popular',
    cantidadPrendas: 2
  },
  {
    id: 'combo3',
    titulo: 'Combo x3',
    subtitulo: '3 Colores',
    badge: 'Mejor Valor',
    cantidadPrendas: 3
  },
  {
    id: 'combo6',
    titulo: 'Combo x6',
    subtitulo: 'Colección Completa',
    badge: 'Top Ahorro',
    cantidadPrendas: 6
  }
];

// 5. Opciones predefinidas para Combo x3
export const OPCIONES_COMBO_3 = [
  {
    id: 'opcion-1',
    numero: 1,
    label: 'Opción 1',
    descripcion: 'Negro + Blanco + Azul Oscuro',
    colores: [
      { id: 'negro', label: 'Negro', hex: '#111111' },
      { id: 'blanco', label: 'Blanco', hex: '#dadada' },
      { id: 'azul-oscuro', label: 'Azul Oscuro', hex: '#172349' }
    ]
  },
  {
    id: 'opcion-2',
    numero: 2,
    label: 'Opción 2',
    descripcion: 'Negro + Verde Militar + Gris Claro',
    colores: [
      { id: 'negro', label: 'Negro', hex: '#111111' },
      { id: 'verde-militar', label: 'Verde Militar', hex: '#4B5320' },
      { id: 'gris-claro', label: 'Gris Claro', hex: '#858B93' }
    ]
  },
  {
    id: 'opcion-3',
    numero: 3,
    label: 'Opción 3',
    descripcion: 'Negro + Blanco + Gris Oscuro',
    colores: [
      { id: 'negro', label: 'Negro', hex: '#111111' },
      { id: 'blanco', label: 'Blanco', hex: '#dadada' },
      { id: 'gris-oscuro', label: 'Gris Oscuro', hex: '#3f4043' }
    ]
  }
];

// 6. Umbral para Envío Gratis
export const UMBRAL_ENVIO_GRATIS = 250000;

// Configuración legacy para compatibilidad hacia atrás
export const PRODUCTO_CONFIG = {
  nombre: 'Camiseta Deportiva',
  descripcion: 'Camiseta deportiva premium de Alta calidad con tecnología transpirable.',
  precioUnitario: 39900,
  tallas: TALLAS_DISPONIBLES,
  tallaDefault: 'L',
  moneda: 'COP',
  envioTexto: 'Envío gratis desde $250.000 COP'
};

/**
 * Formatea un valor numérico a moneda colombiana (COP).
 * Ejemplo: 39900 -> "$39.900 COP"
 * @param {number} valor
 * @returns {string}
 */
export function formatearCOP(valor) {
  const formateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);

  return `${formateado} COP`;
}
