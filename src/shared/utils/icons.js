import { createIcons, Menu, Layers, Wind, Shirt, Scissors, WashingMachine } from 'lucide';

/**
 * Mapa de iconos Lucide utilizados en las plantillas.
 * Las claves deben estar en PascalCase.
 */
const ICONOS = { Menu, Layers, Wind, Shirt, Scissors, WashingMachine };

/**
 * Reemplaza los elementos `[data-lucide]` por sus SVGs.
 * Se invoca tras montar cualquier página.
 */
export function renderIcons() {
  createIcons({ icons: ICONOS });
}
