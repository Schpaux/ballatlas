// @ts-check
const sharedConfig = require('@ballatlas/eslint-config')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...sharedConfig,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
]
