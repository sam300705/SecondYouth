/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        "background-pan": {
          '0%': { backgroundPosition: '0% 25%' },
          '50%': { backgroundPosition: '100% 75%' },
          '100%': { backgroundPosition: '0% 25%' },
        },
        "scan-line": {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        "heartbeat": {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' }, // red-500
          '70%': { transform: 'scale(1.02)', boxShadow: '0 0 20px 10px rgba(239, 68, 68, 0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        },
      },
      animation: {
        "background-pan": "background-pan 20s ease-in-out infinite",
        "scan-line": "scan-line 2s ease-in-out forwards",
        "heartbeat": "heartbeat 2s ease-in-out infinite",
      },
      boxShadow: {
        'glow-indigo': '0 0 20px 5px rgba(99, 102, 241, 0.5)',
      },
    },
  },
  plugins: [],
}
