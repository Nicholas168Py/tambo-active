import { formatearCOP } from '../../data/product.js';

export const COMBOS_DATA = [
  {
    id: 'combo-individual',
    titulo: 'Combo Individual',
    subtitulo: '1 Camiseta',
    unidades: 1,
    badge: '1 Unidad',
    tagColor: 'bg-black/5 dark:bg-white/10 text-black dark:text-white border-black/10 dark:border-white/20',
    precio: 39900,
    precioOriginal: 50000,
    ahorro: '',
    imagen: '/hero/camisa-hero.png',
    descripcionRegla: 'Escoge 1 color y 1 talla a tu elección.',
    beneficios: [
      '1 Camiseta deportiva Heavyweight',
      'Selección libre de color y talla'
    ]
  },
  {
    id: 'combo-duo',
    titulo: 'Combo Dúo',
    subtitulo: '2 Camisetas',
    unidades: 2,
    badge: 'Más Popular',
    tagColor: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
    precio: 69900,
    precioOriginal: 100000,
    ahorro: 'Ahorra 30%',
    imagen: '/camisetas/combo_2/1.webp',
    descripcionRegla: 'Escoge hasta 2 colores y distribuye 2 tallas libremente.',
    beneficios: [
      '2 Camisetas deportivas premium',
      'Excelente relación costo / beneficio'
    ]
  },
  {
    id: 'combo-trio',
    titulo: 'Combo Trío',
    subtitulo: '3 Camisetas',
    unidades: 3,
    badge: 'Mejor Valor',
    tagColor: 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
    precio: 99900,
    precioOriginal: 150000,
    ahorro: 'Ahorra 33%',
    imagen: '/camisetas/combo_3/1.webp',
    descripcionRegla: 'Escoge hasta 3 colores y distribuye 3 tallas a tu medida.',
    beneficios: [
      '3 Camisetas deportivas premium',
      'Combina hasta 3 colores a tu gusto'
    ]
  },
  {
    id: 'combo-coleccion',
    titulo: 'Colección Completa',
    subtitulo: '6 Camisetas (Pack Completo)',
    unidades: 6,
    badge: 'Top Ahorro',
    tagColor: 'bg-blue-100 text-blue-950 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
    precio: 179900,
    precioOriginal: 300000,
    ahorro: 'Ahorra 40%',
    imagen: '/camisetas/6-camisetas.webp?v=2',
    descripcionRegla: 'Incluye automáticamente los 6 colores oficiales. Distribuye hasta 6 tallas.',
    beneficios: [
      'Todos los 6 colores incluidos de fábrica',
      'Máximo descuento de la temporada'
    ]
  }
];
