import { Component } from '../../core/Component.js';
import { cartStore } from '../../core/CartStore.js';
import { themeManager } from '../../core/ThemeManager.js';
import { whatsappSvg } from '../../shared/icons/index.js';
import { renderIcons } from '../../shared/utils/icons.js';
import { enlaceWhatsAppInformacion } from '../../shared/utils/whatsapp.js';
import template from './navbar.html?raw';
import './navbar.css';

/**
 * Navbar: navegación fija con menú móvil, alternador interactivo de tema Claro/Oscuro,
 * botón de carrito con badge dinámico y soporte WhatsApp.
 */
export class Navbar extends Component {
  constructor() {
    super(template, { mount: '#app' });
    this._unsubscribeCart = null;
    this._unsubscribeTheme = null;
  }

  render() {
    super.render();

    // Inyectar enlace de WhatsApp en desktop y móvil
    const waUrl = enlaceWhatsAppInformacion();
    const waDesk = this.query('[data-nav-wa-desktop]');
    if (waDesk) {
      waDesk.href = waUrl;
      const slot = waDesk.querySelector('.nav-wa-icon-slot');
      if (slot) slot.innerHTML = whatsappSvg('w-4 h-4 text-gray-800 dark:text-white transition-colors');
    }

    const waMovil = this.query('[data-nav-wa-mobile]');
    if (waMovil) {
      waMovil.href = waUrl;
      const slot = waMovil.querySelector('.nav-wa-icon-slot');
      if (slot) slot.innerHTML = whatsappSvg('w-5 h-5 text-gray-800 dark:text-white transition-colors');
    }

    renderIcons(this.root);
  }

  bindEvents() {
    const toggle = this.query('#menu-toggle');
    const menu = this.query('#menu-movil');

    if (toggle && menu) {
      this.on(toggle, 'click', () => {
        const abierto = menu.classList.toggle('hidden') === false;
        toggle.setAttribute('aria-expanded', String(abierto));
      });

      this.queryAll('#menu-movil a').forEach((enlace) => {
        this.on(enlace, 'click', () => {
          menu.classList.add('hidden');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Eventos para abrir el carrito
    this.queryAll('[data-cart-trigger]').forEach((btn) => {
      this.on(btn, 'click', (e) => {
        e.preventDefault();
        cartStore.openDrawer();
      });
    });

    // Eventos para alternar entre tema Claro y Oscuro
    this.queryAll('[data-theme-toggle]').forEach((btn) => {
      this.on(btn, 'click', (e) => {
        e.preventDefault();
        themeManager.toggleTheme();
      });
    });

    // Suscripción al estado del tema para actualizar aria-label y títulos
    this._unsubscribeTheme = themeManager.subscribe((theme) => {
      this._actualizarEstadoTema(theme);
    });
    this._disposers.push(this._unsubscribeTheme);

    // Suscripción al estado del carrito para actualizar badges
    this._unsubscribeCart = cartStore.subscribe((state) => {
      this._actualizarBadge(state.cartCount);
    });
    this._disposers.push(this._unsubscribeCart);
  }

  /**
   * Actualiza los atributos de accesibilidad en los botones de tema.
   * @private
   * @param {'light'|'dark'} theme
   */
  _actualizarEstadoTema(theme) {
    const isDark = theme === 'dark';
    const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    const title = isDark ? 'Modo Oscuro activado (clic para modo claro)' : 'Modo Claro activado (clic para modo oscuro)';

    this.queryAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', title);
      btn.setAttribute('aria-pressed', String(isDark));
    });
  }

  /**
   * Actualiza los badges de conteo del carrito en desktop y mobile.
   * @private
   * @param {number} count
   */
  _actualizarBadge(count) {
    const badges = this.queryAll('[data-cart-count-badge]');
    badges.forEach((badge) => {
      badge.textContent = count > 99 ? '99+' : String(count);
      if (count > 0) {
        badge.classList.remove('scale-0');
        badge.classList.add('scale-100');
        // Pequeño efecto pop
        badge.classList.add('animate-bounce');
        setTimeout(() => badge.classList.remove('animate-bounce'), 600);
      } else {
        badge.classList.remove('scale-100');
        badge.classList.add('scale-0');
      }
    });
  }

  destroy() {
    if (this._unsubscribeCart) {
      this._unsubscribeCart();
      this._unsubscribeCart = null;
    }
    if (this._unsubscribeTheme) {
      this._unsubscribeTheme();
      this._unsubscribeTheme = null;
    }
    super.destroy();
  }
}
