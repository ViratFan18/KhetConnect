export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0B0A0C',
        clay: '#1B1416',
        crimson: '#9E1B2E',
        ember: '#C2481B',
        ash: '#EDE6E3',
        'clay-grey': '#8A7B7D',
      },
      fontFamily: {
        display: ['General Sans', 'Inter', 'system-ui'],
        body: ['Inter', 'system-ui'],
        te: ['Noto Sans Telugu', 'Inter'],
        mono: ['JetBrains Mono', 'ui-monospace'],
      },
      borderRadius: {
        kc: '20px',
      },
    },
  },
  plugins: [],
}
