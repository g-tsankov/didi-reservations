import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'public',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        admin: resolve(__dirname, 'public/admin/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src/js'),
    },
  },
  plugins: [
    vue(),
    {
      name: 'inject-style-css',
      enforce: 'post',
      transformIndexHtml() {
        return [{ tag: 'link', attrs: { rel: 'stylesheet', href: '/css/style.css' }, injectTo: 'head' }];
      },
    },
    {
      name: 'copy-static',
      closeBundle() {
        const headersSrc = resolve(__dirname, 'public/_headers');
        const headersDest = resolve(__dirname, 'dist/_headers');
        if (existsSync(headersSrc)) copyFileSync(headersSrc, headersDest);
        const cssSrc = resolve(__dirname, 'public/css/style.css');
        const cssDest = resolve(__dirname, 'dist/css/style.css');
        mkdirSync(resolve(__dirname, 'dist/css'), { recursive: true });
        copyFileSync(cssSrc, cssDest);
      },
    },
  ],
});
