import './shared/styles/tailwind.css';
import './shared/styles/variables.css';
import './shared/styles/base.css';
import './shared/styles/animations.css';

import { App } from './core/App.js';
import { themeManager } from './core/ThemeManager.js';

// Inicializar tema y registrar estado de JS
themeManager.init();
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  new App({ root: '#app' }).init();
});
