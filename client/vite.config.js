import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite" // Import loadEnv

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          // Use your env variable here, or fallback to localhost
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      }
    }
  }
})
