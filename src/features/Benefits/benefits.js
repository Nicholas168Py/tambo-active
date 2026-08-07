import { Component } from '../../core/Component.js';
import { sectionHeading } from '../../shared/components/SectionHeading.js';
import template from './benefits.html?raw';
import './benefits.css';

/**
 * Benefits: revelado escalonado de las tarjetas de
 * "Calidad que se siente" al entrar en el viewport.
 */
export class Benefits extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();
    const heading = this.query('[data-section-heading]');
    if (heading) {
      heading.innerHTML = sectionHeading({
        title: 'CALIDAD QUE SE SIENTE',
        wrapperClass: 'mb-12',
        h2Class: ''
      });
    }
  }

  initAnimations() {
    const heading = this.query('#calidad [data-reveal]');
    if (heading) this.revelarElemento(heading);

    const grid = this.query('#calidad .grid');
    if (grid) this.revelarGrupo(grid, '.calidad-item', { y: 28, stagger: 0.08 });
  }
}
