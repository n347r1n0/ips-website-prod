// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // "Очищаем" хост от лишних протоколов и слэшей, чтобы защитить HMR
  const rawHost = env.VITE_PUBLIC_HOST || 'localhost'
  const PUBLIC_HOST = rawHost.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  return {
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 5174,
      allowedHosts: [PUBLIC_HOST],
      origin: `https://${PUBLIC_HOST}`,
      hmr: {
        host: PUBLIC_HOST, // Теперь сюда передается "чистый" хост
        protocol: 'wss',
        clientPort: 443,
      },
    },
    preview: {
      allowedHosts: [PUBLIC_HOST],
    },
  }
})
