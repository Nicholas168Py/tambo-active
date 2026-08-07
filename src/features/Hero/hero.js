import gsap from 'gsap';
import { Component } from '../../core/Component.js';
import { prefiereMovimientoReducido } from '../../shared/utils/reduceMotion.js';
import { whatsappButton } from '../../shared/components/WhatsAppButton.js';
import { enlaceWhatsAppInformacion } from '../../shared/utils/whatsapp.js';
import template from './hero.html?raw';
import './hero.css';

const CTA_CLASES =
  'inline-flex items-center justify-center px-8 py-4 rounded-full text-brand-black bg-brand-green font-bold text-lg hover:bg-opacity-90 transition-all duration-300 gap-2 shadow-lg shadow-brand-green/20';

/**
 * Hero: entrada premium con escalonado suave de texto,
 * CTAs y camiseta. Solo anima si el usuario permite movimiento.
 */
export class Hero extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();
    const cta = this.query('[data-cta-hero]');
    if (cta) {
      cta.innerHTML = whatsappButton({
        text: 'COMPRAR POR WHATSAPP',
        href: enlaceWhatsAppInformacion(),
        iconClass: 'w-6 h-6',
        classes: CTA_CLASES
      });
    }
  }

  initAnimations() {
    if (prefiereMovimientoReducido()) return;

    const elementos = this.queryAll('[data-hero]');
    if (!elementos.length) return;

    const tween = gsap.fromTo(
      elementos,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.09 }
    );
    this._tweens.push(tween);
  }
}
