import { defineConfig } from 'vitest/config';

// The rule tests and the job tests share one emulator and each clears it between tests, so the files run one at a time.
export default defineConfig({
  test: { fileParallelism: false },
});
