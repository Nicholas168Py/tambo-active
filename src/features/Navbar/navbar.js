import { Component } from '../../core/Component.js';
import { whatsappButton } from '../../shared/components/WhatsAppButton.js';
import { enlaceWhatsAppInformacion } from '../../shared/utils/whatsapp.js';
import template from './navbar.html?raw';
import './navbar.css';

const CTA_CLASES_DESKTOP =
  'inline-flex items-center justify-center px-6 py-2.5 border border-white/30 rounded-full text-sm font-medium text-white hover:bg-white hover:text-brand-black transition-all duration-300 gap-2';
const CTA_CLASES_MOVIL =
  'inline-flex w-full items-center justify-center px-6 py-3 rounded-full border border-white/30 text-sm font-medium text-white hover:bg-white hover:text-brand-black transition-all duration-300 gap-2';

/**
 * Navbar: navegación fija con menú móvil.
 * Gestiona únicamente su propio comportamiento (toggle + cierre).
 */
export class Navbar extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();
    const ctaDesk = this.query('[data-cta-nav-desktop]');
    if (ctaDesk) {
      ctaDesk.innerHTML = whatsappButton({
        text: 'Comprar por WhatsApp',
        href: enlaceWhatsAppInformacion(),
        iconClass: 'w-5 h-5',
        classes: CTA_CLASES_DESKTOP
      });
    }
    const ctaMovil = this.query('[data-cta-nav-mobile]');
    if (ctaMovil) {
      ctaMovil.innerHTML = whatsappButton({
        text: 'Comprar por WhatsApp',
        href: enlaceWhatsAppInformacion(),
        iconClass: 'w-5 h-5',
        classes: CTA_CLASES_MOVIL
      });
    }
  }

  bindEvents() {
    const toggle = this.query('#menu-toggle');
    const menu = this.query('#menu-movil');
    if (!toggle || !menu) return;

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
}
