/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // packages/kitted-core has its own Vitest suite (npm test --workspace @kitted/core).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/packages/'],
};
