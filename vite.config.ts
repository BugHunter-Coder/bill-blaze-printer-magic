// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    // 1️⃣  Leave root “/” for Render (good for any CDN path)
    base: '/',

    /* ────────────────── PLUGINS ────────────────── */
    plugins: [
      react({ tsDecorators: true }),
      isDev && componentTagger(), // dev-only 👻
    ].filter(Boolean),

    /* ────────────────── RESOLVE ────────────────── */
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    /* ────────────────── GLOBALS ────────────────── */
    define: {
      __DEV__: isDev,
    },

    /* ────────────────── DEV SERVER ────────────────── */
    server: {
      host: true,            // listen on 0.0.0.0 so Docker/Render can reach it
      port: 5173,            // local dev port (whatever you like)
      strictPort: true,
      open: isDev,
    },

    /* ────────────────── PREVIEW (Render) ────────────────── */
    preview: {
      host: '0.0.0.0',
      port: process.env.PORT || 8080, // Render injects $PORT
    },

    /* ────────────────── BUILD ────────────────── */
    build: {
      outDir: 'dist',        // what Render will publish
      emptyOutDir: true,
      sourcemap: !isDev,     // get nice stack traces in prod
    },
  };
});
