import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    plugins: [
        viteSingleFile({
            removeViteModuleLoader: true,
        }),
    ],
    build: {
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_debugger: true,
            },
            format: {
                comments: false,
            },
        },
    },
});
