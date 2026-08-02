// vitest.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
        // `e2e/**` gehört Playwright. Ohne den Ausschluss zieht Vitest die
        // *.spec.ts-Dateien dort mit ein (beide Werkzeuge nutzen dasselbe
        // Namensmuster) und scheitert am Playwright-Import.
        exclude: [...configDefaults.exclude, 'archive/**', 'e2e/**'],
    },
    resolve: {
        tsconfigPaths: true,
    },
});