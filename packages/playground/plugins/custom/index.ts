import { HyperApp } from 'hyper/dist/HyperApp/hyperApp'
import { resolve } from 'path'

export const install = (app: HyperApp) => {
  app.addPage({
    URL: '/custom-page',
    filePath: resolve(__dirname, './pages/custom.tsx'),
  })
}

export default {
  name: 'custom plugin',
  install,
}
