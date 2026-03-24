//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    // Exclude config files that are not included in tsconfig.json
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
