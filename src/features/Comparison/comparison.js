import { Component } from '../../core/Component.js';
import { sectionHeading } from '../../shared/components/SectionHeading.js';
import template from './comparison.html?raw';
import './comparison.css';

/**
 * Comparison: comparativa Tambo Active vs camisetas comunes.
 * Revela el titular y el grupo de tarjetas.
 */
export class Comparison extends Component {
  constructor() {
    super(template, { mount: '#app' });
  }

  render() {
    super.render();
    const heading = this.query('[data-section-heading]');
    if (heading) {
      heading.innerHTML = sectionHeading({
        title: '¿POR QUÉ ELEGIR TAMBO ACTIVE?',
        wrapperClass: 'mb-16',
        h2Class: ''
      });
    }
  }

  initAnimations() {
    const heading = this.query('[data-reveal]');
    if (heading) this.revelarElemento(heading);

    const grupo = this.query('[data-reveal-group]');
    if (grupo) this.revelarGrupo(grupo, '[data-reveal]');
  }
}
