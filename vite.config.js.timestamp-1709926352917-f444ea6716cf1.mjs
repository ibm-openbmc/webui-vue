// vite.config.js
import { fileURLToPath, URL } from 'node:url';
import {
  defineConfig,
  loadEnv,
} from 'file:///C:/Users/002ZYT744/openBMC/upstream/webui-vue/node_modules/vite/dist/node/index.js';
import vue from 'file:///C:/Users/002ZYT744/openBMC/upstream/webui-vue/node_modules/@vitejs/plugin-vue/dist/index.mjs';
import basicSsl from 'file:///C:/Users/002ZYT744/openBMC/upstream/webui-vue/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs';
import Components from 'file:///C:/Users/002ZYT744/openBMC/upstream/webui-vue/node_modules/unplugin-vue-components/dist/vite.js';
import { BootstrapVueNextResolver } from 'file:///C:/Users/002ZYT744/openBMC/upstream/webui-vue/node_modules/unplugin-vue-components/dist/resolvers.js';
var __vite_injected_original_import_meta_url =
  'file:///C:/Users/002ZYT744/openBMC/upstream/webui-vue/vite.config.js';
var CWD = process.cwd();
var DEV_ENV_CONFIG = loadEnv('developement', CWD);
var {
  VITE_BASE_URL,
  VITE_CUSTOM_STYLES,
  VITE_APP_ENV_NAME,
  VITE_CUSTOM_ROUTER,
  VITE_CUSTOM_APP_NAV,
} = loadEnv(DEV_ENV_CONFIG, CWD);
var envStyle = () => {
  const envName = VITE_APP_ENV_NAME;
  const hasCustomStyles = VITE_CUSTOM_STYLES == 'true' ? true : false;
  if (hasCustomStyles && envName !== void 0) {
    return `
              @use "sass:math";
              @import "./src/assets/styles/bmc/helpers/_variables.scss";
              @import "./src/assets/styles/bmc/helpers/_colors.scss";
              @import "./src/assets/styles/bootstrap/_helpers.scss";
              @import "./src/assets/styles/bootstrap/_index.scss";
              @import './src/assets/styles/_obmc-custom.scss';
              @import "@/env/assets/styles/_${envName}.scss";
            `;
  } else {
    return `
        @use "sass:math";
        @import "./src/assets/styles/bmc/helpers/_variables.scss";
        @import "./src/assets/styles/bmc/helpers/_colors.scss";
        @import "./src/assets/styles/bootstrap/_helpers.scss";
        @import "./src/assets/styles/bootstrap/_index.scss";
        @import './src/assets/styles/_obmc-custom.scss';
        `;
  }
};
var vite_config_default = defineConfig({
  // other configurations...
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
    basicSsl(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: envStyle(),
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', __vite_injected_original_import_meta_url)),
      },
      {
        find: '@composables',
        replacement: fileURLToPath(
          new URL('./src/components/composables', __vite_injected_original_import_meta_url),
        ),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['bootstrap-vue-next'],
  },
  server: {
    https: true,
    // Enable HTTPS
    port: 8e3,
    // TCP Port 8000 is commonly used for development environments of web server software.
    proxy: {
      // Proxy settings if you need to proxy API requests
      '/api': {
        target: VITE_BASE_URL,
        changeOrigin: true,
        // Bypass SSL certificate validation (for development only)
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Custom middleware to modify proxy response headers
        onProxyRes: (proxyRes) => {
          delete proxyRes.headers['strict-transport-security'];
        },
      },
    },
    // Custom middleware to add headers
    middlewares: [
      (req, res, next) => {
        res.setHeader('Connection', 'keep-alive');
        next();
      },
    ],
  },
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFwwMDJaWVQ3NDRcXFxcb3BlbkJNQ1xcXFx1cHN0cmVhbVxcXFx3ZWJ1aS12dWVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXDAwMlpZVDc0NFxcXFxvcGVuQk1DXFxcXHVwc3RyZWFtXFxcXHdlYnVpLXZ1ZVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvMDAyWllUNzQ0L29wZW5CTUMvdXBzdHJlYW0vd2VidWktdnVlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgYmFzaWNTc2wgZnJvbSAnQHZpdGVqcy9wbHVnaW4tYmFzaWMtc3NsJztcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnO1xuaW1wb3J0IHtCb290c3RyYXBWdWVOZXh0UmVzb2x2ZXJ9IGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3Jlc29sdmVycyc7XG5cbmNvbnN0IENXRCA9IHByb2Nlc3MuY3dkKCk7XG5jb25zdCBERVZfRU5WX0NPTkZJRyA9IGxvYWRFbnYoJ2RldmVsb3BlbWVudCcsIENXRCk7XG5jb25zdCB7XG4gIFZJVEVfQkFTRV9VUkwsXG4gIFZJVEVfQ1VTVE9NX1NUWUxFUyxcbiAgVklURV9BUFBfRU5WX05BTUUsXG4gIFZJVEVfQ1VTVE9NX1JPVVRFUixcbiAgVklURV9DVVNUT01fQVBQX05BVixcbn0gPSBsb2FkRW52KERFVl9FTlZfQ09ORklHLCBDV0QpO1xuY29uc3QgZW52U3R5bGUgPSAoKSA9PiB7XG4gIGNvbnN0IGVudk5hbWUgPSBWSVRFX0FQUF9FTlZfTkFNRTtcbiAgY29uc3QgaGFzQ3VzdG9tU3R5bGVzID0gVklURV9DVVNUT01fU1RZTEVTID09ICd0cnVlJyA/IHRydWUgOiBmYWxzZTtcbiAgaWYgKGhhc0N1c3RvbVN0eWxlcyAmJiBlbnZOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBhbiBlbnYgbmFtZSBkZWZpbmVkLCBpbXBvcnQgU2Fzc1xuICAgIC8vIG92ZXJyaWRlcy5cbiAgICAvLyBJdCBpcyBpbXBvcnRhbnQgdGhhdCB0aGVzZSBpbXBvcnRzIHN0YXkgaW4gdGhpc1xuICAgIC8vIG9yZGVyIHRvIG1ha2Ugc3VyZSBlbnZpcm9tZW50IG92ZXJyaWRlc1xuICAgIC8vIHRha2UgcHJlY2VkZW5jZSBvdmVyIHRoZSBkZWZhdWx0IEJNQyBzdHlsZXNcbiAgICByZXR1cm4gYFxuICAgICAgICAgICAgICBAdXNlIFwic2FzczptYXRoXCI7XG4gICAgICAgICAgICAgIEBpbXBvcnQgXCIuL3NyYy9hc3NldHMvc3R5bGVzL2JtYy9oZWxwZXJzL192YXJpYWJsZXMuc2Nzc1wiO1xuICAgICAgICAgICAgICBAaW1wb3J0IFwiLi9zcmMvYXNzZXRzL3N0eWxlcy9ibWMvaGVscGVycy9fY29sb3JzLnNjc3NcIjtcbiAgICAgICAgICAgICAgQGltcG9ydCBcIi4vc3JjL2Fzc2V0cy9zdHlsZXMvYm9vdHN0cmFwL19oZWxwZXJzLnNjc3NcIjtcbiAgICAgICAgICAgICAgQGltcG9ydCBcIi4vc3JjL2Fzc2V0cy9zdHlsZXMvYm9vdHN0cmFwL19pbmRleC5zY3NzXCI7XG4gICAgICAgICAgICAgIEBpbXBvcnQgJy4vc3JjL2Fzc2V0cy9zdHlsZXMvX29ibWMtY3VzdG9tLnNjc3MnO1xuICAgICAgICAgICAgICBAaW1wb3J0IFwiQC9lbnYvYXNzZXRzL3N0eWxlcy9fJHtlbnZOYW1lfS5zY3NzXCI7XG4gICAgICAgICAgICBgO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgXG4gICAgICAgIEB1c2UgXCJzYXNzOm1hdGhcIjtcbiAgICAgICAgQGltcG9ydCBcIi4vc3JjL2Fzc2V0cy9zdHlsZXMvYm1jL2hlbHBlcnMvX3ZhcmlhYmxlcy5zY3NzXCI7XG4gICAgICAgIEBpbXBvcnQgXCIuL3NyYy9hc3NldHMvc3R5bGVzL2JtYy9oZWxwZXJzL19jb2xvcnMuc2Nzc1wiO1xuICAgICAgICBAaW1wb3J0IFwiLi9zcmMvYXNzZXRzL3N0eWxlcy9ib290c3RyYXAvX2hlbHBlcnMuc2Nzc1wiO1xuICAgICAgICBAaW1wb3J0IFwiLi9zcmMvYXNzZXRzL3N0eWxlcy9ib290c3RyYXAvX2luZGV4LnNjc3NcIjtcbiAgICAgICAgQGltcG9ydCAnLi9zcmMvYXNzZXRzL3N0eWxlcy9fb2JtYy1jdXN0b20uc2Nzcyc7XG4gICAgICAgIGA7XG4gIH1cbn07XG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAvLyBvdGhlciBjb25maWd1cmF0aW9ucy4uLlxuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksIFxuICAgIENvbXBvbmVudHMoe1xuICAgIHJlc29sdmVyczogW0Jvb3RzdHJhcFZ1ZU5leHRSZXNvbHZlcigpXSxcbiAgICB9KSwgXG4gICAgYmFzaWNTc2woKVxuICBdLFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzY3NzOiB7XG4gICAgICAgIGFkZGl0aW9uYWxEYXRhOiBlbnZTdHlsZSgpLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IFtcbiAgICAgIHtcbiAgICAgICAgZmluZDogJ0AnLCByZXBsYWNlbWVudDogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpIH0sXG4gICAgICB7IGZpbmQ6ICdAY29tcG9zYWJsZXMnLCByZXBsYWNlbWVudDogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9jb21wb25lbnRzL2NvbXBvc2FibGVzJywgaW1wb3J0Lm1ldGEudXJsKSkgfSwgICBcbiAgICBdLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2Jvb3RzdHJhcC12dWUtbmV4dCddLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBodHRwczogdHJ1ZSwgLy8gRW5hYmxlIEhUVFBTXG4gICAgcG9ydDogODAwMCwgLy8gVENQIFBvcnQgODAwMCBpcyBjb21tb25seSB1c2VkIGZvciBkZXZlbG9wbWVudCBlbnZpcm9ubWVudHMgb2Ygd2ViIHNlcnZlciBzb2Z0d2FyZS5cbiAgICBwcm94eToge1xuICAgICAgLy8gUHJveHkgc2V0dGluZ3MgaWYgeW91IG5lZWQgdG8gcHJveHkgQVBJIHJlcXVlc3RzXG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiBWSVRFX0JBU0VfVVJMLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIC8vIEJ5cGFzcyBTU0wgY2VydGlmaWNhdGUgdmFsaWRhdGlvbiAoZm9yIGRldmVsb3BtZW50IG9ubHkpXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksXG4gICAgICAgIC8vIEN1c3RvbSBtaWRkbGV3YXJlIHRvIG1vZGlmeSBwcm94eSByZXNwb25zZSBoZWFkZXJzXG4gICAgICAgIG9uUHJveHlSZXM6IChwcm94eVJlcykgPT4ge1xuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgJ3N0cmljdC10cmFuc3BvcnQtc2VjdXJpdHknIGhlYWRlclxuICAgICAgICAgIGRlbGV0ZSBwcm94eVJlcy5oZWFkZXJzWydzdHJpY3QtdHJhbnNwb3J0LXNlY3VyaXR5J107XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gQ3VzdG9tIG1pZGRsZXdhcmUgdG8gYWRkIGhlYWRlcnNcbiAgICBtaWRkbGV3YXJlczogW1xuICAgICAgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0Nvbm5lY3Rpb24nLCAna2VlcC1hbGl2ZScpO1xuICAgICAgICBuZXh0KCk7XG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVUsU0FBUyxlQUFlLFdBQVc7QUFDeFcsU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sY0FBYztBQUNyQixPQUFPLGdCQUFnQjtBQUN2QixTQUFRLGdDQUErQjtBQUxzSyxJQUFNLDJDQUEyQztBQU85UCxJQUFNLE1BQU0sUUFBUSxJQUFJO0FBQ3hCLElBQU0saUJBQWlCLFFBQVEsZ0JBQWdCLEdBQUc7QUFDbEQsSUFBTTtBQUFBLEVBQ0o7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0YsSUFBSSxRQUFRLGdCQUFnQixHQUFHO0FBQy9CLElBQU0sV0FBVyxNQUFNO0FBQ3JCLFFBQU0sVUFBVTtBQUNoQixRQUFNLGtCQUFrQixzQkFBc0IsU0FBUyxPQUFPO0FBQzlELE1BQUksbUJBQW1CLFlBQVksUUFBVztBQU01QyxXQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsOENBT21DLE9BQU87QUFBQTtBQUFBLEVBRW5ELE9BQU87QUFDTCxXQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFUO0FBQ0Y7QUFDQSxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBLEVBRTFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLFdBQVc7QUFBQSxNQUNYLFdBQVcsQ0FBQyx5QkFBeUIsQ0FBQztBQUFBLElBQ3RDLENBQUM7QUFBQSxJQUNELFNBQVM7QUFBQSxFQUNYO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUEsUUFDSixnQkFBZ0IsU0FBUztBQUFBLE1BQzNCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFBSyxhQUFhLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQUU7QUFBQSxNQUMzRSxFQUFFLE1BQU0sZ0JBQWdCLGFBQWEsY0FBYyxJQUFJLElBQUksZ0NBQWdDLHdDQUFlLENBQUMsRUFBRTtBQUFBLElBQy9HO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLG9CQUFvQjtBQUFBLEVBQ2hDO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxJQUNQLE1BQU07QUFBQTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsTUFFTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUE7QUFBQSxRQUVkLFFBQVE7QUFBQSxRQUNSLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxVQUFVLEVBQUU7QUFBQTtBQUFBLFFBRTVDLFlBQVksQ0FBQyxhQUFhO0FBRXhCLGlCQUFPLFNBQVMsUUFBUSwyQkFBMkI7QUFBQSxRQUNyRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLGFBQWE7QUFBQSxNQUNYLENBQUMsS0FBSyxLQUFLLFNBQVM7QUFDbEIsWUFBSSxVQUFVLGNBQWMsWUFBWTtBQUN4QyxhQUFLO0FBQUEsTUFDUDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
