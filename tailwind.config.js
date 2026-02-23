/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vin-primary': '#7B1FA2',
        'vin-secondary': '#D32F2F',
        'vin-accent': '#FFD700',
      },
    },
  },
  plugins: [],
}