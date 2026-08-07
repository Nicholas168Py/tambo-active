import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $$ } from './dom.js';
import { prefiereMovimientoReducido } from './reduceMotion.js';
import { REVEAL, REVEAL_GRUPO } from '../constants/index.js';

gsap.registerPlugin(ScrollTrigger);

const MOTION_OK = !prefiereMovimientoReducido();

/**
 * Fade-in de un elemento al entrar en el viewport.
 * Devuelve el tween para poder liberarlo en destroy().
 */
export function revelarElemento(el, { y = REVEAL.y, duration = REVEAL.duracion, delay = 0 } = {}) {
  if (!MOTION_OK || !el) return null;
  return gsap.to(el, {
    opacity: 1,
    y: 0,
    duration,
    delay,
    ease: REVEAL.ease,
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  });
}

/**
 * Fade-in escalonado de un grupo de elementos al entrar en el viewport.
 * Devuelve el tween para poder liberarlo en destroy().
 */
export function revelarGrupo(
  contenedor,
  selector,
  { y = REVEAL_GRUPO.y, duration = REVEAL_GRUPO.duracion, stagger = REVEAL_GRUPO.stagger } = {}
) {
  if (!contenedor) return null;
  const items = $$(selector, contenedor);
  if (!MOTION_OK || !items.length) return null;
  return gsap.to(items, {
    opacity: 1,
    y: 0,
    duration,
    stagger,
    ease: 'power2.out',
    scrollTrigger: { trigger: contenedor, start: 'top 85%', once: true }
  });
}
