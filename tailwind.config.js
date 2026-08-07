import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0c0c0c',
          dark: '#1a1a1a',
          green: '#9eb477',
          gray: '#f3f4f6',
          darkgray: '#2d2d2d'
        }
      }
    }
  },
  plugins: [forms, containerQueries]
};
