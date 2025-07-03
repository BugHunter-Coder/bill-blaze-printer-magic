import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    base: '/',                        // public path
    plugins: [
      react(),
      isDev && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {                         // local dev only
      host: true,
      port: 5173,
      strictPort: true,
      open: isDev,
    },
    preview: {                        // Render uses this in prod
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8080'),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: isDev,               // off in prod = quieter logs
      chunkSizeWarningLimit: 2500,
    },
  };
});
