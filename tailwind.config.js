/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['Jost', 'sans-serif'],
      },
      colors: {
        gold: { DEFAULT: '#c9a96e', light: '#e8d5a3', dark: '#9b7940' },
        rose: '#c4847a',
        sage: '#8a9e8c',
      },
      animation: {
        'slide-up': 'slideUp 0.6s cubic-bezier(0.4,0,0.2,1) both',
        'fade-in': 'fadeIn 0.5s ease both',
        marquee: 'marquee 25s linear infinite',
        shimmer: 'shimmer 1.8s infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        slideUp: { from: { opacity: '0', transform: 'translateY(32px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}
