import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'url'
import { ViteDevServer, createServer } from 'vite'
import { ziro } from './vite-plugins/ziro'

let vite: null | ViteDevServer = null
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const getVite = async () => {
  if (vite === null)
    vite = await createServer({
      server: { middlewareMode: true, hmr: true },
      appType: 'custom',
      root: process.cwd(),
      configFile: false,
      clearScreen: false,
      plugins: [ziro(), react()],
      build: {
        ssrEmitAssets: true,
        ssr: true,
        rollupOptions: {
          input: {
            main: resolve(__dirname, '../assets/index.html'),
          },
        },
      },
    })
  return vite
}
