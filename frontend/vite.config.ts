import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import autoprefixer from "autoprefixer";
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  css: {
    postcss: {
      plugins: [
        autoprefixer
      ],
    },
  },
})
