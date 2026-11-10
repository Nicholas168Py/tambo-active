import { Component } from '../../core/Component.js';
import { whatsappButton } from '../../shared/components/WhatsAppButton.js';
import { enlaceWhatsAppInformacion } from '../../shared/utils/whatsapp.js';
import template from './cta.html?raw';
import './cta.css';

const CTA_CLASES =
  'self-start inline-flex items-center justify-center px-8 py-4 rounded-full text-black bg-white hover:bg-neutral-200 font-extrabold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 gap-2 shadow-lg shadow-white/10';

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

    cta.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-4 mb-12">
        <a href="#colores" class="${CTA_CLASES}">
          <span>Personalizar y Comprar</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewbox="0 0 24 24">
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
          </svg>
        </a>
        ${whatsappButton({
          text: '¿Dudas? WhatsApp',
          iconClass: 'w-5 h-5',
          classes:
            'inline-flex items-center justify-center px-6 py-4 rounded-full text-white border border-white/20 font-semibold text-sm hover:bg-white/10 transition-all duration-300 gap-2',
          href: enlaceWhatsAppInformacion()
        })}
      </div>
    `;
  }

  bindEvents() {
    this.observarImagenes();
  }

  initAnimations() {
    this.queryAll('[data-reveal]').forEach((el) => this.revelarElemento(el));
  }
}
