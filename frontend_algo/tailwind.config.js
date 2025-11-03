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
        'reelty-primary': '#6366F1',
        'reelty-secondary': '#8B5CF6',
        'reelty-accent': '#EC4899',
        'reelty-dark': '#1F2937',
        'reelty-light': '#F9FAFB',
      },
    },
  },
  plugins: [],
}
