import chalk from 'chalk'
import { createApp, fromNodeMiddleware, toNodeListener } from 'h3'
import { listen } from 'listhen'
import path from 'path'
import sirv from 'sirv'
import { ViteDevServer, createServer as createViteServer } from 'vite'
import { setupFsRoutes } from '../server/router/fsRouteWatcher'

export const DEV_ENV = 'development'

const bootstrap = async () => {
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
  return bootstrap().then(async ({ app, vite }) => {
    const listener = await listen(toNodeListener(app), { port: 3000, showURL: false, hostname: '0.0.0.0' })
    // console.clear()
    console.log(`${chalk.yellowBright.bold('⚡️ Hyper ')} ${chalk.green('[Development]')}`)
    console.log()
    console.log(`Running on: ${chalk.green(listener.url)}`)
    return { listener, app, vite }
  })
}
