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
      // Proxy removed as requested
    }
  }
})
