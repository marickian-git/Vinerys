import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/sw.js', 'next-env.d.ts', 'scripts/generate-icons.mjs', 'playwright-report/**', 'test-results/**'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Designul actual folosește <img> + proxy propriu pentru imagini; next/image vine la restilizare
      '@next/next/no-img-element': 'off',
    },
  },
];

export default config;
