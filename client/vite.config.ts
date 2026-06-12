import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Servi sur un sous-chemin du domaine (ex. https://domaine/vinted-tracker/).
  // Sans ce `base`, les assets JS/CSS sont cherchés à la racine `/` → page blanche.
  base: '/vinted-tracker/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
  },
});
