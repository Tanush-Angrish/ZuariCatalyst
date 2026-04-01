import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`. The third param '' loads all variables.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [
      tailwindcss(),
      react()
    ],
    server: {
      host: true,   // Binds to 0.0.0.0 — accessible at http://<your-local-ip>:5173 on the same network
      port: 5173,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'icons': ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000 // Raise warning limit slightly for large vendor packages
    }
  }
})
