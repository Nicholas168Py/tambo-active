import { Navbar } from '../features/Navbar/navbar.js';
import { Hero } from '../features/Hero/hero.js';
import { Configurator } from '../features/Configurator/configurator.js';
import { Benefits } from '../features/Benefits/benefits.js';
import { Gallery } from '../features/Gallery/gallery.js';
import { Comparison } from '../features/Comparison/comparison.js';
import { Testimonials } from '../features/Testimonials/testimonials.js';
import { Cta } from '../features/CTA/cta.js';
import { Footer } from '../features/Footer/footer.js';

/**
 * MainLayout: composición de la página de inicio.
 * Un layout únicamente compone componentes reutilizables;
 * no contiene lógica de negocio propia.
 */
export class MainLayout {
  constructor() {
    this.children = [];
  }

  init() {
    this.children = [
      new Navbar().mountTo('#app').init(),
      new Hero().mountTo('#app').init(),
      new Configurator().mountTo('#app').init(),
      new Benefits().mountTo('#app').init(),
      new Gallery().mountTo('#app').init(),
      new Comparison().mountTo('#app').init(),
      new Testimonials().mountTo('#app').init(),
      new Cta().mountTo('#app').init(),
      new Footer().mountTo('#app').init()
    ];
    return this;
  }

  destroy() {
    this.children.forEach((child) => child.destroy());
    this.children = [];
  }
}
