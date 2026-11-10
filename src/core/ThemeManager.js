/**
 * ThemeManager: Servicio singleton para la gestión reactiva del tema Claro/Oscuro.
 * - Modo por defecto: 'light'
 * - Persistencia: localStorage ('tambo_theme')
 * - Control en DOM: clase 'dark' / 'light' en <html> y atributo 'data-theme'
 * - Transición: clase temporal 'theme-transition' para animación suave de 300ms
 */

const STORAGE_KEY = 'tambo_theme';
const DEFAULT_THEME = 'light';

class ThemeManager {
  constructor() {
    this._listeners = new Set();
    this._theme = this._getStoredTheme();
    this._transitionTimeout = null;
  }

  /**
   * Obtiene la preferencia guardada en localStorage o devuelve el valor por defecto ('light').
   * @private
   * @returns {'light'|'dark'}
   */
  _getStoredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // Ignorar si localStorage está deshabilitado
    }
    return DEFAULT_THEME;
  }

  /**
   * Inicializa el tema en el documento.
   */
  init() {
    this.applyTheme(this._theme, false);
    return this;
  }

  get currentTheme() {
    return this._theme;
  }

  isDark() {
    return this._theme === 'dark';
  }

  isLight() {
    return this._theme === 'light';
  }

  /**
   * Alterna entre modo claro y oscuro.
   * @returns {'light'|'dark'}
   */
  toggleTheme() {
    const nextTheme = this._theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Establece un tema específico y lo persiste en localStorage.
   * @param {'light'|'dark'} theme
   */
  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    this._theme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignorar error de almacenamiento
    }

    this.applyTheme(theme, true);
    this._notifyListeners();
  }

  /**
   * Aplica las clases y atributos al elemento raíz del documento.
   * @param {'light'|'dark'} theme
   * @param {boolean} [withTransition=true]
   */
  applyTheme(theme, withTransition = true) {
    const root = document.documentElement;

    if (withTransition) {
      root.classList.add('theme-transition');
      if (this._transitionTimeout) clearTimeout(this._transitionTimeout);
      this._transitionTimeout = setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 350);
    }

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    root.setAttribute('data-theme', theme);
  }

  /**
   * Suscribe un callback a los cambios de tema.
   * @param {Function} callback
   * @returns {Function} Función para cancelar suscripción
   */
  subscribe(callback) {
    this._listeners.add(callback);
    callback(this._theme);
    return () => {
      this._listeners.delete(callback);
    };
  }

  _notifyListeners() {
    this._listeners.forEach((callback) => {
      try {
        callback(this._theme);
      } catch (err) {
        console.error('[ThemeManager] Error en callback:', err);
      }
    });
  }
}

export const themeManager = new ThemeManager();
