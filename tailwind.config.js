/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        alpine: {
          950: '#020617', // Deepest midnight navy
          900: '#040b19', // Dark navy surface
          850: '#071228', // Elevated navy container
          800: '#0d1b38', // Navy border/card
          700: '#15274d', // Mid-tone navy
          600: '#1e3a6a', // Muted ice-blue slate
          500: '#2e5a9e', // Soft steel blue
          400: '#38bdf8', // Vibrant sky cyan
          300: '#7dd3fc', // Light ice cyan
          200: '#bae6fd', // Pale ice blue
          100: '#e0f2fe', // Glacial highlight
          50: '#f0f9ff',  // Frost white
        },
        cyan: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        glow: {
          cyan: '#00f0ff',
          blue: '#00a6ff',
          ice: '#70e1ff',
          electric: '#00e5ff',
          neon: '#00f0ff',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.5)',
        'glow-blue': '0 0 30px -5px rgba(0, 166, 255, 0.45)',
        'glow-lg': '0 0 50px -10px rgba(0, 240, 255, 0.35)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.8)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ice-gradient': 'linear-gradient(135deg, #00f0ff 0%, #00a6ff 50%, #0284c7 100%)',
        'neon-gradient': 'linear-gradient(135deg, #38bdf8 0%, #00f0ff 50%, #0284c7 100%)',
        'dark-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'neon-flicker': 'neonFlicker 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        neonFlicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
          '52%': { opacity: 0.95 },
          '54%': { opacity: 0.8 },
        }
      }
    },
  },
  plugins: [],
}
