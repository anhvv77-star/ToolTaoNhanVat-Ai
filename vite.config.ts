// FIX: Removed unused 'path' import and 'resolve' configuration.
// This resolves the TypeScript error "Cannot find type definition file for 'node'."
// The '@' alias defined in the original configuration was not being used in the project.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
  });
