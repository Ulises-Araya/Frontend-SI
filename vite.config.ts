import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_DEV_SERVER_PORT || 5173),
      host: true,
      proxy: env.VITE_BACKEND_PROXY === 'true'
        ? {
            '/api': {
              target: env.VITE_BACKEND_URL || 'http://localhost:3000',
              changeOrigin: true,
            },
          }
        : undefined,
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  };
});
