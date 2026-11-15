import { formatearCOP } from '../../data/product.js';
import { cartStore } from '../../core/CartStore.js';
import { renderIcons } from '../../shared/utils/icons.js';
import { obtenerCombinacionDuo } from '../../data/comboDuoMap.js';

export const TALLAS_DISPONIBLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const COLORES_DISPONIBLES = [
  { id: 'negro', label: 'Negro', hex: '#18181B', border: false },
  { id: 'blanco', label: 'Blanco', hex: '#F4F4F5', border: true },
  { id: 'azul-oscuro', label: 'Azul Oscuro', hex: '#1E293B', border: false },
  { id: 'verde-militar', label: 'Verde Militar', hex: '#4B5320', border: false },
  { id: 'gris-claro', label: 'Gris Claro', hex: '#9CA3AF', border: false },
  { id: 'gris-oscuro', label: 'Gris Oscuro', hex: '#374151', border: false }
];

/**
 * Genera el HTML de los colores seleccionados para colocarlos debajo de la camiseta en el card.
 * Optimizado para ser compacto: se elimina el texto "Personaliza tus colores" y se compacta el espaciado.
 */
export function renderComboCardColors(combo, slots) {
  if (combo.unidades === 6) {
    const swatches = COLORES_DISPONIBLES.map(
      (c) => `<span class="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900 shadow-2xs flex-shrink-0" style="background-color: ${c.hex}" title="${c.label}"></span>`
    ).join('');
    return `
      <div class="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 max-w-full">
        <div class="flex items-center -space-x-1 flex-shrink-0">${swatches}</div>
        <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">6 colores incluidos</span>
      </div>
    `;
  }

  const defaultColores = ['negro', 'blanco', 'azul-oscuro', 'verde-militar', 'gris-claro', 'gris-oscuro'];
  const slotItems = slots || Array.from({ length: combo.unidades }, (_, i) => ({
    color: defaultColores[i] || 'negro',
    colorSeleccionado: false
  }));

  const colorObjs = slotItems.map(
    (s) => COLORES_DISPONIBLES.find((c) => c.id === s.color) || COLORES_DISPONIBLES[0]
  );

  const swatches = colorObjs
    .map((c, i) => {
      const slot = slotItems[i];
      const isSelected = slot ? slot.colorSeleccionado === true : false;
      if (!isSelected) {
        return `<span class="w-3.5 h-3.5 rounded-full border border-dashed border-neutral-400 bg-white dark:bg-neutral-800 flex-shrink-0 shadow-2xs" title="Sin seleccionar"></span>`;
      }
      return `<span class="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900 shadow-2xs flex-shrink-0" style="background-color: ${c.hex}" title="${c.label}"></span>`;
    })
    .join('');

  const anySelected = slotItems.some((s) => s.colorSeleccionado === true);
  
  // Requerimiento 6: Si aún no hay colores seleccionados, no mostrar badge "Personaliza tus colores"
  if (!anySelected) {
    return `
      <div class="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
        <div class="flex items-center -space-x-1 flex-shrink-0">${swatches}</div>
        <span class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Elige colores</span>
      </div>
    `;
  }

  const labels = colorObjs
    .map((c, i) => {
      const slot = slotItems[i];
      if (slot && slot.colorSeleccionado === false) {
        return 'Pendiente';
      }
      return c.label;
    })
    .join(combo.unidades === 2 ? ' + ' : ', ');

  return `
    <div class="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 max-w-full">
      <div class="flex items-center -space-x-1 flex-shrink-0">${swatches}</div>
      <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">${labels}</span>
    </div>
  `;
}

/**
 * ComboModal: Modal optimizado para selección de combos:
 * - Margen superior libre para el botón de cierre (X).
 * - Bloqueo estricto del scroll de la página principal (solo scroll interno habilitado).
 * - Combo de 6 unidades simplificado sin repetición de configuración por camiseta.
 * - Centrado vertical automático para Combo Individual y Combo Dúo.
 */
export class ComboModal {
  constructor({ combo, onClose, onAdded }) {
    this.combo = combo;
    this.onClose = onClose;
    this.onAdded = onAdded;

    const defaultColors = ['negro', 'blanco', 'azul-oscuro', 'verde-militar', 'gris-claro', 'gris-oscuro'];
    const defaultSizes = ['M', 'L', 'M', 'L', 'XL', 'S'];

    if (this.combo.unidades === 6) {
      // Colección completa: 1 camiseta de cada uno de los 6 colores oficiales
      this.combo6TallaGlobal = 'M';
      this.slots = COLORES_DISPONIBLES.map((c, i) => ({
        index: i + 1,
        color: c.id,
        size: 'M',
        colorSeleccionado: true
      }));
    } else {
      // Combos individuales, dúos o tríos: slots configurables
      // Al abrir por primera vez, colorSeleccionado = false para que no muestre el check de inmediato
      this.slots = Array.from({ length: this.combo.unidades }, (_, i) => ({
        index: i + 1,
        color: defaultColors[i] || 'negro',
        size: defaultSizes[i] || 'M',
        colorSeleccionado: false
      }));
    }

    this.focusedSlotIndex = 0;
    this.showSizeGuide = false;
    this.modalEl = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._preventBodyScroll = this._preventBodyScroll.bind(this);
  }

  get esCombo6() {
    return this.combo.unidades === 6;
  }

  get esPocosItems() {
    return this.combo.unidades <= 2;
  }

  get esValido() {
    if (this.esCombo6) {
      return this.slots.every((slot) => Boolean(slot.size));
    }
    return this.slots.every((slot) => Boolean(slot.colorSeleccionado && slot.color && slot.size));
  }

  get mensajeValidacion() {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot.colorSeleccionado || !slot.color) {
        return `Elige el color de la Camiseta ${i + 1}`;
      }
      if (!slot.size) {
        return `Elige la talla de la Camiseta ${i + 1}`;
      }
    }
    return '';
  }

  get ctaTexto() {
    if (!this.esValido) {
      return this.mensajeValidacion;
    }
    return `Agregar Combo al Carrito • ${formatearCOP(this.combo.precio)}`;
  }

  _renderModalPillContent() {
    if (this.combo.unidades === 6) {
      return `
        <span class="flex items-center gap-1.5 truncate">
          <div class="flex items-center -space-x-1 flex-shrink-0">
            ${COLORES_DISPONIBLES.map(c => `<span class="w-2.5 h-2.5 rounded-full border border-white/60 flex-shrink-0" style="background-color: ${c.hex}"></span>`).join('')}
          </div>
          <span class="truncate">Colección completa (6 colores incluidos)</span>
        </span>
      `;
    }

    if (this.combo.unidades === 2 && this.slots.length >= 2) {
      const c1Obj = COLORES_DISPONIBLES.find((c) => c.id === this.slots[0].color) || COLORES_DISPONIBLES[0];
      const c2Obj = COLORES_DISPONIBLES.find((c) => c.id === this.slots[1].color) || COLORES_DISPONIBLES[1];
      const comboDuoInfo = obtenerCombinacionDuo(this.slots[0].color, this.slots[1].color);
      const s1Chosen = this.slots[0].colorSeleccionado;
      const s2Chosen = this.slots[1].colorSeleccionado;

      return `
        <span class="flex items-center gap-1.5 truncate">
          <div class="flex items-center -space-x-1 flex-shrink-0">
            <span class="w-2.5 h-2.5 rounded-full border border-white/60 flex-shrink-0" style="background-color: ${s1Chosen ? c1Obj.hex : '#ffffff'}"></span>
            <span class="w-2.5 h-2.5 rounded-full border border-white/60 flex-shrink-0" style="background-color: ${s2Chosen ? c2Obj.hex : '#ffffff'}"></span>
          </div>
          <span class="truncate">
            Dúo <strong>#${comboDuoInfo.numero}</strong>: ${s1Chosen ? c1Obj.label : 'Elige color 1'} + ${s2Chosen ? c2Obj.label : 'Elige color 2'}
          </span>
        </span>
      `;
    }

    if (this.combo.unidades === 3 && this.slots.length >= 3) {
      const cObjs = this.slots.map(s => COLORES_DISPONIBLES.find(c => c.id === s.color) || COLORES_DISPONIBLES[0]);
      return `
        <span class="flex items-center gap-1.5 truncate">
          <div class="flex items-center -space-x-1 flex-shrink-0">
            ${cObjs.map((c, i) => `
              <span class="w-2.5 h-2.5 rounded-full border border-white/60 flex-shrink-0" style="background-color: ${this.slots[i].colorSeleccionado ? c.hex : '#ffffff'}"></span>
            `).join('')}
          </div>
          <span class="truncate">
            ${this.slots.map((s, i) => s.colorSeleccionado ? cObjs[i].label : `Prenda ${i + 1}`).join(' + ')}
          </span>
        </span>
      `;
    }

    const activeSlot = (this.focusedSlotIndex >= 0 && this.slots[this.focusedSlotIndex]) ? this.slots[this.focusedSlotIndex] : this.slots[0];
    const activeColorObj = COLORES_DISPONIBLES.find((c) => c.id === activeSlot.color) || COLORES_DISPONIBLES[0];
    return `
      <span class="flex items-center gap-1.5 truncate">
        <span class="w-2.5 h-2.5 rounded-full border border-white/40 flex-shrink-0" style="background-color: ${activeSlot.colorSeleccionado ? activeColorObj.hex : '#ffffff'}"></span>
        <span class="truncate">
          Prenda <strong>${activeSlot.index}</strong>: <strong>${activeSlot.colorSeleccionado ? activeColorObj.label : 'Elige un color'}</strong>
        </span>
      </span>
    `;
  }

  render() {
    const modal = document.createElement('div');
    // Overlay base: En desktop centra con backdrop blur; en mobile cubre la pantalla completa
    modal.className =
      'fixed inset-0 bg-black/60 md:backdrop-blur-sm z-50 flex items-center justify-center md:p-6 overscroll-contain transition-opacity duration-300';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', `Configurar ${this.combo.titulo}`);

    const activeSlot = this.slots[this.focusedSlotIndex] || this.slots[0];
    const activeColorObj =
      COLORES_DISPONIBLES.find((c) => c.id === activeSlot.color) || COLORES_DISPONIBLES[0];

    let currentPreviewImg = this.combo.imagen;
    let comboDuoInfo = null;
    if (this.combo.unidades === 2 && this.slots.length >= 2) {
      comboDuoInfo = obtenerCombinacionDuo(this.slots[0].color, this.slots[1].color);
      currentPreviewImg = comboDuoInfo.ruta;
      this.combo.imagen = comboDuoInfo.ruta;
      document.querySelectorAll(`[data-combo-card-img="${this.combo.id}"]`).forEach((img) => {
        img.src = comboDuoInfo.ruta;
      });
    }

    modal.innerHTML = `
      <!-- Panel Principal: En mobile slide-over full viewport (100vw, 100dvh) desde la derecha estilo Temu; en desktop modal centrado -->
      <div data-modal-panel
        class="fixed inset-0 md:relative w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-4xl bg-white md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden flex flex-col md:flex-row transform-gpu translate-x-full md:translate-x-0 transition-transform duration-250 ease-out will-change-transform md:my-auto md:border md:border-neutral-100 z-50">
        
        <!-- ========================================================
            HEADER MOBILE (Estilo Temu - Visible solo en < md)
           ======================================================== -->
        <header class="flex md:hidden items-center justify-between px-3.5 py-3 bg-white border-b border-neutral-200 sticky top-0 z-40 shrink-0">
          <button type="button" data-modal-back aria-label="Volver atrás"
            class="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 hover:text-black flex items-center justify-center transition-transform active:scale-95 shadow-xs shrink-0">
            <svg class="w-5 h-5 stroke-neutral-900" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div class="flex-1 text-center px-2 min-w-0">
            <h1 class="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-950 truncate">
              ${this.combo.titulo}
            </h1>
          </div>

          <button type="button" data-modal-close aria-label="Cerrar ventana"
            class="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 hover:text-black flex items-center justify-center transition-transform active:scale-95 shadow-xs shrink-0">
            <svg class="w-5 h-5 stroke-neutral-900" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- Botón de Cierre DESKTOP (Flotante en esquina superior derecha) -->
        <button type="button" data-modal-close aria-label="Cerrar ventana"
          class="hidden md:flex absolute top-4 right-4 z-30 w-11 h-11 items-center justify-center text-neutral-600 hover:text-black rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900 active:scale-95">
          <svg class="w-5 h-5 stroke-neutral-900" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- ========================================================
            CUERPO SCROLLABLE (Unificado en mobile, 2 columnas en desktop)
           ======================================================== -->
        <div class="flex-1 overflow-y-auto overscroll-contain flex flex-col md:flex-row md:overflow-hidden" data-lenis-prevent>

          <!-- COLUMNA IZQUIERDA (~42%): Visual, Precios y Confianza (Centrado en mobile) -->
          <div class="w-full md:w-[42%] bg-neutral-50 p-4 sm:p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-200 shrink-0 items-center md:items-start text-center md:text-left">
            <div class="w-full flex flex-col items-center md:items-start">
              <!-- Badge Cápsula -->
              <div class="mb-2 sm:mb-3 flex justify-center md:justify-start w-full">
                <span class="inline-flex items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-neutral-200 text-neutral-800 border border-neutral-300 shadow-2xs">
                  ${this.combo.badge}
                </span>
              </div>

              <!-- Título y Subtítulo -->
              <h2 class="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase leading-tight w-full">
                ${this.combo.titulo}
              </h2>
              <p class="text-xs sm:text-sm text-neutral-500 mt-0.5 w-full">
                ${this.combo.subtitulo} • ${this.combo.unidades} ${this.combo.unidades === 1 ? 'unidad' : 'unidades'}
              </p>

              <!-- Fila de Precios Centrada -->
              <div class="mt-2.5 sm:mt-4 flex items-center justify-center md:justify-start flex-wrap gap-2.5 w-full">
                <span class="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
                  ${formatearCOP(this.combo.precio)}
                </span>
                <span class="text-sm sm:text-base text-neutral-400 line-through font-semibold">
                  ${formatearCOP(this.combo.precioOriginal)}
                </span>
                ${
                  this.combo.ahorro
                    ? `<span class="bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">${this.combo.ahorro}</span>`
                    : ''
                }
              </div>

              <!-- Preview de Imagen Dinámico Centrado (Optimizado Safari: min-h, shrink-0, object-contain) -->
              <div class="relative w-full aspect-[16/10] sm:aspect-square bg-white rounded-2xl shadow-xs border border-neutral-100 p-2 sm:p-4 flex flex-col items-center justify-center overflow-hidden my-3 sm:my-5 group min-h-[190px] sm:min-h-[240px] shrink-0">
                <img src="${currentPreviewImg}" alt="${this.combo.titulo}" class="w-full h-full max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105 block mx-auto" data-preview-img loading="eager" decoding="async" width="400" height="400" onerror="if(!this.dataset.retried){this.dataset.retried='1';var s=this;setTimeout(function(){s.src=s.src.split('?')[0]+'?v='+Date.now();},350);}" />
                
                <!-- Píldora de estado de la prenda activa o combinación de colores debajo de la camiseta centrada -->
                <div class="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-center bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-sm" data-modal-preview-pill>
                  ${this._renderModalPillContent()}
                </div>
              </div>
            </div>

            <!-- Micro-copy de Confianza Centrado -->
            <div class="pt-2 border-t border-neutral-200/80 hidden sm:flex items-center justify-center md:justify-start gap-2.5 text-xs text-neutral-600 leading-relaxed w-full">
              <i data-lucide="rotate-ccw" class="w-4 h-4 text-neutral-800 flex-shrink-0 mt-0.5"></i>
              <span>Cambios de talla y devoluciones gratis en tu primera compra.</span>
            </div>
          </div>

          <!-- COLUMNA DERECHA (~58%): Selectores y Configuración -->
          <div class="w-full md:w-[58%] p-4 sm:p-6 md:p-8 md:pt-14 flex-1 flex flex-col justify-between md:overflow-y-auto space-y-4 sm:space-y-6">
            
            <!-- Contenedor de configuración -->
            <div class="space-y-4 sm:space-y-5" data-slots-container>
              ${this.esCombo6 ? this._renderCombo6Content() : this._renderSlots()}
            </div>

            <!-- Enlace Auxiliar: Guía de Tallas -->
            <div class="pt-2 flex items-center justify-end">
              <button type="button" data-toggle-size-guide
                class="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-900 underline font-semibold transition-colors">
                <i data-lucide="ruler" class="w-4 h-4"></i>
                <span>Guía de tallas y medidas</span>
              </button>
            </div>

            <!-- Tabla desplegable de Guía de Tallas -->
            <div data-size-guide-panel class="hidden p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-700 space-y-2.5">
              <div class="font-bold text-neutral-900 flex justify-between items-center text-sm">
                <span>Medidas en cm (Pecho / Largo)</span>
                <button type="button" data-close-size-guide class="text-neutral-400 hover:text-neutral-900 text-base font-bold">×</button>
              </div>
              <div class="grid grid-cols-6 gap-1 text-center font-mono text-xs">
                <div class="p-1 rounded bg-white border border-neutral-200"><span class="font-bold block text-neutral-900">XS</span>50/68</div>
                <div class="p-1 rounded bg-white border border-neutral-200"><span class="font-bold block text-neutral-900">S</span>52/70</div>
                <div class="p-1 rounded bg-white border border-neutral-200"><span class="font-bold block text-neutral-900">M</span>55/72</div>
                <div class="p-1 rounded bg-white border border-neutral-200"><span class="font-bold block text-neutral-900">L</span>58/74</div>
                <div class="p-1 rounded bg-white border border-neutral-200"><span class="font-bold block text-neutral-900">XL</span>61/76</div>
                <div class="p-1 rounded bg-white border border-neutral-200"><span class="font-bold block text-neutral-900">XXL</span>64/78</div>
              </div>
            </div>

            <!-- Footer de Acción en Desktop (visible sólo en md:) -->
            <div class="hidden md:block pt-4 border-t border-neutral-100">
              <button type="button" data-modal-submit ${!this.esValido ? 'disabled' : ''}
                class="w-full py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${
                  this.esValido
                    ? 'bg-neutral-900 hover:bg-black text-white shadow-lg shadow-neutral-900/10 cursor-pointer active:scale-[0.99]'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                <span data-cta-text>${this.ctaTexto}</span>
              </button>
            </div>

          </div>

        </div>

        <!-- ========================================================
            FOOTER STICKY MOBILE (Requerimiento 2: Fijo abajo para el pulgar)
           ======================================================== -->
        <div class="md:hidden sticky bottom-0 left-0 right-0 p-3.5 bg-white border-t border-neutral-200 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-[max(0.875rem,env(safe-area-inset-bottom))] shrink-0">
          <button type="button" data-modal-submit ${!this.esValido ? 'disabled' : ''}
            class="w-full py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${
              this.esValido
                ? 'bg-neutral-900 hover:bg-black text-white shadow-lg shadow-neutral-900/15 active:scale-[0.98]'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }">
            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            <span data-cta-text>${this.ctaTexto}</span>
          </button>
        </div>

      </div>
    `;

    this.modalEl = modal;
    this.bindEvents();
    renderIcons(this.modalEl);
    return this.modalEl;
  }

  /**
   * Renderizado Simplificado para Combo de 6 Unidades (Colección Completa):
   * Quita la configuración repetitiva por camiseta y presenta los 6 colores incluidos
   * junto con selector de tallas rápido y flexible con áreas táctiles cómodas (>= 44px).
   */
  _renderCombo6Content() {
    return `
      <div class="space-y-4">
        <!-- Banner Informativo Colección Completa -->
        <div class="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
          <div class="flex items-center gap-2 font-bold text-neutral-900 text-base">
            <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600 flex-shrink-0"></i>
            <span>Colección Completa Oficial (6 Colores)</span>
          </div>
          <p class="text-sm text-neutral-600 leading-relaxed">
            Este pack incluye automáticamente <strong>1 camiseta de cada uno de los 6 colores disponibles</strong>.
          </p>

          <!-- Swatches de los 6 colores incluidos con min 44x44px -->
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
            ${COLORES_DISPONIBLES.map((c, i) => `
              <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-neutral-200 text-center cursor-pointer hover:border-neutral-400 transition-all min-h-[64px] justify-center ${
                this.focusedSlotIndex === i ? 'ring-2 ring-neutral-900 shadow-sm' : ''
              }" data-combo6-color-focus="${i}">
                <span class="w-8 h-8 rounded-full border border-neutral-300 shadow-xs flex-shrink-0" style="background-color: ${c.hex}"></span>
                <span class="text-xs font-bold text-neutral-800 truncate w-full">${c.label}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Opción Rápida: Misma Talla para Todas -->
        <div class="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-base font-bold text-neutral-900">
              Aplicar misma talla a las 6 camisetas:
            </span>
            <span class="text-base text-neutral-900 font-extrabold" data-combo6-global-label>
              Talla: ${this.combo6TallaGlobal}
            </span>
          </div>
          <div class="grid grid-cols-6 gap-2">
            ${TALLAS_DISPONIBLES.map((t) => `
              <button type="button" data-combo6-global-size="${t}"
                class="min-h-[44px] py-2.5 text-base font-bold rounded-xl text-center transition-all flex items-center justify-center ${
                  t === this.combo6TallaGlobal
                    ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 active:scale-95'
                }">
                ${t}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Distribución Detallada por Color (Compacta) -->
        <div class="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2.5">
          <span class="text-base font-bold text-neutral-900 block mb-1">
            O personaliza la talla de cada color:
          </span>
          <div class="space-y-2">
            ${this.slots.map((slot, idx) => {
              const colorObj = COLORES_DISPONIBLES.find((c) => c.id === slot.color) || COLORES_DISPONIBLES[idx];
              return `
                <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-neutral-200 text-sm">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-6 h-6 rounded-full border border-neutral-300 flex-shrink-0" style="background-color: ${colorObj.hex}"></span>
                    <span class="font-bold text-neutral-900 text-sm truncate">${colorObj.label}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    ${TALLAS_DISPONIBLES.map((t) => `
                      <button type="button" data-slot-size-btn="${t}" data-slot-idx="${idx}"
                        class="min-h-[40px] min-w-[36px] sm:min-w-[40px] text-xs sm:text-sm font-bold rounded-lg text-center transition-all flex items-center justify-center ${
                          slot.size === t
                            ? 'bg-neutral-900 text-white font-bold shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95'
                        }">
                        ${t}
                      </button>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderizado de Slots para Combos:
   * Diseñado con sistema de acordeón intuitivo para móviles y escritorio:
   * - Microcopy compacto: "Prenda 1: Color y talla" para permitir mayor tamaño de fuente sin saltos.
   * - Tipografía >= 16px (text-base) para máxima legibilidad en celular.
   * - Swatches de color >= 44x44px y botones de talla >= 44px de alto para pulsación cómoda con el pulgar.
   * - Al seleccionar un color, se minimiza la prenda actual y avanza automáticamente a la siguiente.
   */
  _renderSlots() {
    // Si solo hay 1 prenda (Combo Individual), renderizado expandido directo sin acordeón
    if (this.slots.length === 1) {
      const slot = this.slots[0];
      const colorObj = COLORES_DISPONIBLES.find((c) => c.id === slot.color) || COLORES_DISPONIBLES[0];
      const hasSelected = slot.colorSeleccionado === true;

      return `
        <div class="p-4 sm:p-5 rounded-2xl border-2 border-neutral-900 bg-white shadow-xs" data-slot-block="0">
          <div class="flex items-center justify-between mb-3.5">
            <h3 class="text-base font-bold text-neutral-900 flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-full ${
                hasSelected ? 'bg-emerald-600 text-white' : 'border-2 border-neutral-300 bg-white text-neutral-500'
              } text-xs flex items-center justify-center font-bold">
                ${
                  hasSelected
                    ? `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`
                    : '1'
                }
              </span>
              <span>Prenda 1: Color y talla</span>
            </h3>
            <span class="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full ${
              hasSelected ? 'bg-neutral-100 text-neutral-800 border border-neutral-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }">
              <span class="capitalize" data-slot-color-label="0">${hasSelected ? colorObj.label : 'Sin elegir'}</span>
            </span>
          </div>

          <div class="space-y-2 mb-4">
            <span class="text-base font-bold text-neutral-900 block text-center sm:text-left">1. Color de la camiseta:</span>
            <div class="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 flex-wrap">
              ${COLORES_DISPONIBLES.map((c) => {
                const isSelected = hasSelected && slot.color === c.id;
                return `
                  <button type="button" data-slot-color-btn="${c.id}" data-slot-idx="0" title="${c.label}"
                    class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all ${
                      c.border ? 'border-2 border-neutral-300' : ''
                    } ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-neutral-900 scale-105 shadow-md'
                        : 'hover:scale-105 opacity-90 hover:opacity-100 ring-1 ring-black/10 active:scale-95'
                    }" style="background-color: ${c.hex}">
                    ${
                      isSelected
                        ? `<svg class="w-5 h-5 ${
                            c.id === 'blanco' || c.id === 'gris-claro' ? 'text-neutral-950' : 'text-white'
                          }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`
                        : ''
                    }
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="pt-3 border-t border-neutral-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-base font-bold text-neutral-900">2. Talla:</span>
              <span class="text-base font-extrabold text-neutral-900" data-slot-size-label="0">
                ${slot.size ? `Talla ${slot.size}` : 'Elige una talla'}
              </span>
            </div>
            <div class="grid grid-cols-6 gap-2">
              ${TALLAS_DISPONIBLES.map((t) => {
                const isSelected = slot.size === t;
                return `
                  <button type="button" data-slot-size-btn="${t}" data-slot-idx="0"
                    class="min-h-[44px] py-2.5 px-3 text-base font-bold rounded-xl text-center transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-sm font-bold'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 active:scale-95'
                    }">
                    ${t}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Para Combos con 2 o más prendas (Dúo, Trío): acordeón interactivo optimizado para móviles
    return this.slots
      .map((slot, idx) => {
        const isExpanded = this.focusedSlotIndex === idx;
        const colorObj = COLORES_DISPONIBLES.find((c) => c.id === slot.color) || COLORES_DISPONIBLES[0];
        const hasSelected = slot.colorSeleccionado === true;

        if (!isExpanded) {
          // Vista MINIMIZADA (Colapsada) - Compacta y táctil para celulares
          return `
            <div class="p-3.5 sm:p-4 rounded-2xl border border-neutral-200 bg-neutral-50/90 hover:bg-neutral-100/90 hover:border-neutral-300 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group shadow-2xs min-h-[58px]"
              data-slot-toggle="${idx}" role="button" tabindex="0" aria-label="Editar Prenda ${slot.index}" aria-expanded="false">
              
              <div class="flex items-center gap-3 min-w-0">
                ${
                  hasSelected
                    ? `
                      <!-- Círculo de check verde una vez ya haya seleccionado -->
                      <span class="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    `
                    : `
                      <!-- Círculo en blanco si aún no ha seleccionado -->
                      <span class="w-7 h-7 rounded-full border-2 border-neutral-300 bg-white text-neutral-400 text-xs flex items-center justify-center font-bold flex-shrink-0 group-hover:border-neutral-400 transition-colors shadow-2xs">
                        ${slot.index}
                      </span>
                    `
                }
                
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm sm:text-base font-bold text-neutral-900">
                      Prenda ${slot.index}: Color y talla
                    </span>
                    ${
                      hasSelected
                        ? `
                          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200 shadow-2xs">
                            <span class="w-3 h-3 rounded-full border border-neutral-300 flex-shrink-0" style="background-color: ${colorObj.hex}"></span>
                            <span class="capitalize">${colorObj.label}</span>
                          </span>
                        `
                        : `
                          <span class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-200/60 px-2.5 py-0.5 rounded-full border border-neutral-200">
                            <span class="w-2.5 h-2.5 rounded-full border border-neutral-400 bg-white flex-shrink-0"></span>
                            <span>Sin seleccionar</span>
                          </span>
                        `
                    }
                  </div>
                  <span class="text-xs text-neutral-500 font-medium mt-0.5">
                    Talla seleccionada: <strong class="text-neutral-800 font-bold">${slot.size || 'M'}</strong>
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-1 text-xs font-bold ${
                hasSelected
                  ? 'text-neutral-600 group-hover:text-neutral-950 bg-white'
                  : 'text-neutral-900 bg-white border-neutral-300'
              } flex-shrink-0 px-2.5 py-1.5 rounded-xl border border-neutral-200 group-hover:border-neutral-300 shadow-2xs transition-all">
                <span>${hasSelected ? 'Cambiar' : 'Elegir'}</span>
                <svg class="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          `;
        }

        // Vista EXPANDIDA (Activa)
        return `
          <div class="p-4 sm:p-5 rounded-2xl border-2 border-neutral-900 bg-white shadow-md transition-all duration-200" data-slot-block="${idx}" aria-expanded="true">
            
            <!-- Encabezado del Slot Expandido (click para colapsar) -->
            <div class="flex items-center justify-between mb-3.5 pb-2.5 border-b border-neutral-100 cursor-pointer" data-slot-header="${idx}" title="Click para colapsar">
              <div class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-full ${
                  hasSelected ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-white'
                } text-xs flex items-center justify-center font-black">
                  ${
                    hasSelected
                      ? `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`
                      : slot.index
                  }
                </span>
                <div>
                  <h3 class="text-base font-bold text-neutral-900 leading-tight">
                    Prenda ${slot.index}: Color y talla
                  </h3>
                  <p class="text-xs text-neutral-500 sm:hidden mt-0.5">
                    ${hasSelected ? 'Color listo. Toca otro si deseas cambiarlo' : idx + 1 < this.slots.length ? 'Elige un color para pasar a la siguiente' : 'Elige tu color preferido'}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-md ${
                  hasSelected ? 'bg-neutral-100 text-neutral-800 border border-neutral-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }">
                  <span class="capitalize" data-slot-color-label="${idx}">${hasSelected ? colorObj.label : 'Sin elegir'}</span>
                </span>
                <button type="button" class="p-1.5 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Minimizar">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 1. Swatches de Color (mínimo 44x44px) -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center justify-between">
                <span class="text-base font-bold text-neutral-900">
                  1. Color de la camiseta:
                </span>
                ${idx + 1 < this.slots.length ? `
                  <span class="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span>Avanza a la #${slot.index + 1} al elegir</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </span>
                ` : ''}
              </div>
              <div class="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 flex-wrap">
                ${COLORES_DISPONIBLES.map((c) => {
                  const isSelected = hasSelected && slot.color === c.id;
                  return `
                    <button type="button" data-slot-color-btn="${c.id}" data-slot-idx="${idx}" title="${c.label}"
                      class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all ${
                        c.border ? 'border-2 border-neutral-300' : ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-neutral-900 scale-105 shadow-md'
                          : 'hover:scale-105 opacity-90 hover:opacity-100 ring-1 ring-black/10 active:scale-95'
                      }" style="background-color: ${c.hex}">
                      ${
                        isSelected
                          ? `<svg class="w-5 h-5 ${
                              c.id === 'blanco' || c.id === 'gris-claro' ? 'text-neutral-950' : 'text-white'
                            }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`
                          : ''
                      }
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 2. Chips de Talla (mínimo 44px de altura) -->
            <div class="pt-3 border-t border-neutral-100 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-base font-bold text-neutral-900">2. Talla de la prenda:</span>
                <span class="text-base font-extrabold text-neutral-900" data-slot-size-label="${idx}">
                  ${slot.size ? `Talla ${slot.size}` : 'Elige una talla'}
                </span>
              </div>
              <div class="grid grid-cols-6 gap-2">
                ${TALLAS_DISPONIBLES.map((t) => {
                  const isSelected = slot.size === t;
                  return `
                    <button type="button" data-slot-size-btn="${t}" data-slot-idx="${idx}"
                      class="min-h-[44px] py-2.5 px-3 text-base font-bold rounded-xl text-center transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-sm font-bold'
                          : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 active:scale-95'
                      }">
                      ${t}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

          </div>
        `;
      })
      .join('');
  }

  bindEvents() {
    if (!this.modalEl) return;

    // Cierre por botón X (Mobile y Desktop) o botón Atrás (Mobile)
    this.modalEl.querySelectorAll('[data-modal-close], [data-modal-back]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.close();
      });
    });

    // Cierre por click en backdrop (solo en desktop)
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Cierre por tecla Escape
    document.addEventListener('keydown', this._handleKeyDown);

    // Bloqueo de scroll global en wheel y touchmove
    this.modalEl.addEventListener('wheel', this._preventBodyScroll, { passive: false });
    this.modalEl.addEventListener('touchmove', this._preventBodyScroll, { passive: false });

    // Selección de Color en un Slot:
    // Al seleccionar color se minimiza y avanza automáticamente al siguiente slot
    this.modalEl.addEventListener('click', (e) => {
      const colorBtn = e.target.closest('[data-slot-color-btn]');
      if (colorBtn) {
        const colorId = colorBtn.getAttribute('data-slot-color-btn');
        const slotIdx = parseInt(colorBtn.getAttribute('data-slot-idx'), 10);
        if (!isNaN(slotIdx) && this.slots[slotIdx]) {
          this.slots[slotIdx].color = colorId;
          this.slots[slotIdx].colorSeleccionado = true; // Marcado como seleccionado por el usuario
          
          // Si hay más prendas por configurar, avanzar a la siguiente
          if (this.slots.length > 1 && slotIdx + 1 < this.slots.length) {
            this.focusedSlotIndex = slotIdx + 1;
          } else {
            this.focusedSlotIndex = slotIdx;
          }

          this._actualizarUI();

          // Scroll suave hacia la siguiente prenda en pantallas móviles
          setTimeout(() => {
            const nextSlotEl = this.modalEl?.querySelector(`[data-slot-block="${this.focusedSlotIndex}"]`);
            if (nextSlotEl) {
              nextSlotEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 60);
        }
      }
    });

    // Expandir slot minimizado al hacer click en él
    this.modalEl.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-slot-toggle]');
      if (toggle) {
        const slotIdx = parseInt(toggle.getAttribute('data-slot-toggle'), 10);
        if (!isNaN(slotIdx)) {
          this.focusedSlotIndex = slotIdx;
          this._actualizarUI();
          setTimeout(() => {
            const slotEl = this.modalEl?.querySelector(`[data-slot-block="${slotIdx}"]`);
            if (slotEl) {
              slotEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 60);
        }
      }
    });

    // Colapsar slot expandido al hacer click en su encabezado
    this.modalEl.addEventListener('click', (e) => {
      const header = e.target.closest('[data-slot-header]');
      if (header) {
        const slotIdx = parseInt(header.getAttribute('data-slot-header'), 10);
        if (!isNaN(slotIdx) && this.slots.length > 1) {
          this.focusedSlotIndex = -1;
          this._actualizarUI();
        }
      }
    });

    // Accesibilidad por teclado para slots minimizados (Enter / Espacio)
    this.modalEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const toggle = e.target.closest('[data-slot-toggle]');
        if (toggle) {
          e.preventDefault();
          const slotIdx = parseInt(toggle.getAttribute('data-slot-toggle'), 10);
          if (!isNaN(slotIdx)) {
            this.focusedSlotIndex = slotIdx;
            this._actualizarUI();
          }
        }
      }
    });

    // Foco de color en combo de 6
    this.modalEl.addEventListener('click', (e) => {
      const focusBtn = e.target.closest('[data-combo6-color-focus]');
      if (focusBtn) {
        const slotIdx = parseInt(focusBtn.getAttribute('data-combo6-color-focus'), 10);
        if (!isNaN(slotIdx)) {
          this.focusedSlotIndex = slotIdx;
          this._actualizarUI();
        }
      }
    });

    // Aplicar talla global en combo de 6
    this.modalEl.addEventListener('click', (e) => {
      const globalSizeBtn = e.target.closest('[data-combo6-global-size]');
      if (globalSizeBtn) {
        const talla = globalSizeBtn.getAttribute('data-combo6-global-size');
        this.combo6TallaGlobal = talla;
        this.slots.forEach((s) => {
          s.size = talla;
        });
        this._actualizarUI();
      }
    });

    // Selección de Talla en un Slot
    this.modalEl.addEventListener('click', (e) => {
      const sizeBtn = e.target.closest('[data-slot-size-btn]');
      if (sizeBtn) {
        const sizeVal = sizeBtn.getAttribute('data-slot-size-btn');
        const slotIdx = parseInt(sizeBtn.getAttribute('data-slot-idx'), 10);
        if (!isNaN(slotIdx) && this.slots[slotIdx]) {
          this.slots[slotIdx].size = sizeVal;
          this.focusedSlotIndex = slotIdx;
          this._actualizarUI();
        }
      }
    });

    // Toggle Guía de Tallas
    const toggleGuideBtn = this.modalEl.querySelector('[data-toggle-size-guide]');
    const closeGuideBtn = this.modalEl.querySelector('[data-close-size-guide]');
    const guidePanel = this.modalEl.querySelector('[data-size-guide-panel]');

    toggleGuideBtn?.addEventListener('click', () => {
      guidePanel?.classList.toggle('hidden');
    });

    closeGuideBtn?.addEventListener('click', () => {
      guidePanel?.classList.add('hidden');
    });

    // Submit / Agregar al Carrito (escucha tanto en desktop como en mobile sticky footer)
    this.modalEl.addEventListener('click', (e) => {
      const submitBtn = e.target.closest('[data-modal-submit]');
      if (submitBtn && this.esValido) {
        this._confirmarCompra();
      }
    });
  }

  /** Previene que el scroll del fondo se mueva si el cursor no está sobre el panel scrollable del modal */
  _preventBodyScroll(e) {
    const scrollable = e.target.closest('[data-lenis-prevent]');
    if (!scrollable) {
      e.preventDefault();
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  _actualizarUI() {
    if (!this.modalEl) return;

    // Actualizar Preview Izquierdo
    const activeSlot =
      this.focusedSlotIndex >= 0 && this.slots[this.focusedSlotIndex]
        ? this.slots[this.focusedSlotIndex]
        : this.slots[0];
    const activeColorObj =
      COLORES_DISPONIBLES.find((c) => c.id === activeSlot.color) || COLORES_DISPONIBLES[0];

    const previewSwatch = this.modalEl.querySelector('[data-preview-swatch]');
    if (previewSwatch) previewSwatch.style.backgroundColor = activeColorObj.hex;

    const previewImg = this.modalEl.querySelector('[data-preview-img]');
    const previewText = this.modalEl.querySelector('[data-preview-text]');

    // Actualización de imagen de combinación para Combo Dúo
    if (this.combo.unidades === 2 && this.slots.length >= 2) {
      const comboDuoInfo = obtenerCombinacionDuo(this.slots[0].color, this.slots[1].color);
      if (previewImg) {
        previewImg.src = comboDuoInfo.ruta;
      }
      this.combo.imagen = comboDuoInfo.ruta;

      // Actualizar también la card en el grid principal de la tienda
      document.querySelectorAll(`[data-combo-card-img="${this.combo.id}"]`).forEach((img) => {
        img.src = comboDuoInfo.ruta;
      });

      const c1Label = COLORES_DISPONIBLES.find((c) => c.id === this.slots[0].color)?.label || this.slots[0].color;
      const c2Label = COLORES_DISPONIBLES.find((c) => c.id === this.slots[1].color)?.label || this.slots[1].color;

      if (previewText) {
        previewText.innerHTML = `Dúo <strong>#${comboDuoInfo.numero}</strong>: ${c1Label} + ${c2Label}`;
      }
    } else {
      if (previewText) {
        previewText.innerHTML = `Prenda <strong>${activeSlot.index}</strong>: <strong>${activeColorObj.label}</strong>`;
      }
      const previewSlotNum = this.modalEl.querySelector('[data-preview-slot-num]');
      if (previewSlotNum) previewSlotNum.textContent = String(activeSlot.index);

      const previewColorName = this.modalEl.querySelector('[data-preview-color-name]');
      if (previewColorName) previewColorName.textContent = activeColorObj.label;
    }

    // Actualizar píldora de colores debajo de la camiseta en el modal
    const modalPreviewPill = this.modalEl.querySelector('[data-modal-preview-pill]');
    if (modalPreviewPill) {
      modalPreviewPill.innerHTML = this._renderModalPillContent();
    }

    // Re-renderizar configuración de la derecha
    const slotsContainer = this.modalEl.querySelector('[data-slots-container]');
    if (slotsContainer) {
      slotsContainer.innerHTML = this.esCombo6 ? this._renderCombo6Content() : this._renderSlots();
    }

    // Actualizar CTAs (Tanto en desktop como en el sticky footer mobile)
    const btnsSubmit = this.modalEl.querySelectorAll('[data-modal-submit]');
    const ctaTexts = this.modalEl.querySelectorAll('[data-cta-text]');

    btnsSubmit.forEach((btnSubmit) => {
      btnSubmit.disabled = !this.esValido;
      if (this.esValido) {
        btnSubmit.className =
          'w-full py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm uppercase tracking-wider bg-neutral-900 hover:bg-black text-white shadow-lg shadow-neutral-900/15 cursor-pointer active:scale-[0.98]';
      } else {
        btnSubmit.className =
          'w-full py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm uppercase tracking-wider bg-neutral-200 text-neutral-400 cursor-not-allowed';
      }
    });

    ctaTexts.forEach((ctaText) => {
      ctaText.textContent = this.ctaTexto;
    });

    renderIcons(this.modalEl);
  }

  _confirmarCompra() {
    const uniqueId = `combo-${this.combo.id}-${Date.now()}`;
    const detallesSlots = this.slots
      .map((s) => {
        const colorLabel = COLORES_DISPONIBLES.find((c) => c.id === s.color)?.label || s.color;
        return `Camiseta ${s.index}: ${colorLabel} (Talla ${s.size})`;
      })
      .join(' | ');

    const tallasArray = this.slots.map((s) => s.size).join(' / ');
    const coloresArray = this.slots
      .map((s) => COLORES_DISPONIBLES.find((c) => c.id === s.color)?.label || s.color)
      .join(', ');

    const attributes = [
      { key: 'Modalidad', value: this.combo.titulo },
      { key: 'Unidades', value: String(this.combo.unidades) },
      { key: 'Configuración de Prendas', value: detallesSlots }
    ];

    if (this.combo.unidades === 2 && this.slots.length >= 2) {
      const duo = obtenerCombinacionDuo(this.slots[0].color, this.slots[1].color);
      attributes.push({ key: 'Combinación Dúo', value: `N.° ${duo.numero}` });
    }

    const cartItem = {
      id: uniqueId,
      name: `${this.combo.titulo} (${this.combo.unidades} uds)`,
      color: coloresArray,
      colorId: this.slots.map((s) => s.color).join('-'),
      size: tallasArray,
      logo: 'Estándar',
      quantity: 1,
      unitPrice: this.combo.precio,
      totalPrice: this.combo.precio,
      imagePreview: this.combo.imagen,
      attributes
    };

    cartStore.addToCart(cartItem);
    this.close();
    cartStore.openDrawer();
    this.onAdded?.(cartItem);
  }

  open() {
    const el = this.render();
    document.body.appendChild(el);

    // Animación Slide-Over fluida estilo Temu para celulares (< 768px)
    requestAnimationFrame(() => {
      const panel = el.querySelector('[data-modal-panel]');
      if (panel) {
        panel.classList.remove('translate-x-full');
        panel.classList.add('translate-x-0');
      }
    });

    // Bloquear scroll general del documento
    window.__lenis?.stop();
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  close() {
    if (this._isClosing) return;
    this._isClosing = true;

    const panel = this.modalEl?.querySelector('[data-modal-panel]');
    // Si estamos en celular, animar slide-out hacia la derecha
    if (panel && window.innerWidth < 768) {
      panel.classList.remove('translate-x-0');
      panel.classList.add('translate-x-full');
      this.modalEl.classList.add('opacity-0');
      setTimeout(() => this._cleanupModal(), 250);
    } else {
      this._cleanupModal();
    }
  }

  _cleanupModal() {
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.modalEl) {
      this.modalEl.removeEventListener('wheel', this._preventBodyScroll);
      this.modalEl.removeEventListener('touchmove', this._preventBodyScroll);
      if (this.modalEl.parentNode) {
        this.modalEl.parentNode.removeChild(this.modalEl);
      }
    }
    this.modalEl = null;
    this._isClosing = false;

    // Restaurar scroll general
    window.__lenis?.start();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.touchAction = '';

    this.onClose?.();
  }
}
