import {
  createIcons,
  Menu,
  Layers,
  Wind,
  Shirt,
  Scissors,
  WashingMachine,
  Spool,
  ShoppingCart,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  Truck,
  Check,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Rotate3d,
  ArrowDown,
  LayoutGrid,
  List
} from 'lucide';

/**
 * Mapa de iconos Lucide utilizados en las plantillas.
 * Las claves deben estar en PascalCase.
 */
const ICONOS = {
  Menu,
  Layers,
  Wind,
  Shirt,
  Scissors,
  WashingMachine,
  Spool,
  ShoppingCart,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  Truck,
  Check,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Rotate3d,
  ArrowDown,
  LayoutGrid,
  List
};

/**
 * Reemplaza los elementos `[data-lucide]` por sus SVGs.
 * Se invoca tras montar cualquier página.
 */
export function renderIcons(root = document) {
  createIcons({
    icons: ICONOS,
    attrs: {
      'stroke-width': 2
    },
    nameAttr: 'data-lucide'
  });
}

