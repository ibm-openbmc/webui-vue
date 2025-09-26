import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import viteBaseConfig from './vite.config.js';
const viteConfig =
  typeof viteBaseConfig === 'function'
    ? viteBaseConfig({ mode: 'test' })
    : viteBaseConfig;
export default mergeConfig(
  await viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/*'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      transformMode: {
        web: [/\.[jt]sx$/],
      },
    },
    css: {
      postcss: null,
      preprocessorOptions: {
        scss: {
          additionalData: `
        @import "./src/assets/styles/bootstrap/_helpers.scss";
        @import './src/assets/styles/_obmc-custom.scss';
            `,
        },
      },
    },
  }),
);
