import { Component } from '../../core/Component.js';
import { whatsappButton, enlazarWhatsApp } from '../../shared/components/WhatsAppButton.js';
import { enlaceWhatsApp } from '../../shared/utils/whatsapp.js';
import { COLORES } from '../../data/colores.js';
import { LOGOS } from '../../data/logos.js';
import { COLOR_INICIAL, LOGO_INICIAL } from '../../data/site.js';
import { store } from '../../core/Store.js';
import template from './cta.html?raw';
import './cta.css';

const CTA_CLASES =
  'self-start mb-12 inline-flex items-center justify-center px-8 py-4 rounded-full text-brand-black bg-brand-green font-bold text-lg hover:bg-opacity-90 transition-all duration-300 gap-2 shadow-lg shadow-brand-green/20';

/**
 * CTA: sección final de llamada a la acción.
 * Su botón de WhatsApp se enlaza a la selección actual del
 * configurador (escucha los cambios del Store).
 */
export class Cta extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();
    const cta = this.query('[data-cta-cta]');
    if (!cta) return;

    const seleccion = store.get('seleccion') ?? { color: COLOR_INICIAL, logo: LOGO_INICIAL };
    cta.innerHTML = whatsappButton({
      text: 'COMPRAR POR WHATSAPP',
      iconClass: 'w-6 h-6',
      classes: CTA_CLASES,
      href: enlaceWhatsApp(seleccion.color, seleccion.logo, COLORES, LOGOS)
    });
  }

  bindEvents() {
    this.observarImagenes();

    const enlace = this.query('[data-cta-cta] a');
    if (enlace) this._disposers.push(enlazarWhatsApp(enlace));
  }

  initAnimations() {
    this.queryAll('[data-reveal]').forEach((el) => this.revelarElemento(el));
  }
}
