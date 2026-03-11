module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Chakra Petch', 'Noto Sans Thai', 'sans-serif'],
        body: ['Noto Sans Thai', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      colors: {
        cardinal: '#9f1d2b',
        brick: '#7f1622',
        parchment: '#f7f1ea',
        ink: '#21171b',
      },
      boxShadow: {
        panel: '0 20px 60px rgba(52, 13, 18, 0.18)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
