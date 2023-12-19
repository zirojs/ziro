import { resolve } from 'node:path'
import * as url from 'url'
import { HyperApp } from 'ziro/dist/HyperApp/hyperApp'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const install = (app: HyperApp) => {
  app.addPage({
    URL: '/custom-page',
    filePath: resolve(__dirname, './pages/custom.tsx'),
    clientBundle: () => import('./pages/custom.tsx'),
    serverBundle: () => import('./pages/custom.tsx'),
  })
}

export default {
  name: 'custom plugin',
  install,
}
