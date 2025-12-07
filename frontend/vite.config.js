import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    // __dirname は既に frontend ディレクトリなのでそのまま使う
    root: path.resolve(__dirname),
    plugins: [vue()],
    server: {
        port: 5174,
        proxy: {
            '/api': 'http://localhost:3000'
        }
    },
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true
    }
});