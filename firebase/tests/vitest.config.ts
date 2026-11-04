import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The rule tests and the job tests share one emulator and each clears it between tests, so the files run one at a time.
// sync.test.ts runs the app's own sync code (app/src/sync), which imports with the app's "@/" alias.
export default defineConfig({
  test: { fileParallelism: false },
  resolve: { alias: { '@': fileURLToPath(new URL('../../app/src', import.meta.url)) } },
});
