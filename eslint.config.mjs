
import baseConfig from 'eslint-config-vshift/configs/base.mjs';


export default [
  ...baseConfig,
  {
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'pnpm-lock.yaml',
    ],
  },
];

