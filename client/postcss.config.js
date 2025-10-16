// client/postcss.config.js
// Tailwind v4 방식: PostCSS 플러그인은 '@tailwindcss/postcss' 사용
// CommonJS 형식(module.exports)이어야 함

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
