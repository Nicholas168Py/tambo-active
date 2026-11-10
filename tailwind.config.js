import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0c0c0c',
          dark: '#141416',
          green: '#ffffff', // Mapeado a blanco para compatibilidad monocromática
          gray: '#f3f4f6',
          darkgray: '#222226'
        }
      }
    }
  },
  plugins: [forms, containerQueries]
};
