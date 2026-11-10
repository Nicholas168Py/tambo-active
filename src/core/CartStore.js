import { PRODUCTO_CONFIG } from '../data/product.js';

const STORAGE_KEY = 'tambo_active_cart_v1';

/**
 * CartStore: Gestión del estado global reactivo del carrito de compras.
 * Mantiene la persistencia en localStorage y emite notificaciones a los suscriptores.
 */
class CartStore {
  constructor() {
    this._items = this._loadFromStorage();
    this._isOpen = false;
    this._listeners = new Set();
  }

  /**
   * Carga los ítems guardados en localStorage.
   * @private
   */
  _loadFromStorage() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[CartStore] Error leyendo localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda los ítems actuales en localStorage.
   * @private
   */
  _saveToStorage() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items));
    } catch (e) {
      console.warn('[CartStore] Error guardando en localStorage:', e);
    }
  }

  /**
   * Notifica a todos los oyentes de cambios en el estado.
   * @private
   */
  _notify() {
    this._saveToStorage();
    const state = this.getState();
    this._listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[CartStore] Error en listener:', err);
      }
    });
  }

  /**
   * Obtiene una copia del estado actual.
   */
  getState() {
    return {
      items: [...this._items],
      cartCount: this.cartCount,
      cartTotal: this.cartTotal,
      isOpen: this._isOpen
    };
  }

  /**
   * Cantidad total de prendas en el carrito.
   */
  get cartCount() {
    return this._items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }

  /**
   * Cálculo acumulado del subtotal en COP.
   */
  get cartTotal() {
    return this._items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
  }

  /**
   * Verifica si el Drawer del carrito está abierto.
   */
  get isOpen() {
    return this._isOpen;
  }

  /**
   * Genera el ID compuesto único: variantId + logoId + size.
   * @param {string} colorId
   * @param {string} logoId
   * @param {string} size
   * @returns {string}
   */
  generateItemId(colorId, logoId, size) {
    const c = String(colorId || '').trim().toLowerCase().replace(/\s+/g, '-');
    const l = String(logoId || '').trim().toLowerCase().replace(/\s+/g, '-');
    const s = String(size || '').trim().toUpperCase();
    return `${c}-${l}-${s}`;
  }

  /**
   * Agrega un producto al carrito.
   * Si ya existe un ítem con las mismas características, incrementa su cantidad.
   * @param {object} item
   */
  addToCart(item) {
    const unitPrice = Number(item.unitPrice) || PRODUCTO_CONFIG.precioUnitario;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const colorId = item.colorId || item.color;
    const logoId = item.logoId || item.logo;
    const size = item.size || PRODUCTO_CONFIG.tallaDefault;
    const id = item.id || this.generateItemId(colorId, logoId, size);

    const existingIndex = this._items.findIndex((i) => i.id === id);

    const variantId = item.shopifyVariantId || item.variantId || item.merchandiseId || null;

    if (existingIndex > -1) {
      const existing = this._items[existingIndex];
      const newQty = existing.quantity + quantity;
      const finalVariantId = variantId || existing.shopifyVariantId || existing.variantId || existing.merchandiseId || null;
      this._items[existingIndex] = {
        ...existing,
        ...item,
        merchandiseId: finalVariantId,
        variantId: finalVariantId,
        shopifyVariantId: finalVariantId,
        quantity: newQty,
        totalPrice: newQty * (Number(item.unitPrice) || existing.unitPrice),
        attributes: item.attributes || existing.attributes || []
      };
    } else {
      const newItem = {
        ...item,
        id,
        name: item.name || PRODUCTO_CONFIG.nombre,
        color: item.color,
        colorId,
        colorHex: item.colorHex || '#111111',
        logo: item.logo,
        logoId,
        size,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        imagePreview: item.imagePreview || '/hero/camisa-hero.png',
        merchandiseId: variantId,
        variantId: variantId,
        shopifyVariantId: variantId,
        attributes: item.attributes || []
      };
      this._items.push(newItem);
    }

    this._notify();
  }

  /**
   * Modifica la cantidad de un ítem existente (si llega a 0, lo elimina).
   * @param {string} itemId
   * @param {number} newQuantity
   */
  updateQuantity(itemId, newQuantity) {
    const qty = Number(newQuantity);
    if (qty <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const index = this._items.findIndex((i) => i.id === itemId);
    if (index > -1) {
      const item = this._items[index];
      this._items[index] = {
        ...item,
        quantity: qty,
        totalPrice: qty * item.unitPrice
      };
      this._notify();
    }
  }

  /**
   * Elimina un ítem específico del carrito.
   * @param {string} itemId
   */
  removeFromCart(itemId) {
    this._items = this._items.filter((item) => item.id !== itemId);
    this._notify();
  }

  /**
   * Vacía el carrito por completo.
   */
  clearCart() {
    this._items = [];
    this._notify();
  }

  /**
   * Abre el Drawer del carrito.
   */
  openDrawer() {
    if (!this._isOpen) {
      this._isOpen = true;
      this._notify();
    }
  }

  /**
   * Cierra el Drawer del carrito.
   */
  closeDrawer() {
    if (this._isOpen) {
      this._isOpen = false;
      this._notify();
    }
  }

  /**
   * Alterna la visibilidad del Drawer del carrito.
   */
  toggleDrawer() {
    this._isOpen = !this._isOpen;
    this._notify();
  }

  /**
   * Suscribe una función para recibir actualizaciones del carrito.
   * @param {Function} listener
   * @returns {Function} Función para cancelar la suscripción.
   */
  subscribe(listener) {
    this._listeners.add(listener);
    // Ejecución inicial inmediata para sincronizar estado
    listener(this.getState());
    return () => this._listeners.delete(listener);
  }
}

/** Instancia única compartida del store del carrito */
export const cartStore = new CartStore();
