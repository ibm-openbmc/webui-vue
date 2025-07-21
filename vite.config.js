//Work Required
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import path, { resolve, dirname } from 'node:path';
import crypto from 'node:crypto';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';
import Components from 'unplugin-vue-components/vite';
import { BootstrapVueNextResolver } from 'unplugin-vue-components/resolvers';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import replace from '@rollup/plugin-replace';

const isDev = process.env.NODE_ENV === 'development';
const CWD = process.cwd();
const DEV_ENV_CONFIG = loadEnv('development', CWD);
const {
  VITE_BASE_URL,
  VITE_CUSTOM_STYLES,
  VITE_APP_ENV_NAME,
} = DEV_ENV_CONFIG;
  // Custom SCSS includes
  const envStyle = () => {
    const styles = [
      `@use "sass:math";`,
      `@import "@/assets/styles/bmc/helpers";`
    ];

    if (VITE_CUSTOM_STYLES === 'true' && VITE_APP_ENV_NAME) {
      styles.push(`@import "@/env/assets/styles/_${VITE_APP_ENV_NAME}";`);
    }

    styles.push(`@import "@/assets/styles/bootstrap/_helpers";`);

    return styles.join('\n');
  };

export default defineConfig({
  // other configurations...
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
      dts: false,
    }),
    basicSsl(),
    VueI18nPlugin({
      /* options */
      // locale messages resource pre-compile option
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        './path/to/src/locales/**'
      ),
    }),
    {
      name: 'custom-server-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const originalCreateHash = crypto.createHash;
          crypto.createHash = (algorithm) =>
            originalCreateHash(algorithm === 'md4' ? 'sha256' : algorithm);
          next();
        });
      },
    }
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: envStyle(),
        includePaths: ['node_modules'],
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      // { find: /^\.\/store$/, replacement: path.resolve(__dirname, `src/env/store/${VITE_APP_ENV_NAME}.js`) },
      // { find: /^\.\.\/store$/, replacement: path.resolve(__dirname, `src/env/store/${VITE_APP_ENV_NAME}.js`) },
      { find: /^\.\/routes$/, replacement: path.resolve(__dirname, `src/env/router/${VITE_APP_ENV_NAME}.js`) },
      { find: /^\.\/AppNavigationData$/, replacement: path.resolve(__dirname, `src/env/components/AppNavigation/${VITE_APP_ENV_NAME}.js`) },
    ],
  },
  optimizeDeps: {
    exclude: ['bootstrap'],
  },
  server: {
    https: true, // Enable HTTPS
    port: 8000, // TCP Port 8000 is commonly used for development environments of web server software.
    proxy: {
      // Proxy settings if you need to proxy API requests
      '/api': {
        target: VITE_BASE_URL,
        changeOrigin: true,
      // Bypass SSL certificate validation (for development only)
        secure: !isDev,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: isDev ? (proxy) => {
        // Custom middleware to modify proxy response headers
          proxy.on('proxyRes', (proxyRes) => {
            const setCookieHeader = proxyRes.headers['set-cookie'];
            if (setCookieHeader) {
              proxyRes.headers['set-cookie'] = setCookieHeader.map(
                (cookie) => cookie + '; Path=/'
              );
            }
            // Remove the 'strict-transport-security' header
            delete proxyRes.headers['strict-transport-security'];
          });
        } : undefined,
      },
    },
    // Custom middleware to add headers
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Connection', 'keep-alive');
        next();
      })
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: true,
    rollupOptions: {
      external: ['bootstrap'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.split('node_modules/')[1].split('/')[0];
          }
        },
      },
      plugins: [
        replace({
          include: ['src/store/api.js'],
          delimiters: ["'", "'"],
          preventAssignment: true,
          values: {
            '/api': ''
          },
        }),
      ],
    },
  },
});
