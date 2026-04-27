import type { Config } from 'jest';

const config: Config = {
  rootDir: '../..',
  maxWorkers: 1,
  testTimeout: 120000,
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.ts'],
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: '<rootDir>/tests/e2e/globalSetup.ts',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};

export default config;
