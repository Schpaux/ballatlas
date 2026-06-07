/** @type {import('lint-staged').Config} */
const config = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,mjs,cjs}': ['prettier --write'],
  '*.{json,md,yaml,yml,css}': ['prettier --write'],
}

module.exports = config
