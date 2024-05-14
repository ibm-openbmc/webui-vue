// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "file:///C:/Users/002LO2744/Desktop/openBMC/webui-vue-ghe/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/002LO2744/Desktop/openBMC/webui-vue-ghe/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import basicSsl from "file:///C:/Users/002LO2744/Desktop/openBMC/webui-vue-ghe/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
import Components from "file:///C:/Users/002LO2744/Desktop/openBMC/webui-vue-ghe/node_modules/unplugin-vue-components/dist/vite.js";
import { BootstrapVueNextResolver } from "file:///C:/Users/002LO2744/Desktop/openBMC/webui-vue-ghe/node_modules/unplugin-vue-components/dist/resolvers.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/002LO2744/Desktop/openBMC/webui-vue-ghe/vite.config.js";
var CWD = process.cwd();
var DEV_ENV_CONFIG = loadEnv("developement", CWD);
var {
  VITE_BASE_URL,
  VITE_CUSTOM_STYLES,
  VITE_APP_ENV_NAME,
  VITE_CUSTOM_ROUTER,
  VITE_CUSTOM_APP_NAV
} = loadEnv(DEV_ENV_CONFIG, CWD);
var envStyle = () => {
  const envName = VITE_APP_ENV_NAME;
  const hasCustomStyles = VITE_CUSTOM_STYLES == "true" ? true : false;
  if (hasCustomStyles && envName !== void 0) {
    return `
      @use "sass:math";
      @import "@/assets/styles/bmc/helpers";
      @import "@/env/assets/styles/_${envName}";
      @import "@/assets/styles/bootstrap/_helpers";
    `;
  } else {
    return `
      @use "sass:math";
      @import "@/assets/styles/bmc/helpers";
      @import "@/assets/styles/bootstrap/_helpers";
    `;
  }
};
var vite_config_default = defineConfig({
  // other configurations...
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver()]
    }),
    basicSsl()
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: envStyle(),
        includePaths: ["node_modules"]
      }
    }
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    ]
  },
  optimizeDeps: {
    exclude: ["bootstrap-vue-next"]
  },
  server: {
    https: true,
    // Enable HTTPS
    port: 8e3,
    // TCP Port 8000 is commonly used for development environments of web server software.
    proxy: {
      // Proxy settings if you need to proxy API requests
      "/api": {
        target: VITE_BASE_URL,
        changeOrigin: true,
        // Bypass SSL certificate validation (for development only)
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
        // Custom middleware to modify proxy response headers
        onProxyRes: (proxyRes) => {
          delete proxyRes.headers["strict-transport-security"];
        }
      }
    },
    // Custom middleware to add headers
    middlewares: [
      (req, res, next) => {
        res.setHeader("Connection", "keep-alive");
        next();
      }
    ]
  },
  build: {
    chunkSizeWarningLimit: 1e3,
    minify: true,
    rollupOptions: {
      external: ["bootstrap"],
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.toString().split("node_modules/")[1].split("/")[0].toString();
          }
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFwwMDJMTzI3NDRcXFxcRGVza3RvcFxcXFxvcGVuQk1DXFxcXHdlYnVpLXZ1ZS1naGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXDAwMkxPMjc0NFxcXFxEZXNrdG9wXFxcXG9wZW5CTUNcXFxcd2VidWktdnVlLWdoZVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvMDAyTE8yNzQ0L0Rlc2t0b3Avb3BlbkJNQy93ZWJ1aS12dWUtZ2hlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgYmFzaWNTc2wgZnJvbSAnQHZpdGVqcy9wbHVnaW4tYmFzaWMtc3NsJztcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnXG5pbXBvcnQge0Jvb3RzdHJhcFZ1ZU5leHRSZXNvbHZlcn0gZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvcmVzb2x2ZXJzJ1xuY29uc3QgQ1dEID0gcHJvY2Vzcy5jd2QoKTtcbmNvbnN0IERFVl9FTlZfQ09ORklHID0gbG9hZEVudignZGV2ZWxvcGVtZW50JywgQ1dEKTtcbmNvbnN0IHtcbiAgVklURV9CQVNFX1VSTCxcbiAgVklURV9DVVNUT01fU1RZTEVTLFxuICBWSVRFX0FQUF9FTlZfTkFNRSxcbiAgVklURV9DVVNUT01fUk9VVEVSLFxuICBWSVRFX0NVU1RPTV9BUFBfTkFWLFxufSA9IGxvYWRFbnYoREVWX0VOVl9DT05GSUcsIENXRCk7XG5jb25zdCBlbnZTdHlsZSA9ICgpID0+IHtcbiAgY29uc3QgZW52TmFtZSA9IFZJVEVfQVBQX0VOVl9OQU1FO1xuICBjb25zdCBoYXNDdXN0b21TdHlsZXMgPSBWSVRFX0NVU1RPTV9TVFlMRVMgPT0gJ3RydWUnID8gdHJ1ZSA6IGZhbHNlO1xuICBpZiAoaGFzQ3VzdG9tU3R5bGVzICYmIGVudk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIGVudiBuYW1lIGRlZmluZWQsIGltcG9ydCBTYXNzXG4gICAgLy8gb3ZlcnJpZGVzLlxuICAgIC8vIEl0IGlzIGltcG9ydGFudCB0aGF0IHRoZXNlIGltcG9ydHMgc3RheSBpbiB0aGlzXG4gICAgLy8gb3JkZXIgdG8gbWFrZSBzdXJlIGVudmlyb21lbnQgb3ZlcnJpZGVzXG4gICAgLy8gdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIGRlZmF1bHQgQk1DIHN0eWxlc1xuICAgIHJldHVybiBgXG4gICAgICBAdXNlIFwic2FzczptYXRoXCI7XG4gICAgICBAaW1wb3J0IFwiQC9hc3NldHMvc3R5bGVzL2JtYy9oZWxwZXJzXCI7XG4gICAgICBAaW1wb3J0IFwiQC9lbnYvYXNzZXRzL3N0eWxlcy9fJHtlbnZOYW1lfVwiO1xuICAgICAgQGltcG9ydCBcIkAvYXNzZXRzL3N0eWxlcy9ib290c3RyYXAvX2hlbHBlcnNcIjtcbiAgICBgO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgXG4gICAgICBAdXNlIFwic2FzczptYXRoXCI7XG4gICAgICBAaW1wb3J0IFwiQC9hc3NldHMvc3R5bGVzL2JtYy9oZWxwZXJzXCI7XG4gICAgICBAaW1wb3J0IFwiQC9hc3NldHMvc3R5bGVzL2Jvb3RzdHJhcC9faGVscGVyc1wiO1xuICAgIGA7XG4gIH1cbn07XG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAvLyBvdGhlciBjb25maWd1cmF0aW9ucy4uLlxuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgQ29tcG9uZW50cyh7XG4gICAgcmVzb2x2ZXJzOiBbQm9vdHN0cmFwVnVlTmV4dFJlc29sdmVyKCldLFxuICAgIH0pLFxuICAgIGJhc2ljU3NsKClcbiAgXSxcbiAgY3NzOiB7XG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xuICAgICAgc2Nzczoge1xuICAgICAgICBhZGRpdGlvbmFsRGF0YTogZW52U3R5bGUoKSxcbiAgICAgICAgaW5jbHVkZVBhdGhzOiBbJ25vZGVfbW9kdWxlcyddXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogW1xuICAgICAge1xuICAgICAgICBmaW5kOiAnQCcsIHJlcGxhY2VtZW50OiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSkgfSxcbiAgICBdLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2Jvb3RzdHJhcC12dWUtbmV4dCddLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBodHRwczogdHJ1ZSwgLy8gRW5hYmxlIEhUVFBTXG4gICAgcG9ydDogODAwMCwgLy8gVENQIFBvcnQgODAwMCBpcyBjb21tb25seSB1c2VkIGZvciBkZXZlbG9wbWVudCBlbnZpcm9ubWVudHMgb2Ygd2ViIHNlcnZlciBzb2Z0d2FyZS5cbiAgICBwcm94eToge1xuICAgICAgLy8gUHJveHkgc2V0dGluZ3MgaWYgeW91IG5lZWQgdG8gcHJveHkgQVBJIHJlcXVlc3RzXG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiBWSVRFX0JBU0VfVVJMLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIC8vIEJ5cGFzcyBTU0wgY2VydGlmaWNhdGUgdmFsaWRhdGlvbiAoZm9yIGRldmVsb3BtZW50IG9ubHkpXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksXG4gICAgICAgIC8vIEN1c3RvbSBtaWRkbGV3YXJlIHRvIG1vZGlmeSBwcm94eSByZXNwb25zZSBoZWFkZXJzXG4gICAgICAgIG9uUHJveHlSZXM6IChwcm94eVJlcykgPT4ge1xuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgJ3N0cmljdC10cmFuc3BvcnQtc2VjdXJpdHknIGhlYWRlclxuICAgICAgICAgIGRlbGV0ZSBwcm94eVJlcy5oZWFkZXJzWydzdHJpY3QtdHJhbnNwb3J0LXNlY3VyaXR5J107XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gQ3VzdG9tIG1pZGRsZXdhcmUgdG8gYWRkIGhlYWRlcnNcbiAgICBtaWRkbGV3YXJlczogW1xuICAgICAgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0Nvbm5lY3Rpb24nLCAna2VlcC1hbGl2ZScpO1xuICAgICAgICBuZXh0KCk7XG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIG1pbmlmeTogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogWydib290c3RyYXAnXSxcbiAgICAgIG91dHB1dDp7XG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpZC50b1N0cmluZygpLnNwbGl0KCdub2RlX21vZHVsZXMvJylbMV0uc3BsaXQoJy8nKVswXS50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIH0sXG4gIH0sXG59KTtcblxuXG5cblxuXG5cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFUsU0FBUyxl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
