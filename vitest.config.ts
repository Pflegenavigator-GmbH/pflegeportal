// vitest.config.ts
import react from '@vitejs/plugin-react';
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        environment: 'jsdom',
        globals: false,
        setupFiles: './vitest.setup.ts',
        exclude: [...configDefaults.exclude, 'archive/**'],
    },
    resolve: {
        tsconfigPaths: true,
    },
});