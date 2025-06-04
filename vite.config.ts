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
    // Use absolute paths for production to ensure assets are loaded correctly
    base: isProduction ? '/' : '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    // Ensure public directory is properly handled
    publicDir: 'public',
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true, // Disable sourcemaps in production for smaller build
      minify: isProduction ? 'esbuild' : false,
      // Ensure consistent file naming for better caching
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
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
      // Ensure CSS is properly extracted and named
      cssCodeSplit: true,
      // Don't clear the output directory to prevent race conditions
      emptyOutDir: !isProduction,
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