// vitest.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
        exclude: [...configDefaults.exclude, 'archive/**'],
    },
    resolve: {
        tsconfigPaths: true,
    },
});