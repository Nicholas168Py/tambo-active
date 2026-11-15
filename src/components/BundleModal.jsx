import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ShoppingBag, Ruler, Check, RotateCcw, CheckCircle } from 'lucide-react';
import { obtenerCombinacionDuo } from '../data/comboDuoMap.js';

export const COMBO_DEFAULT = {
  id: 'combo-duo',
  titulo: 'COMBO DÚO',
  subtitulo: '2 Camisetas • 2 unidades',
  unidades: 2,
  precioActual: 69900,
  precioOriginal: 100000,
  descuento: '30% OFF',
  badge: 'MÁS POPULAR',
  garantia: 'Cambios de talla y devoluciones gratis en tu primera compra.'
};

export const COLORES_DISPONIBLES = [
  { id: 'negro', label: 'Negro', hex: '#18181B', border: false },
  { id: 'blanco', label: 'Blanco', hex: '#F4F4F5', border: true },
  { id: 'azul-oscuro', label: 'Azul Oscuro', hex: '#1E293B', border: false },
  { id: 'verde-militar', label: 'Verde Militar', hex: '#4B5320', border: false },
  { id: 'gris-claro', label: 'Gris Claro', hex: '#9CA3AF', border: false },
  { id: 'gris-oscuro', label: 'Gris Oscuro', hex: '#374151', border: false }
];

export const TALLAS_DISPONIBLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const formatearMoneda = (val) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);

/**
 * BundleModal: Modal de selección de combo optimizado:
 * - Margen superior libre para el botón de cierre (X).
 * - Bloqueo estricto del scroll de la página principal.
 * - Combo de 6 unidades simplificado sin configuración por camiseta.
 * - Centrado vertical automático para Combo Individual y Combo Dúo.
 */
export const BundleModal = ({
  isOpen = true,
  onClose,
  onAddToCart,
  product = COMBO_DEFAULT
}) => {
  const unidades = product.unidades || 2;
  const isCombo6 = unidades === 6;
  const isFewItems = unidades <= 2;

  // Estado de los slots
  const [slots, setSlots] = useState(() => {
    if (isCombo6) {
      return COLORES_DISPONIBLES.map((c, i) => ({
        index: i + 1,
        color: c.id,
        size: 'M'
      }));
    }
    const defaultColors = ['negro', 'blanco', 'azul-oscuro', 'verde-militar'];
    return Array.from({ length: unidades }, (_, i) => ({
      index: i + 1,
      color: defaultColors[i] || 'negro',
      size: i === 0 ? 'M' : 'L'
    }));
  });

  const [combo6GlobalSize, setCombo6GlobalSize] = useState('M');
  const [focusedSlotIndex, setFocusedSlotIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Manejo de tecla Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        if (showSizeGuide) setShowSizeGuide(false);
        else if (onClose) onClose();
      }
    },
    [onClose, showSizeGuide]
  );

  // 2. Bloquear scroll general mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);

    // Bloquear scroll en body y html
    const prevOverflowBody = document.body.style.overflow;
    const prevOverflowHtml = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Detener Lenis si existe globalmente
    if (typeof window !== 'undefined' && window.__lenis) {
      window.__lenis.stop();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflowBody;
      document.documentElement.style.overflow = prevOverflowHtml;
      document.body.style.touchAction = prevTouchAction;

      if (typeof window !== 'undefined' && window.__lenis) {
        window.__lenis.start();
      }
    };
  }, [isOpen, handleKeyDown]);

  const isComplete = useMemo(() => {
    return slots.every((s) => Boolean(s.color && s.size));
  }, [slots]);

  const ctaMessage = useMemo(() => {
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].color || !slots[i].size) {
        return `Configura color y talla de la Camiseta ${i + 1}`;
      }
    }
    return `Agregar Combo al Carrito • ${formatearMoneda(product.precioActual)} COP`;
  }, [slots, product.precioActual]);

  const activeSlot = slots[focusedSlotIndex] || slots[0];
  const activeColorObj = useMemo(() => {
    return COLORES_DISPONIBLES.find((c) => c.id === activeSlot?.color) || COLORES_DISPONIBLES[0];
  }, [activeSlot]);

  // Combinación de imágenes para Combo Dúo (archivos en ./camisetas/{N}.webp)
  const comboDuoInfo = useMemo(() => {
    if (unidades === 2 && slots.length >= 2) {
      return obtenerCombinacionDuo(slots[0].color, slots[1].color);
    }
    return null;
  }, [unidades, slots]);

  const handleColorChange = (slotIndex, colorId) => {
    setSlots((prev) => {
      const copy = [...prev];
      copy[slotIndex] = { ...copy[slotIndex], color: colorId };
      return copy;
    });
    setFocusedSlotIndex(slotIndex);
  };

  const handleSizeChange = (slotIndex, sizeVal) => {
    setSlots((prev) => {
      const copy = [...prev];
      copy[slotIndex] = { ...copy[slotIndex], size: sizeVal };
      return copy;
    });
    setFocusedSlotIndex(slotIndex);
  };

  const handleApplyCombo6GlobalSize = (sizeVal) => {
    setCombo6GlobalSize(sizeVal);
    setSlots((prev) => prev.map((s) => ({ ...s, size: sizeVal })));
  };

  const handleSubmit = () => {
    if (!isComplete) return;

    onAddToCart?.({
      productId: product.id,
      title: product.titulo,
      price: product.precioActual,
      items: slots.map((s) => ({
        index: s.index,
        name: `Camiseta ${s.index}`,
        colorId: s.color,
        colorLabel: COLORES_DISPONIBLES.find((c) => c.id === s.color)?.label,
        size: s.size
      }))
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overscroll-contain transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative border border-neutral-100 max-h-[90vh] flex flex-col md:flex-row my-auto">
        
        {/* 1. Botón de Cierre con margen superior dedicado */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 p-2.5 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white/80 backdrop-blur-xs shadow-xs"
        >
          <X className="w-5 h-5 stroke-neutral-700 hover:stroke-neutral-950" />
        </button>

        {/* ========================================================
            COLUMNA IZQUIERDA (~42%): Visual, Precios y Confianza
           ======================================================== */}
        <div className="w-full md:w-[42%] bg-neutral-50 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-200">
          <div>
            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-neutral-200 text-neutral-800 border border-neutral-300 mb-3">
              {product.badge}
            </span>

            <h2 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">
              {product.titulo}
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {product.subtitulo} • {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
            </p>

            <div className="mt-4 flex items-center flex-wrap gap-2.5">
              <span className="text-2xl font-extrabold text-neutral-900">
                {formatearMoneda(product.precioActual)} COP
              </span>
              <span className="text-sm text-neutral-400 line-through font-medium">
                {formatearMoneda(product.precioOriginal)} COP
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {product.descuento}
              </span>
            </div>

            {/* Preview de Imagen Dinámico */}
            <div className="aspect-square bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex flex-col items-center justify-center relative overflow-hidden my-5 group">
              <img
                src={comboDuoInfo ? comboDuoInfo.ruta : (product.imagen || '/hero/camisa-hero.png')}
                alt={activeColorObj.label}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width={400}
                height={400}
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-sm">
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/40 flex-shrink-0"
                    style={{ backgroundColor: activeColorObj.hex }}
                  />
                  <span>
                    {comboDuoInfo ? (
                      <>
                        Dúo <strong>#{comboDuoInfo.numero}</strong>:{' '}
                        {COLORES_DISPONIBLES.find((c) => c.id === slots[0].color)?.label} +{' '}
                        {COLORES_DISPONIBLES.find((c) => c.id === slots[1].color)?.label}
                      </>
                    ) : (
                      <>
                        Prenda {activeSlot.index}: <strong>{activeColorObj.label}</strong>
                      </>
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200/80 flex items-start gap-2.5 text-xs text-neutral-600 leading-relaxed">
            <RotateCcw className="w-4 h-4 text-neutral-800 flex-shrink-0 mt-0.5" />
            <span>{product.garantia}</span>
          </div>
        </div>

        {/* ========================================================
            COLUMNA DERECHA (~58%): Área con Scroll Interno Exclusivo
            - pt-12 md:pt-14: Margen superior libre para la 'X' de cerrar
            - Si es Combo Individual o Dúo: centrado vertical con my-auto
           ======================================================== */}
        <div
          className="w-full md:w-[58%] p-6 md:p-8 pt-12 md:pt-14 flex-1 flex flex-col justify-between overflow-y-auto max-h-[calc(90vh-1rem)] space-y-6"
          data-lenis-prevent
        >
          {/* 4. Contenedor de configuración: centrado verticalmente si son 1 o 2 prendas */}
          <div className={`space-y-5 ${isFewItems ? 'my-auto py-2' : ''}`}>
            
            {/* 3. En combo de 6 unidades: se quita la configuración por camiseta */}
            {isCombo6 ? (
              <div className="space-y-4">
                {/* Banner de Colección Completa */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Colección Completa Oficial (6 Colores)</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Este pack incluye automáticamente <strong>1 camiseta de cada uno de los 6 colores oficiales</strong>.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                    {COLORES_DISPONIBLES.map((c, i) => (
                      <div
                        key={c.id}
                        onClick={() => setFocusedSlotIndex(i)}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl bg-white border border-neutral-200 text-center cursor-pointer hover:border-neutral-400 transition-all ${
                          focusedSlotIndex === i ? 'ring-2 ring-neutral-900' : ''
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-neutral-300 shadow-xs flex-shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[10px] font-bold text-neutral-800 truncate w-full">
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opción rápida: misma talla para todas */}
                <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Aplicar misma talla a las 6 camisetas:
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold">
                      Talla: {combo6GlobalSize}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {TALLAS_DISPONIBLES.map((t) => (
                      <button
                        key={`global-${t}`}
                        type="button"
                        onClick={() => handleApplyCombo6GlobalSize(t)}
                        className={`py-2 text-xs font-bold rounded-xl text-center transition-all ${
                          t === combo6GlobalSize
                            ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-sm'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distribución compacta por color */}
                <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                  <span className="text-xs font-bold text-neutral-700 block mb-1">
                    O personaliza la talla de cada color:
                  </span>
                  <div className="space-y-1.5">
                    {slots.map((slot, idx) => {
                      const colorObj =
                        COLORES_DISPONIBLES.find((c) => c.id === slot.color) ||
                        COLORES_DISPONIBLES[idx];
                      return (
                        <div
                          key={`combo6-slot-${idx}`}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-neutral-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-4 h-4 rounded-full border border-neutral-300 flex-shrink-0"
                              style={{ backgroundColor: colorObj.hex }}
                            />
                            <span className="font-bold text-neutral-800 truncate">
                              {colorObj.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {TALLAS_DISPONIBLES.map((t) => (
                              <button
                                key={`combo6-${idx}-${t}`}
                                type="button"
                                onClick={() => handleSizeChange(idx, t)}
                                className={`w-7 h-7 text-[11px] font-semibold rounded-lg text-center transition-all flex items-center justify-center ${
                                  slot.size === t
                                    ? 'bg-neutral-900 text-white font-bold'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Slots independientes para Combo Individual (1), Dúo (2) o Trío (3) */
              slots.map((slot, idx) => {
                const isFocused = focusedSlotIndex === idx;
                const colorObj =
                  COLORES_DISPONIBLES.find((c) => c.id === slot.color) ||
                  COLORES_DISPONIBLES[0];

                return (
                  <React.Fragment key={`slot-block-${idx}`}>
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        isFocused
                          ? 'border-neutral-900/20 bg-neutral-50/50 shadow-xs'
                          : 'border-neutral-100 bg-white'
                      }`}
                      onClick={() => setFocusedSlotIndex(idx)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center font-black">
                            {slot.index}
                          </span>
                          <span>
                            {slot.index === 1
                              ? 'Elige talla y color de tu prenda'
                              : slot.index === 2
                              ? 'Elige talla y color de tu segunda prenda'
                              : `Elige talla y color de tu prenda #${slot.index}`}
                          </span>
                        </h3>
                        <span className="text-xs font-medium text-neutral-500">
                          Color:{' '}
                          <strong className="text-neutral-900 capitalize">
                            {colorObj.label}
                          </strong>
                        </span>
                      </div>

                      {/* Swatches de Color */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {COLORES_DISPONIBLES.map((c) => {
                          const isSelected = slot.color === c.id;
                          return (
                            <button
                              key={`slot-${idx}-${c.id}`}
                              type="button"
                              title={c.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleColorChange(idx, c.id);
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                c.border ? 'border border-neutral-300' : ''
                              } ${
                                isSelected
                                  ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110 shadow-sm'
                                  : 'hover:scale-105 opacity-85 hover:opacity-100 ring-1 ring-black/5'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              aria-label={`Seleccionar color ${c.label} para camiseta ${slot.index}`}
                            >
                              {isSelected && (
                                <Check
                                  className={`w-3.5 h-3.5 ${
                                    c.id === 'blanco' || c.id === 'gris-claro'
                                      ? 'text-neutral-950'
                                      : 'text-white'
                                  }`}
                                  strokeWidth={3}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Chips de Talla */}
                      <div className="mt-3.5">
                        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5 font-medium">
                          <span>Talla Camiseta {slot.index}</span>
                          <span className="text-neutral-900 font-bold">
                            Seleccionada: {slot.size}
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {TALLAS_DISPONIBLES.map((t) => {
                            const isSelected = slot.size === t;
                            return (
                              <button
                                key={`slot-${idx}-size-${t}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSizeChange(idx, t);
                                }}
                                className={`py-2 text-xs font-semibold rounded-xl text-center transition-all ${
                                  isSelected
                                    ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-sm font-bold'
                                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {idx < slots.length - 1 && <div className="border-t border-neutral-100" />}
                  </React.Fragment>
                );
              })
            )}

          </div>

          {/* Guía de Tallas */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowSizeGuide(!showSizeGuide)}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 underline font-medium transition-colors"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Guía de tallas y medidas</span>
            </button>
          </div>

          {showSizeGuide && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-700 space-y-2">
              <div className="font-bold text-neutral-900 flex justify-between items-center">
                <span>Medidas en cm (Pecho / Largo)</span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="text-neutral-400 hover:text-neutral-900"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1 text-center font-mono text-[11px]">
                <div><span className="font-bold block">XS</span>50/68</div>
                <div><span className="font-bold block">S</span>52/70</div>
                <div><span className="font-bold block">M</span>55/72</div>
                <div><span className="font-bold block">L</span>58/74</div>
                <div><span className="font-bold block">XL</span>61/76</div>
                <div><span className="font-bold block">XXL</span>64/78</div>
              </div>
            </div>
          )}

          {/* Footer de Acción (CTA) */}
          <div className="pt-4 border-t border-neutral-100">
            <button
              type="button"
              disabled={!isComplete}
              onClick={handleSubmit}
              className={`w-full py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${
                isComplete
                  ? 'bg-neutral-900 hover:bg-black text-white shadow-lg shadow-neutral-900/10 cursor-pointer active:scale-[0.99]'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{ctaMessage}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BundleModal;
