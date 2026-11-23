/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0E1815',
          soft: '#132420',
        },
        surface: {
          DEFAULT: '#16241F',
          raised: '#1C302A',
        },
        brass: {
          DEFAULT: '#C9A227',
          light: '#E4C765',
          dim: '#8A7326',
        },
        ivory: '#EDE6D6',
        muted: '#8FA39C',
        danger: '#C1554B',
        success: '#6FA287',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(237,230,214,0.035) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
}
