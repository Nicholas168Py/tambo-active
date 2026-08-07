/**
 * Helpers DOM. Los selectores se resuelven una sola vez y se cachean
 * por quien los consuma.
 */
export const $ = (selector, context = document) => context.querySelector(selector);

export const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
