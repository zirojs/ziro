import { HyperApp } from '@hyper-insights/hyper/dist/HyperApp/hyperApp'
import { setCookie } from 'h3'
import jwt from 'jsonwebtoken'

export const install = (app: HyperApp) => {
  app.addPage({
    URL: '/auth',
    clientBundle: async () => ({
      page: () => {
        return 'hi'
      },
    }),
    serverBundle: async () => ({
      action: async ({ username, password }, event) => {
        if (username === 'admin' && password === 'admin') {
          var token = jwt.sign({ username }, 'something')
          setCookie(event, 'auth', token)
          return { authorized: 'true', token }
        }
        return { error: true, message: 'invalid credentials' }
      },
      loader: async () => {
        return { hi: 'loader asdf' }
      },
    }),
    isFileBased: false,
  })
}

export default {
  name: 'custom plugin',
  install,
}
