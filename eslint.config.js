// @ts-check
const sharedConfig = require('@ballatlas/eslint-config')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...sharedConfig,
  {
    ignores: ['apps/**', 'packages/**/node_modules/**', 'packages/**/dist/**', 'node_modules/**'],
  },
]
