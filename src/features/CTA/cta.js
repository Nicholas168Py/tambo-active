import { Component } from '../../core/Component.js';
import { whatsappButton } from '../../shared/components/WhatsAppButton.js';
import { enlaceWhatsAppInformacion } from '../../shared/utils/whatsapp.js';
import template from './cta.html?raw';
import './cta.css';

const CTA_CLASES =
  'self-start mb-12 inline-flex items-center justify-center px-8 py-4 rounded-full text-brand-black bg-brand-green font-bold text-lg hover:bg-opacity-90 transition-all duration-300 gap-2 shadow-lg shadow-brand-green/20';

/**
 * CTA: sección final de llamada a la acción.
 * Su botón de WhatsApp enlaza al mensaje genérico de información.
 */
export class Cta extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();
    const cta = this.query('[data-cta-cta]');
    if (!cta) return;

    cta.innerHTML = whatsappButton({
      text: 'COMPRAR POR WHATSAPP',
      iconClass: 'w-6 h-6',
      classes: CTA_CLASES,
      href: enlaceWhatsAppInformacion()
    });
  }

  bindEvents() {
    this.observarImagenes();
  }

  initAnimations() {
    this.queryAll('[data-reveal]').forEach((el) => this.revelarElemento(el));
  }
}
