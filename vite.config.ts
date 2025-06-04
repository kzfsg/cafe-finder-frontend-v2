import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    // Use empty base for production, which works with both root and subdirectory deployments
    base: isProduction ? '' : '/cafe-finder-frontend-v2',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true, // Disable sourcemaps in production for smaller build
      minify: isProduction ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor_react';
              }
              if (id.includes('@mantine')) {
                return 'vendor_mantine';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      historyApiFallback: true, // Important for SPA routing
    },
    preview: {
      port: 3000,
      open: true,
    },
  };
});