import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown hooks
  }
});
