/**
 * BundleSelector: Componente selector de modalidades de compra y paquetes en combo.
 * Gestiona:
 * - Tipo de Producto: "Camiseta Deportiva" y "Camiseta Manga Siza Deportiva"
 * - Modalidades: Individual (x1), Combo x2, Combo x3, Combo x6
 * - Restricciones de color (x2 solo negro, x3 opciones predefinidas, x6 colección completa)
 * - Tallas (S, M, L, XL, XXL)
 * - Mapeo de atributos oficiales para Shopify Storefront API
 */

import {
  TIPOS_PRODUCTO,
  TALLAS_DISPONIBLES,
  COLORES_BASE,
  MODALIDADES_BUNDLE,
  OPCIONES_COMBO_3,
  formatearCOP
} from '../data/product.js';

export class BundleSelector {
  /**
   * @param {HTMLElement|string} target - Contenedor DOM donde se monta el selector
   * @param {object} [options]
   * @param {string} [options.tipoProductoInicial='CAMISETA']
   * @param {string} [options.modalidadInicial='individual']
   * @param {string} [options.colorInicial='negro']
   * @param {string} [options.tallaInicial='L']
   * @param {Function} [options.onColorChange] - Callback cuando cambia el color a previsualizar en 3D
   * @param {Function} [options.onModeChange] - Callback cuando cambia modalidad o producto
   * @param {Function} [options.onChange] - Callback general de cambio de estado
   */
  constructor(target, options = {}) {
    this.container = typeof target === 'string' ? document.querySelector(target) : target;
    this.onColorChange = options.onColorChange || null;
    this.onProductTypeChange = options.onProductTypeChange || null;
    this.onModeChange = options.onModeChange || null;
    this.onChange = options.onChange || null;

    // Estado interno
    this.tipoProductoKey = options.tipoProductoInicial || 'CAMISETA';
    this.modalidadId = options.modalidadInicial || 'individual';
    this.colorId = options.colorInicial || 'negro';
    this.combo3OpcionId = 'opcion-1';
    this.talla = options.tallaInicial || 'L';
    this.cantidad = 1;

    this._rendered = false;
  }

  get tipoProducto() {
    return TIPOS_PRODUCTO[this.tipoProductoKey] || TIPOS_PRODUCTO.CAMISETA;
  }

  get modalidad() {
    return MODALIDADES_BUNDLE.find((m) => m.id === this.modalidadId) || MODALIDADES_BUNDLE[0];
  }

  get precioUnitario() {
    return this.tipoProducto.precios[this.modalidadId] || this.tipoProducto.precios.individual;
  }

  get ahorroTexto() {
    return this.tipoProducto.ahorros[this.modalidadId] || '';
  }

  get colorActual() {
    return COLORES_BASE.find((c) => c.id === this.colorId) || COLORES_BASE[0];
  }

  get combo3Opcion() {
    return OPCIONES_COMBO_3.find((op) => op.id === this.combo3OpcionId) || OPCIONES_COMBO_3[0];
  }

  /**
   * Devuelve la descripción de colores según la modalidad activa.
   * @returns {string}
   */
  getColorDetailsText() {
    switch (this.modalidadId) {
      case 'individual':
        return this.colorActual.label;
      case 'combo2':
        return '2x Negro (Mismo Color)';
      case 'combo3':
        return `${this.combo3Opcion.label}: ${this.combo3Opcion.descripcion}`;
      case 'combo6':
        return 'Colección Completa: 1x Negro, 1x Blanco, 1x Azul Oscuro, 1x Verde Militar, 1x Gris Claro, 1x Gris Oscuro';
      default:
        return this.colorActual.label;
    }
  }

  /**
   * Genera el payload listo para el carrito y checkout de Shopify.
   * @param {Array} [shopifyVariants] - Lista de variantes opcional para resolver merchandiseId
   * @returns {object}
   */
  getCartItemData(shopifyVariants = []) {
    const colorDetailsText = this.getColorDetailsText();
    const modalidadLabel = this.modalidad.titulo;
    const ref = this.tipoProducto.nombre;

    let merchandiseId = null;
    if (Array.isArray(shopifyVariants) && shopifyVariants.length > 0) {
      const match = shopifyVariants.find((v) => {
        const titleLower = v.title.toLowerCase();
        return titleLower.includes(this.talla.toLowerCase());
      });
      merchandiseId = match?.id || shopifyVariants[0]?.id || null;
    }

    return {
      name: `${ref} (${modalidadLabel})`,
      productType: ref,
      tipoProductoKey: this.tipoProductoKey,
      bundleMode: this.modalidadId,
      bundleModeLabel: modalidadLabel,
      color: colorDetailsText,
      colorHex: this.colorActual.hex,
      colorDetailsText,
      size: this.talla,
      logo: 'Estándar',
      quantity: this.cantidad,
      unitPrice: this.precioUnitario,
      totalPrice: this.precioUnitario * this.cantidad,
      merchandiseId,
      variantId: merchandiseId,
      shopifyVariantId: merchandiseId,
      attributes: [
        { key: 'Modalidad', value: modalidadLabel },
        { key: 'Referencia', value: ref },
        { key: 'Detalle Colores', value: colorDetailsText },
        { key: 'Talla', value: this.talla },
        { key: 'Logo Seleccionado', value: 'Estándar' }
      ]
    };
  }

  mount() {
    if (!this.container) return this;
    this.render();
    this.bindEvents();
    this._notificarCambio();
    return this;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="bundle-selector-root space-y-2 select-none" data-bundle-root>
        
        <!-- 1. SELECTOR DE TIPO DE PRENDA (TABS) -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 tracking-wider uppercase block">
            Tipo de Prenda:
          </label>
          <div class="grid grid-cols-2 gap-2 p-1 bg-neutral-100 border border-neutral-200 rounded-xl">
            <button type="button" data-product-type="CAMISETA"
              class="py-2 px-3 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 ${
                this.tipoProductoKey === 'CAMISETA'
                  ? 'bg-neutral-950 text-white border-2 border-neutral-950 shadow-sm font-bold'
                  : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 rounded-xl font-medium'
              }">
              <span>Camiseta Deportiva</span>
            </button>
            <button type="button" data-product-type="MANGA_SIZA"
              class="py-2 px-3 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 ${
                this.tipoProductoKey === 'MANGA_SIZA'
                  ? 'bg-neutral-950 text-white border-2 border-neutral-950 shadow-sm font-bold'
                  : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 rounded-xl font-medium'
              }">
              <span>Manga Siza</span>
            </button>
          </div>
        </div>

        <!-- 2. SELECTOR DE MODALIDAD (COMBOS Y PAQUETES) -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-neutral-500 tracking-wider uppercase block">
              Modalidad de Compra:
            </label>
            <span class="text-xs font-bold text-neutral-900" data-bundle-active-price>
              ${formatearCOP(this.precioUnitario)}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" data-bundle-modes-grid>
            ${MODALIDADES_BUNDLE.map((m) => {
              const precio = this.tipoProducto.precios[m.id];
              const ahorro = this.tipoProducto.ahorros[m.id];
              const isActive = m.id === this.modalidadId;

              return `
                <button type="button" data-mode-id="${m.id}"
                  class="p-3 sm:p-4 rounded-xl text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                    isActive
                      ? 'bg-white border-2 border-neutral-950 shadow-sm cursor-pointer'
                      : 'bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50 transition-all cursor-pointer'
                  }">
                  ${
                    ahorro
                      ? `<span class="absolute top-1.5 right-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">${ahorro}</span>`
                      : ''
                  }
                  <div>
                    <span class="block font-bold text-neutral-900 text-sm leading-tight">${m.titulo}</span>
                    <span class="block text-xs text-neutral-500 mt-1">${m.subtitulo}</span>
                  </div>
                  <div class="mt-2 pt-1 border-t border-neutral-100 flex items-baseline justify-between">
                    <span class="text-xs font-black text-neutral-950">
                      ${formatearCOP(precio)}
                    </span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. CONFIGURADOR CONDICIONAL DE COLOR / PALETA -->
        <div class="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5" data-bundle-color-section>
          ${this._renderizarSeccionColor()}
        </div>

        <!-- 4. SELECTOR DE TALLA (S a XXL) -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-neutral-500 tracking-wider uppercase">
              Talla del Paquete: <span class="text-neutral-950 font-bold" data-bundle-size-label>${this.talla}</span>
            </label>
            <span class="text-xs text-neutral-400">Corte Boxy Athletic</span>
          </div>

          <div class="grid grid-cols-5 gap-2">
            ${TALLAS_DISPONIBLES.map((t) => `
              <button type="button" data-bundle-size="${t}"
                class="py-2 rounded-xl text-xs transition-all text-center ${
                  t === this.talla
                    ? 'bg-neutral-950 text-white border-2 border-neutral-950 shadow-sm font-bold'
                    : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 font-medium'
                }">
                ${t}
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    this._rendered = true;
  }

  _renderizarSeccionColor() {
    switch (this.modalidadId) {
      case 'individual':
        return `
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-800">
              Color: <span class="text-neutral-950 font-black capitalize">${this.colorActual.label}</span>
            </span>
            <span class="text-xs text-neutral-400">6 Tonos</span>
          </div>
          <div class="grid grid-cols-6 gap-2 pt-1">
            ${COLORES_BASE.map((c) => `
              <button type="button" data-color-choice="${c.id}" title="${c.label}"
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-black/10 flex items-center justify-center transition-all ${
                  c.id === this.colorId
                    ? 'ring-2 ring-offset-2 ring-neutral-950 scale-110 shadow-sm'
                    : 'ring-1 ring-neutral-200 hover:scale-105 opacity-85 hover:opacity-100'
                }" style="background-color: ${c.hex}">
                ${c.id === this.colorId ? '<span class="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>' : ''}
              </button>
            `).join('')}
          </div>
        `;

      case 'combo2':
        return `
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-800">
              Color Combo x2: <span class="text-neutral-950 font-black">Negro (Fijo)</span>
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200 text-neutral-800">
              2 Camisetas
            </span>
          </div>
          <div class="p-2.5 rounded-xl bg-white border border-neutral-200 flex items-center gap-3">
            <div class="flex -space-x-1.5">
              <span class="w-5 h-5 rounded-full bg-[#111111] border border-neutral-300 shadow-xs"></span>
              <span class="w-5 h-5 rounded-full bg-[#111111] border border-neutral-300 shadow-xs"></span>
            </div>
            <p class="text-xs text-neutral-600 leading-snug">
              Combo promocional de <strong>2 unidades exclusivamente en color Negro</strong>.
            </p>
          </div>
        `;

      case 'combo3':
        return `
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-800">
              Elige tu Paquete de 3 Colores:
            </span>
            <span class="text-xs text-neutral-400">3 Opciones</span>
          </div>

          <div class="space-y-1.5 pt-1">
            ${OPCIONES_COMBO_3.map((op) => {
              const isSelected = op.id === this.combo3OpcionId;
              return `
                <button type="button" data-combo3-option="${op.id}"
                  class="w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-white border-2 border-neutral-950 shadow-sm text-neutral-950'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50/50'
                  }">
                  <div class="flex items-center gap-2.5">
                    <span class="w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300'
                    }">
                      ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
                    </span>
                    <div>
                      <span class="text-xs font-bold uppercase text-neutral-900 block leading-tight">${op.label}</span>
                      <span class="text-[11px] text-neutral-500">${op.descripcion}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5">
                    ${op.colores
                      .map(
                        (col) => `
                        <span data-preview-color="${col.hex}" title="Previsualizar ${col.label}"
                          class="w-4 h-4 rounded-full border border-neutral-200 cursor-pointer hover:scale-125 transition-transform shadow-xs"
                          style="background-color: ${col.hex}">
                        </span>
                      `
                      )
                      .join('')}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        `;

      case 'combo6':
        return `
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-800">
              Colección Completa (6 Colores):
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              1 de Cada Color
            </span>
          </div>
          <div class="p-2.5 rounded-xl bg-white border border-neutral-200 space-y-1.5">
            <p class="text-xs text-neutral-600">
              ✨ Incluye exactamente <strong>1 camiseta de cada uno de los 6 colores oficiales</strong>:
            </p>
            <div class="flex items-center justify-between gap-1 pt-1">
              ${COLORES_BASE.map(
                (c) => `
                <div class="flex flex-col items-center gap-1">
                  <span data-preview-color="${c.hex}" title="${c.label}"
                    class="w-5 h-5 rounded-full border border-neutral-200 cursor-pointer hover:scale-115 transition-transform shadow-xs"
                    style="background-color: ${c.hex}">
                  </span>
                  <span class="text-[9px] text-neutral-500 font-medium text-center truncate max-w-[45px]">${c.label.split(' ')[0]}</span>
                </div>
              `
              ).join('')}
            </div>
          </div>
        `;

      default:
        return '';
    }
  }

  bindEvents() {
    if (!this.container) return;

    this.container.addEventListener('click', (e) => {
      // 1. Cambio de Tipo de Prenda
      const typeBtn = e.target.closest('[data-product-type]');
      if (typeBtn) {
        this.tipoProductoKey = typeBtn.getAttribute('data-product-type');
        this.render();
        if (typeof this.onProductTypeChange === 'function') {
          this.onProductTypeChange(this.tipoProductoKey);
        }
        this._notificarCambio();
        return;
      }

      // 2. Cambio de Modalidad (Individual / Combo x2 / x3 / x6)
      const modeBtn = e.target.closest('[data-mode-id]');
      if (modeBtn) {
        this.modalidadId = modeBtn.getAttribute('data-mode-id');

        // Restricciones automáticas de color según la modalidad
        if (this.modalidadId === 'combo2') {
          this.colorId = 'negro';
          this._notificarColor(this.colorActual);
        } else if (this.modalidadId === 'combo3') {
          // Previsualizar primer color de la opción activa de combo3
          const primerColor = this.combo3Opcion.colores[0];
          if (primerColor) {
            this.colorId = primerColor.id;
            this._notificarColor(primerColor);
          }
        }

        this.render();
        this._notificarCambio();
        return;
      }

      // 3. Selección de Color Individual
      const colorBtn = e.target.closest('[data-color-choice]');
      if (colorBtn) {
        this.colorId = colorBtn.getAttribute('data-color-choice');
        this._notificarColor(this.colorActual);
        this.render();
        this._notificarCambio();
        return;
      }

      // 4. Selección de Opción en Combo x3
      const combo3Btn = e.target.closest('[data-combo3-option]');
      if (combo3Btn) {
        this.combo3OpcionId = combo3Btn.getAttribute('data-combo3-option');
        const primerColor = this.combo3Opcion.colores[0];
        if (primerColor) {
          this.colorId = primerColor.id;
          this._notificarColor(primerColor);
        }
        this.render();
        this._notificarCambio();
        return;
      }

      // 5. Previsualización de Color al tocar mini-círculo
      const previewDot = e.target.closest('[data-preview-color]');
      if (previewDot) {
        const hex = previewDot.getAttribute('data-preview-color');
        const found = COLORES_BASE.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
        if (found) {
          this.colorId = found.id;
          this._notificarColor(found);
        } else if (hex) {
          this._notificarColor({ hex, label: 'Previsualización', id: 'custom' });
        }
        return;
      }

      // 6. Selección de Talla
      const sizeBtn = e.target.closest('[data-bundle-size]');
      if (sizeBtn) {
        this.talla = sizeBtn.getAttribute('data-bundle-size');
        this.render();
        this._notificarCambio();
        return;
      }
    });
  }

  _notificarColor(colorObj) {
    if (typeof this.onColorChange === 'function' && colorObj?.hex) {
      this.onColorChange(colorObj.hex, colorObj.id, colorObj.label);
    }
  }

  _notificarCambio() {
    const data = this.getCartItemData();

    if (typeof this.onModeChange === 'function') {
      this.onModeChange(data);
    }
    if (typeof this.onChange === 'function') {
      this.onChange(data);
    }
  }
}
