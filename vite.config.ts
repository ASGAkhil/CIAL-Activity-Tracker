import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import process from node:process to ensure process.cwd() is correctly recognized by the TypeScript compiler in the Vite configuration context.
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Bridge the Vite env to the mandatory process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY)
    }
  };
});
