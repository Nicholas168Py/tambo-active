import gsap from 'gsap';
import { Component } from '../../core/Component.js';
import { prefiereMovimientoReducido } from '../../shared/utils/reduceMotion.js';
import { renderIcons } from '../../shared/utils/icons.js';
import { PRODUCTO_CONFIG, formatearCOP } from '../../data/product.js';
import template from './hero.html?raw';
import './hero.css';

/**
 * Hero: entrada premium con escalonado suave de texto,
 * indicador de precio/envío, CTAs y camiseta.
 */
export class Hero extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();

    const priceEl = this.query('[data-hero-price]');
    if (priceEl) {
      priceEl.textContent = formatearCOP(PRODUCTO_CONFIG.precioUnitario);
    }

    renderIcons(this.root);
  }

  bindEvents() {
    const ctaPrincipal = this.query('[data-hero-cta-primary]');
    if (ctaPrincipal) {
      this.on(ctaPrincipal, 'click', (e) => {
        const destino = document.querySelector('#colores');
        if (destino) {
          e.preventDefault();
          destino.scrollIntoView({ behavior: 'smooth' });
        }
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
