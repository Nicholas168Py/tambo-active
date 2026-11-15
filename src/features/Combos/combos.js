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
import { ComboModal } from './ComboModal.js';
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

    let savedView = 'grid';
    try {
      savedView = localStorage.getItem('tambo_combos_mobile_view') || 'grid';
    } catch (_) {}
    this.mobileView = savedView;

    this.randomCombo2Img = COMBO_2_IMAGES[Math.floor(Math.random() * COMBO_2_IMAGES.length)];
    this.randomCombo3Img = COMBO_3_IMAGES[Math.floor(Math.random() * COMBO_3_IMAGES.length)];
  }

  render() {
    super.render();
    this.renderCards();
    this.updateViewButtons();
  }

  renderCards() {
    const grid = this.query('[data-combos-grid]');
    if (!grid) return;

    // Sincronizar imagen aleatoria en el combo 3 para card y modal
    const combo3 = COMBOS_DATA.find((c) => c.id === 'combo-trio');
    if (combo3) {
      combo3.imagen = this.randomCombo3Img;
    }

    grid.innerHTML = COMBOS_DATA.map((combo) => {
      const imgSrc =
        combo.id === 'combo-duo'
          ? this.randomCombo2Img
          : combo.id === 'combo-trio'
          ? this.randomCombo3Img
          : combo.imagen;

      // Card Vertical Estándar (Cuadrícula en mobile, siempre activa en escritorio)
      const verticalCard = `
      <div class="w-full h-full flex flex-col justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 lg:p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
        
        <div class="flex-1 flex flex-col">
          <!-- Imagen Optimizada (Vertical en celular, altura controlada en escritorio) -->
          <div class="relative w-full aspect-[4/3.5] sm:aspect-auto h-auto sm:h-36 lg:h-38 xl:h-[13rem] xl:h-40 rounded-xl sm:rounded-2xl bg-white !bg-white border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-2 mb-2 overflow-hidden shrink-0">
            <img src="${imgSrc}" alt="${combo.titulo}" data-combo-card-img="${combo.id}" class="w-full h-full max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200 block" loading="eager" decoding="async" fetchpriority="high" width="400" height="350" />
          </div>

          <!-- Título y Precios -->
          <h3 class="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-black dark:text-white leading-tight">
            ${combo.titulo}
          </h3>
          <p class="text-[11px] sm:text-xs font-normal text-neutral-500 dark:text-neutral-400 mt-0.5">
            ${combo.subtitulo}
          </p>

          <div class="mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <span class="text-lg sm:text-xl lg:text-2xl font-black text-red-600 dark:text-red-500">
              ${formatearCOP(combo.precio)}
            </span>
            <span class="text-xs sm:text-sm line-through text-black dark:text-white font-semibold opacity-60">
              ${formatearCOP(combo.precioOriginal)}
            </span>
            ${
              combo.ahorro
                ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">${combo.ahorro}</span>`
                : ''
            }
          </div>

          <!-- Lista de Beneficios y Descripción -->
          <p class="mt-1.5 text-[11px] sm:text-xs leading-snug font-normal text-neutral-600 dark:text-neutral-300 line-clamp-2">
            ${combo.descripcionRegla}
          </p>

          <ul class="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1 text-[11px] sm:text-xs text-black dark:text-white font-medium flex-1">
            ${combo.beneficios
              .map(
                (b) => `
              <li class="flex items-center gap-1.5">
                <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0"></i>
                <span class="leading-tight truncate">${b}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>

        <!-- CTA de Apertura del Modal (Siempre visible en escritorio) -->
        <div class="pt-2.5 mt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button type="button" data-open-combo="${combo.id}"
            class="w-full py-2.5 px-3 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-sm">
            <span>Elegir opciones</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>

      </div>
      `;

      if (this.mobileView === 'list') {
        // Card Horizontal Estilo Steam (Exclusiva para vista Lista en mobile)
        const listCard = `
        <div data-open-combo="${combo.id}" class="w-full flex md:hidden flex-row items-stretch bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white rounded-2xl p-2.5 transition-all duration-200 hover:shadow-md group relative overflow-hidden cursor-pointer">
          
          <!-- Imagen izquierda (Thumbnail) -->
          <div class="w-28 h-28 min-w-[112px] rounded-xl bg-white !bg-white border border-neutral-200 dark:border-neutral-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden relative">
            <img src="${imgSrc}" alt="${combo.titulo}" data-combo-card-img="${combo.id}" class="w-full h-full max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200 block" loading="eager" decoding="async" width="112" height="112" />
          </div>

          <!-- Información derecha -->
          <div class="flex-1 min-w-0 pl-3 flex flex-col justify-between py-0.5">
            <div>
              <div class="flex items-start justify-between gap-1">
                <h3 class="text-sm font-bold tracking-tight text-black dark:text-white leading-tight truncate">
                  ${combo.titulo}
                </h3>
                <span class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
                  ${combo.subtitulo}
                </span>
              </div>

              <p class="text-[11px] leading-snug font-normal text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                ${combo.descripcionRegla}
              </p>
            </div>

            <!-- Precios y Botón CTA alineados al estilo Steam -->
            <div class="mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-1.5">
              <div class="flex items-center gap-1.5 min-w-0">
                ${
                  combo.ahorro
                    ? `<span class="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shrink-0">${combo.ahorro}</span>`
                    : ''
                }
                <div class="flex flex-col min-w-0 leading-tight">
                  <span class="text-[10px] line-through text-neutral-400 dark:text-neutral-500 font-medium leading-none">${formatearCOP(combo.precioOriginal)}</span>
                  <span class="text-xs sm:text-sm font-black text-red-600 dark:text-red-500 leading-tight">${formatearCOP(combo.precio)}</span>
                </div>
              </div>

              <button type="button" data-open-combo="${combo.id}" class="py-1 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-neutral-950 text-white dark:bg-white dark:text-black flex items-center gap-1 shrink-0 shadow-xs pointer-events-none">
                <span>Elegir</span>
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </button>
            </div>

          </div>

        </div>
        `;

        // Retorna la card horizontal para mobile (< md) y la card vertical para desktop (>= md)
        return `${listCard}\n${verticalCard.replace('flex flex-col', 'hidden md:flex flex-col')}`;
      }

      return verticalCard;
    }).join('');

    renderIcons(this.root);
  }

  updateViewButtons() {
    const gridBtn = this.query('[data-view-btn="grid"]');
    const listBtn = this.query('[data-view-btn="list"]');
    if (!gridBtn || !listBtn) return;

    const activeClasses = ['bg-white', 'dark:bg-neutral-900', 'text-black', 'dark:text-white', 'shadow-xs', 'font-bold'];
    const inactiveClasses = ['text-neutral-500', 'dark:text-neutral-400', 'hover:text-black', 'dark:hover:text-white', 'font-medium'];

    if (this.mobileView === 'grid') {
      gridBtn.classList.add(...activeClasses);
      gridBtn.classList.remove(...inactiveClasses);
      listBtn.classList.remove(...activeClasses);
      listBtn.classList.add(...inactiveClasses);
    } else {
      listBtn.classList.add(...activeClasses);
      listBtn.classList.remove(...inactiveClasses);
      gridBtn.classList.remove(...activeClasses);
      gridBtn.classList.add(...inactiveClasses);
    }
  }

  bindEvents() {
    this.root?.addEventListener('click', (e) => {
      // Cambio de vista mobile: Cuadrícula / Lista
      const viewBtn = e.target.closest('[data-view-btn]');
      if (viewBtn) {
        const targetView = viewBtn.getAttribute('data-view-btn');
        if (targetView && targetView !== this.mobileView) {
          this.mobileView = targetView;
          try {
            localStorage.setItem('tambo_combos_mobile_view', targetView);
          } catch (_) {}
          this.renderCards();
          this.updateViewButtons();
        }
        return;
      }

      // Apertura de modal / drawer PDP
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
