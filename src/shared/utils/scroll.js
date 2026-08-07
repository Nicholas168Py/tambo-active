import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefiereMovimientoReducido } from './reduceMotion.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll suave con Lenis integrado al ticker de GSAP y a ScrollTrigger.
 * Se desactiva si el usuario prefiere movimiento reducido.
 * @returns {Lenis|null}
 */
export function initSmoothScroll() {
  if (prefiereMovimientoReducido()) return null;

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    autoRaf: false
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
