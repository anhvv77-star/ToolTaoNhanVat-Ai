import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // We no longer need to load env variables for the API key.
    // const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // The define block for API_KEY is removed.
      resolve: {
        alias: {
          // FIX: `__dirname` is not available in ES modules. Use `path.resolve('./')` to get the project root directory.
          '@': path.resolve('./'),
        }
      }
    };
});
