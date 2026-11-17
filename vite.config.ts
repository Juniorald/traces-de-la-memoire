import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:demo` produit un seul fichier HTML autonome (démo partageable).
export default defineConfig(({ mode }) => ({
  // Chemin relatif : fonctionne sur GitHub Pages (https://<compte>.github.io/<dépôt>/) sans configuration.
  base: './',
  plugins: [vue(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'demo' ? 'dist-demo' : 'dist' },
  server: { proxy: { '/api': 'http://localhost:3000' } },
}))
