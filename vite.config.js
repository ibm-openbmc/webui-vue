import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import path, { resolve, dirname } from 'node:path';
import crypto from 'node:crypto';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';
import Components from 'unplugin-vue-components/vite';
import { BootstrapVueNextResolver } from 'unplugin-vue-components/resolvers';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const {
    VITE_BASE_URL,
    VITE_CUSTOM_STYLES,
    VITE_APP_ENV_NAME,
  } = env;
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

  return {
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
        {
          find: /^\.\/store$/,
          replacement: path.resolve(__dirname, `src/env/store/${VITE_APP_ENV_NAME}.js`)
        },
        {
          find: /^\.\.\/store$/,
          replacement: path.resolve(__dirname, `src/env/store/${VITE_APP_ENV_NAME}.js`)
        },
        {
          find: /^\.\/routes$/,
          replacement: path.resolve(__dirname, `src/env/router/${VITE_APP_ENV_NAME}.js`)
        },
        {
          find: /^\.\/AppNavigationData$/,
          replacement: path.resolve(__dirname, `src/env/components/AppNavigation/${VITE_APP_ENV_NAME}.js`)
        },
      ],
    },
    optimizeDeps: {
      exclude: ['bootstrap'],
    },
    server: {
    https: true, // Enable HTTPS
    port: 8000, // TCP Port 8000 is commonly used for development environments of web server software.
    proxy: {
        '/api': {
          target: VITE_BASE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
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
          },
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
      },
    },
  };
});
