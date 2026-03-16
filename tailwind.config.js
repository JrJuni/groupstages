/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fifa: {
          blue: '#003f7f',
          red: '#c0392b',
          gold: '#f0a500',
          dark: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          text: '#e6edf3',
          muted: '#8b949e',
        },
      },
      animation: {
        'ball-bounce': 'ballBounce 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-gold': 'pulseGold 1s ease-in-out infinite',
      },
      keyframes: {
        ballBounce: {
          '0%': { transform: 'translateY(-40px) scale(0.8)', opacity: '0' },
          '60%': { transform: 'translateY(5px) scale(1.05)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(240,165,0,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(240,165,0,0)' },
        },
      },
    },
  },
  plugins: [],
};
