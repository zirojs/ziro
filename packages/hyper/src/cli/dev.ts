import chalk from 'chalk'
import { createApp, fromNodeMiddleware, toNodeListener } from 'h3'
import { listen } from 'listhen'
import path from 'path'
import sirv from 'sirv'
import { ViteDevServer, createServer as createViteServer } from 'vite'
import { DEV_ENV } from '../server/lib/constants'
import { setupFsRoutes } from '../server/router/fsRouteWatcher'

// we need to create a queue of loaders for a specific route
const hyperApp = {
  createPage: (options: any) => {
    // add the page to the routes
  },
  createMiddleware: (urlPattern: any, loader: any) => {
    // add the loader to the routes
  },
}

export const bootstrapHyperApp = async () => {
  const app = createApp()
  let vite: ViteDevServer | null = null

  if (process.env.NODE_ENV === DEV_ENV) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root: process.cwd(),
      configFile: false,
      clearScreen: false,
      build: {
        ssrEmitAssets: true,
        ssr: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'assets/index.html'),
          },
        },
      },
    })
    app.use(fromNodeMiddleware(vite.middlewares))
  }
  setupFsRoutes(vite, app)

  if (process.env.NODE_ENV !== DEV_ENV)
    app.use(
      fromNodeMiddleware(
        sirv(path.resolve(process.cwd(), '.hyper', 'client-bundles'), {
          gzip: true,
        })
      )
    )

  return { app, vite }
}

export const runServer = async () => {
  return bootstrapHyperApp().then(async ({ app, vite }) => {
    const listener = await listen(toNodeListener(app), { port: 3000, showURL: false, hostname: '0.0.0.0' })
    process.env.NODE_ENV !== DEV_ENV && console.clear()
    console.log(`${chalk.yellowBright.bold('⚡️ Hyper ')} ${chalk.green(process.env.NODE_ENV === DEV_ENV ? '[Development]' : '[Production]')}`)
    console.log()
    console.log(`Running on: ${chalk.green(listener.url)}`)
    return { listener, app, vite }
  })
}
