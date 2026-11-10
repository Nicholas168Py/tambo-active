import { Component } from '../../core/Component.js';

// Array de rutas de imágenes disponibles en la carpeta combo_2 (públicas)
const COMBO_2_IMAGES = [
  '/camisetas/combo_2/1.webp',
  '/camisetas/combo_2/2.webp',
  '/camisetas/combo_2/3.webp',
  '/camisetas/combo_2/4.webp',
  '/camisetas/combo_2/5.webp',
  '/camisetas/combo_2/6.webp',
  '/camisetas/combo_2/7.webp',
  '/camisetas/combo_2/8.webp',
  '/camisetas/combo_2/9.webp',
  '/camisetas/combo_2/10.webp',
  '/camisetas/combo_2/11.webp',
  '/camisetas/combo_2/12.webp',
  '/camisetas/combo_2/13.webp',
  '/camisetas/combo_2/14.webp',
  '/camisetas/combo_2/15.webp',
  '/camisetas/combo_2/16.webp',
  '/camisetas/combo_2/17.webp',
  '/camisetas/combo_2/18.webp',
  '/camisetas/combo_2/19.webp',
  '/camisetas/combo_2/20.webp',
  '/camisetas/combo_2/21.webp',
];

// Array de rutas de imágenes disponibles en la carpeta combo_3 (públicas)
const COMBO_3_IMAGES = [
  '/camisetas/combo_3/1.webp',
  '/camisetas/combo_3/2.webp',
];
import { COMBOS_DATA } from './combosData.js';
import { ComboModal, renderComboCardColors } from './ComboModal.js';
import { formatearCOP } from '../../data/product.js';
import { renderIcons } from '../../shared/utils/icons.js';
import template from './combos.html?raw';

/**
 * Combos: Sección de 4 cards de combos inmediatamente antes del configurador.
 */
export class Combos extends Component {
  constructor() {
    super(template, { mount: '#app' });
    this.modalActivo = null;
  }

  render() {
    super.render();
    const grid = this.query('[data-combos-grid]');
    const randomCombo2Img = COMBO_2_IMAGES[Math.floor(Math.random() * COMBO_2_IMAGES.length)];
    const randomCombo3Img = COMBO_3_IMAGES[Math.floor(Math.random() * COMBO_3_IMAGES.length)];

    // Sincronizar imagen aleatoria en el combo 3 para card y modal
    const combo3 = COMBOS_DATA.find((c) => c.id === 'combo-trio');
    if (combo3) {
      combo3.imagen = randomCombo3Img;
    }

    if (!grid) return;

    grid.innerHTML = COMBOS_DATA.map((combo) => {
      const imgSrc =
        combo.id === 'combo-duo'
          ? randomCombo2Img
          : combo.id === 'combo-trio'
          ? randomCombo3Img
          : combo.imagen;

      return `
      <div class="w-full h-full flex flex-col justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl group relative overflow-hidden">
        
        <div class="flex-1 flex flex-col">
          <!-- Imagen Optimizada -->
          <div class="relative w-full aspect-[4/3.5] rounded-2xl bg-white !bg-white border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-4 mb-3 overflow-hidden">
            <img src="${imgSrc}" alt="${combo.titulo}" data-combo-card-img="${combo.id}" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" loading="eager" decoding="async" fetchpriority="high" width="400" height="350" />
          </div>

          <!-- Colores seleccionados (Debajo de la camiseta) -->
          <div class="mb-4 min-h-[28px] flex items-center" data-combo-card-colors="${combo.id}">
            ${renderComboCardColors(combo)}
          </div>

          <!-- Título y Precios -->
          <h3 class="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white leading-tight">
            ${combo.titulo}
          </h3>
          <p class="text-sm md:text-base font-normal text-black dark:text-white mt-1">
            ${combo.subtitulo}
          </p>

          <div class="mt-4 flex flex-wrap items-baseline gap-2.5">
            <span class="text-2xl md:text-3xl font-black text-black dark:text-white">
              ${formatearCOP(combo.precio)}
            </span>
            <span class="text-base line-through text-black dark:text-white font-bold opacity-60">
              ${formatearCOP(combo.precioOriginal)}
            </span>
            ${
              combo.ahorro
                ? `<span class="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">${combo.ahorro}</span>`
                : ''
            }
          </div>

          <!-- Lista de Beneficios y Descripción -->
          <p class="mt-4 text-base md:text-lg leading-relaxed font-normal text-black dark:text-white">
            ${combo.descripcionRegla}
          </p>

          <ul class="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-sm text-black dark:text-white font-medium flex-1">
            ${combo.beneficios
              .map(
                (b) => `
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0"></i>
                <span class="leading-snug">${b}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>

        <!-- CTA de Apertura del Modal -->
        <div class="pt-6 mt-5 border-t border-neutral-200 dark:border-neutral-800">
          <button type="button" data-open-combo="${combo.id}"
            class="w-full py-3.5 px-5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-200 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-md">
            <span>Elegir opciones</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>

      </div>
      `;
    }).join('');

    renderIcons(this.root);
  }

  bindEvents() {
    this.root?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-combo]');
      if (btn) {
        const comboId = btn.getAttribute('data-open-combo');
        const combo = COMBOS_DATA.find((c) => c.id === comboId);
        if (combo) {
          this.abrirModal(combo);
        }
      }
    });
  }

  abrirModal(combo) {
    if (this.modalActivo) {
      this.modalActivo.close();
    }

    this.modalActivo = new ComboModal({
      combo,
      onClose: () => {
        this.modalActivo = null;
      }
    });

    this.modalActivo.open();
  }

  initAnimations() {
    this.queryAll('[data-reveal]').forEach((el) => this.revelarElemento(el));
  }

  destroy() {
    if (this.modalActivo) {
      this.modalActivo.close();
      this.modalActivo = null;
    }
    super.destroy();
  }
}
