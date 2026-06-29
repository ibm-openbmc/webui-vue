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
      // Performance optimizations
      globals: true,
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: false,
<<<<<<< HEAD
          isolate: true,
        },
      },
      // Isolate each test file's module registry to prevent vi.mock() leaking
      isolate: true,
=======
          isolate: false,
        },
      },
      // Faster test execution
      isolate: false,
>>>>>>> 22821125 (Added test coverage and improved test runtume)
      // Cache test results
      cache: {
        dir: 'node_modules/.vitest',
      },
      // Only watch changed files
      watchExclude: ['**/node_modules/**', '**/dist/**'],
      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'tests/',
          '**/*.spec.js',
          '**/*.spec.ts',
          '**/dist/**',
          '**/.husky/**',
          '**/docs/**',
          'vite.config.js',
          'vitest.config.js',
          '**/*.d.ts',
          '**/types/**',
        ],
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        all: true,
        include: ['src/**/*.{js,ts,vue}'],
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
