import { Component } from '../../core/Component.js';
import { cartStore } from '../../core/CartStore.js';
import { formatearCOP, UMBRAL_ENVIO_GRATIS } from '../../data/product.js';
import { SITIO } from '../../data/site.js';
import { renderIcons } from '../../shared/utils/icons.js';
import { createShopifyCheckout } from '../../services/shopify.js';
import template from './cart-drawer.html?raw';
import './cart-drawer.css';

/**
 * CartDrawer: Carrito lateral deslizable y accesible con gestión completa de ítems.
 */
export class CartDrawer extends Component {
  constructor() {
    super(template, { mount: '#app' });
    this._unsubscribeCart = null;
    this.isCheckingOut = false;
  }

  render() {
    super.render();
    this._sincronizarEstado(cartStore.getState());
  }

  bindEvents() {
    // Cerrar al hacer clic en [X] o en el backdrop
    const btnCerrar = this.query('[data-cart-close]');
    const backdrop = this.query('[data-cart-backdrop]');

    if (btnCerrar) {
      this.on(btnCerrar, 'click', () => cartStore.closeDrawer());
    }

    if (backdrop) {
      this.on(backdrop, 'click', () => cartStore.closeDrawer());
    }

    // Cerrar con tecla Escape
    const onKeydown = (e) => {
      if (e.key === 'Escape' && cartStore.isOpen) {
        cartStore.closeDrawer();
      }
    };
    window.addEventListener('keydown', onKeydown);
    this._disposers.push(() => window.removeEventListener('keydown', onKeydown));

    // Vaciar carrito
    const btnClear = this.query('[data-clear-cart-btn]');
    if (btnClear) {
      this.on(btnClear, 'click', () => {
        if (cartStore.getState().items.length > 0) {
          if (window.confirm('¿Deseas vaciar todos los artículos de tu carrito?')) {
            cartStore.clearCart();
          }
        }
      });
    }

    // Botón de Checkout / Proceder al Pago
    const btnCheckout = this.query('[data-checkout-btn]');
    if (btnCheckout) {
      this.on(btnCheckout, 'click', () => this._handleCheckout());
    }

    // Botón alternativo de pago por WhatsApp (fallback)
    const btnFallbackWa = this.query('[data-checkout-fallback-wa]');
    if (btnFallbackWa) {
      this.on(btnFallbackWa, 'click', () => this._handleWhatsAppOrder());
    }

    // Suscripción reactiva a cambios en CartStore
    this._unsubscribeCart = cartStore.subscribe((state) => {
      this._sincronizarEstado(state);
    });
    this._disposers.push(this._unsubscribeCart);
  }

  /**
   * Sincroniza la UI del Drawer con el estado actual del carrito.
   * @private
   * @param {object} state
   */
  _sincronizarEstado(state) {
    const rootEl = this.query('#cart-drawer-root');
    if (!rootEl) return;

    // Abrir o cerrar el drawer según state.isOpen
    if (state.isOpen) {
      rootEl.classList.add('is-open');
      rootEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    } else {
      rootEl.classList.remove('is-open');
      rootEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Actualizar badge de prendas en el header
    const badgeCount = this.query('[data-drawer-count-badge]');
    if (badgeCount) {
      const txt = state.cartCount === 1 ? '1 prenda' : `${state.cartCount} prendas`;
      badgeCount.textContent = txt;
    }

    // Actualizar barra de envío gratis ($250.000 COP)
    this._actualizarBarraEnvioGratis(state.cartTotal);

    // Actualizar totales en el footer
    const subtotalEl = this.query('[data-drawer-subtotal]');
    const totalEl = this.query('[data-drawer-total]');
    const footerEl = this.query('[data-cart-footer]');

    if (subtotalEl) subtotalEl.textContent = formatearCOP(state.cartTotal);
    if (totalEl) totalEl.textContent = formatearCOP(state.cartTotal);

    if (footerEl) {
      footerEl.style.display = state.items.length === 0 ? 'none' : 'block';
    }

    // Renderizar lista de artículos o Empty State
    this._renderizarCuerpo(state.items);
  }

  /**
   * Actualiza el incentivo visual de Envío Gratis basado en el umbral de $250.000 COP.
   * @private
   * @param {number} subtotal
   */
  _actualizarBarraEnvioGratis(subtotal) {
    const msgEl = this.query('[data-shipping-bar-message]');
    const fillEl = this.query('[data-shipping-bar-fill]');
    const pctEl = this.query('[data-shipping-bar-percent]');
    if (!msgEl || !fillEl) return;

    const umbral = UMBRAL_ENVIO_GRATIS || 250000;
    const sub = Number(subtotal) || 0;
    const pct = Math.min(100, Math.max(0, Math.round((sub / umbral) * 100)));

    if (pctEl) pctEl.textContent = `${pct}%`;
    fillEl.style.width = `${pct}%`;

    if (sub < umbral) {
      const faltante = umbral - sub;
      msgEl.innerHTML = `¡Te faltan <span class="font-bold text-white">${formatearCOP(faltante)}</span> para tener <span class="text-amber-400 font-bold">ENVÍO GRATIS</span>!`;
      fillEl.className = 'h-full bg-amber-400 rounded-full transition-all duration-500 ease-out';
    } else {
      msgEl.innerHTML = `🎉 <span class="text-emerald-400 font-bold">¡Felicidades! Tienes ENVÍO GRATIS asegurado</span>`;
      fillEl.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out';
    }
  }

  /**
   * Renderiza los ítems o el estado vacío del carrito.
   * @private
   * @param {Array} items
   */
  _renderizarCuerpo(items) {
    const bodyEl = this.query('[data-cart-body]');
    if (!bodyEl) return;

    if (!items || items.length === 0) {
      bodyEl.innerHTML = `
        <div class="h-full min-h-[300px] flex flex-col items-center justify-center text-center py-10 px-4 space-y-4">
          <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-gray-400 transition-colors">
            <i data-lucide="shopping-cart" class="w-8 h-8 opacity-60"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-slate-900 dark:text-white font-bold text-base transition-colors">Tu carrito está vacío</h3>
            <p class="text-sm text-slate-500 dark:text-gray-400 max-w-xs transition-colors">
              Aún no has agregado ninguna camiseta personalizada a tu pedido.
            </p>
          </div>
          <button type="button" data-empty-cta
            class="mt-3 px-6 py-2.5 rounded-full border border-black dark:border-white text-black dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
            Empezar a Personalizar
          </button>
        </div>
      `;

      const emptyCta = bodyEl.querySelector('[data-empty-cta]');
      if (emptyCta) {
        emptyCta.addEventListener('click', () => {
          cartStore.closeDrawer();
          const target = document.querySelector('#colores');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
      }

      renderIcons(bodyEl);
      return;
    }

    // Renderizado de lista de productos
    bodyEl.innerHTML = items
      .map(
        (item) => `
        <div class="cart-item-card p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex gap-3 relative group transition-colors" data-cart-item-id="${item.id}">
          <!-- Miniatura con indicador de color -->
          <div class="w-16 h-16 rounded-lg bg-slate-200/80 dark:bg-black/40 border border-slate-300 dark:border-white/10 flex-shrink-0 flex items-center justify-center relative overflow-hidden p-1.5 transition-colors">
            <div class="absolute inset-0 opacity-20" style="background-color: ${item.colorHex}"></div>
            <img src="${item.imagePreview}" alt="${item.name}" class="w-full h-full object-contain relative z-10" loading="lazy" />
            <span class="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm" style="background-color: ${item.colorHex}" title="${item.color}"></span>
          </div>

          <!-- Detalles del Ítem -->
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start gap-2">
              <h4 class="text-slate-900 dark:text-white font-bold text-sm truncate transition-colors">${item.name}</h4>
              <button type="button" data-remove-item="${item.id}" aria-label="Eliminar ${item.name}"
                class="text-slate-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Etiquetas: Modalidad, Color, Talla -->
            <div class="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-700 dark:text-gray-300">
              ${item.bundleModeLabel ? `<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-bold uppercase text-[10px]">${item.bundleModeLabel}</span>` : ''}
              <span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-medium">${item.colorDetailsText || item.color}</span>
              ${item.logo && item.logo !== 'Estándar' && item.logo !== 'Sin logo' ? `<span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-medium">${item.logo}</span>` : ''}
              <span class="px-2 py-0.5 rounded bg-black text-white dark:bg-white/15 dark:text-white font-bold">Talla ${item.size}</span>
            </div>

            <!-- Selector de Cantidad inline y Subtotal -->
            <div class="flex items-center justify-between mt-3">
              <div class="inline-flex items-center border border-slate-300 dark:border-white/15 rounded-full bg-white dark:bg-black/40 p-0.5 transition-colors">
                <button type="button" data-item-qty-minus="${item.id}" aria-label="Disminuir"
                  class="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all">
                  <i data-lucide="minus" class="w-3 h-3"></i>
                </button>
                <span class="w-7 text-center font-bold text-xs text-slate-900 dark:text-white select-none">${item.quantity}</span>
                <button type="button" data-item-qty-plus="${item.id}" aria-label="Aumentar"
                  class="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                </button>
              </div>

              <div class="text-right">
                <span class="text-slate-950 dark:text-white font-extrabold text-sm transition-colors">${formatearCOP(item.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    // Asignar listeners para botones de cantidad y eliminación en cada ítem
    items.forEach((item) => {
      const btnMinus = bodyEl.querySelector(`[data-item-qty-minus="${item.id}"]`);
      const btnPlus = bodyEl.querySelector(`[data-item-qty-plus="${item.id}"]`);
      const btnRemove = bodyEl.querySelector(`[data-remove-item="${item.id}"]`);

      if (btnMinus) {
        btnMinus.addEventListener('click', () => {
          cartStore.updateQuantity(item.id, item.quantity - 1);
        });
      }

      if (btnPlus) {
        btnPlus.addEventListener('click', () => {
          cartStore.updateQuantity(item.id, item.quantity + 1);
        });
      }

      if (btnRemove) {
        btnRemove.addEventListener('click', () => {
          cartStore.removeFromCart(item.id);
        });
      }
    });

    renderIcons(bodyEl);
  }

  /**
   * Ejecuta el flujo de Checkout de Shopify.
   * Crea un carrito remoto con mutación GraphQL cartCreate y redirige al checkoutUrl oficial.
   * En caso de error, muestra mensaje amigable y ofrece fallback a WhatsApp.
   * @private
   */
  async _handleCheckout() {
    if (this.isCheckingOut) return;

    const { items, cartTotal, cartCount } = cartStore.getState();
    if (!items || items.length === 0) return;

    const btnCheckout = this.query('[data-checkout-btn]');
    const spinner = this.query('[data-checkout-spinner]');
    const text = this.query('[data-checkout-text]');
    const icon = this.query('[data-checkout-icon]');
    const feedback = this.query('[data-checkout-feedback]');
    const errorMsg = this.query('[data-checkout-error-msg]');
    const fallbackWa = this.query('[data-checkout-fallback-wa]');

    // Limpiar errores visuales previos
    if (feedback) feedback.classList.add('hidden');
    if (fallbackWa) fallbackWa.classList.add('hidden');

    // Activar estado de carga isCheckingOut
    this.isCheckingOut = true;
    if (btnCheckout) btnCheckout.disabled = true;
    if (spinner) spinner.classList.remove('hidden');
    if (icon) icon.classList.add('hidden');
    if (text) text.textContent = 'Creando orden en Shopify...';

    // Disparar evento para analítica
    window.dispatchEvent(
      new CustomEvent('tambo:checkout:init', {
        detail: { items, cartTotal, cartCount }
      })
    );

    try {
      const checkoutResult = await createShopifyCheckout(items);

      if (checkoutResult?.checkoutUrl && checkoutResult.checkoutUrl.includes('/checkouts/')) {
        if (text) text.textContent = 'Redirigiendo a Shopify...';
        window.location.href = checkoutResult.checkoutUrl;
        return;
      }

      // Si no retornó una URL de checkout válida o se detuvo la compra
      this.isCheckingOut = false;
      if (btnCheckout) btnCheckout.disabled = false;
      if (spinner) spinner.classList.add('hidden');
      if (icon) icon.classList.remove('hidden');
      if (text) text.textContent = 'Proceder al Pago';
    } catch (err) {
      console.error('[CartDrawer] Error en createShopifyCheckout:', err);

      // Restaurar estado del botón
      this.isCheckingOut = false;
      if (btnCheckout) btnCheckout.disabled = false;
      if (spinner) spinner.classList.add('hidden');
      if (icon) icon.classList.remove('hidden');
      if (text) text.textContent = 'Proceder al Pago';

      // Mostrar mensaje de error amigable en la UI
      if (feedback && errorMsg) {
        feedback.classList.remove('hidden');
        errorMsg.textContent =
          err.message ||
          'No se pudo conectar con el checkout de Shopify. Verifica tu conexión o intenta más tarde.';
        
        if (fallbackWa) {
          fallbackWa.classList.remove('hidden');
        }
        renderIcons(feedback);
      }
    }
  }

  /**
   * Fallback: Envía el pedido formateado a WhatsApp si el usuario prefiere o si falla el checkout.
   * @private
   */
  _handleWhatsAppOrder() {
    const { items, cartTotal, cartCount } = cartStore.getState();
    if (!items.length) return;

    const lineas = items.map(
      (item, idx) =>
        `${idx + 1}. *${item.quantity}x* ${item.name} (Talla: *${item.size}* | Color: *${item.color}* | Logo: *${item.logo}*) - ${formatearCOP(item.totalPrice)}`
    );

    const mensaje = [
      '¡Hola Tambo Active! 👋 Quiero realizar el pedido de mi carrito de compras:',
      '',
      '*DETALLE DEL PEDIDO:*',
      ...lineas,
      '',
      `*TOTAL PRENDAS:* ${cartCount}`,
      `*SUBTOTAL A PAGAR:* ${formatearCOP(cartTotal)}`,
      '*ENVÍO:* ¡Gratis a toda Colombia! 🇨🇴',
      '',
      'Por favor me indican los datos para el envío y el método de pago.'
    ].join('\n');

    const waCheckoutUrl = `https://wa.me/${SITIO.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
    window.open(waCheckoutUrl, '_blank', 'noopener,noreferrer');
  }

  destroy() {
    if (this._unsubscribeCart) {
      this._unsubscribeCart();
      this._unsubscribeCart = null;
    }
    super.destroy();
  }
}
