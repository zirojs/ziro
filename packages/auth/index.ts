import path from 'node:path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { ZiroApp } from 'ziro'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DEFAULT_AUTH_COOKIE_NAME = 'Ziro_AUTH_TOKEN'

export type ZiroAuthUser = any
export type ZiroAuthOptions = {
  authenticate: (username: string, password: string) => Promise<ZiroAuthUser>
  secredKey: string
  cookieName?: string
}

export default () => {
  return {
    name: 'ziro-plugin-auth',
    install: async (app: ZiroApp) => {
      app.addPage({
        URL: '/auth',
        filePath: path.resolve(__dirname, './pages/auth/index'),
      })
    },
  }
}
