import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';

const CWD = process.cwd();
const DEV_ENV_CONFIG = loadEnv('developement', CWD);
const { BASE_URL } = loadEnv(DEV_ENV_CONFIG, CWD);
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), basicSsl()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    https: true, // Enable HTTPS
    port: 8000, // TCP Port 8000 is commonly used for development environments of web server software.
    proxy: {
      // Proxy settings if you need to proxy API requests
      '/api': {
        target: BASE_URL,
        changeOrigin: true,
        // Bypass SSL certificate validation (for development only)
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Custom middleware to modify proxy response headers
        onProxyRes: (proxyRes) => {
          // Remove the 'strict-transport-security' header
          delete proxyRes.headers['strict-transport-security'];
        },
      },
    },
  },
});
