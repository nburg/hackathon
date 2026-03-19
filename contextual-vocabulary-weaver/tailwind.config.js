/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './entrypoints/**/*.{html,tsx,ts}',
    './components/**/*.{tsx,ts}',
    './src/**/*.{html,tsx,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#646cff',
        secondary: '#54bc4a',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
