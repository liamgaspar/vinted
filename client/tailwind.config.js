/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        accent: '#0066FF',
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#0A0A0A',
        },
        muted: {
          DEFAULT: '#52525B', // Improved contrast (7:1 vs 4.5:1)
          dark: '#A1A1AA',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0 0 rgba(0,0,0,0.1)',
        'hard-dark': '4px 4px 0 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};
