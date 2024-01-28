import consola from 'consola'
import { createRouter, eventHandler, fromNodeMiddleware, sendRedirect, setHeaders } from 'h3'
import { bootstrapZiroApp } from '..'
import { pathGenerator } from '../lib/pathGenerator'
import { ZiroRoute, ZiroRouteClientProps, ZiroRouteServerProps } from '../ziro-types'
import { getConfig, reloadConfig } from './dev/load-config'
import { getVite } from './dev/vite'
import { getCurrentWebServer, serveLocal } from './utils/serveLocal'

consola.wrapAll()

export const ziroDevServer = async () => {
  consola.info('Starting Ziro App')
  await runServer()
}

const runServer = async () => {
  const devApp = await configDevApp()
  await serveLocal(devApp)
}

export const onZiroConfigChanges = async () => {
  getCurrentWebServer().close()
  await reloadConfig()
  await runServer()
}

const configDevApp = async () => {
  const vite = await getVite()
  const routeParser = async (route: ZiroRoute) => {
    if (!route.serverBundle && route.filePath) {
      route.serverBundle = async () => (await vite.ssrLoadModule(route.filePath!)) as ZiroRouteServerProps
    }
    if (!route.clientBundle && route.filePath) {
      route.clientBundle = async () => (await vite.ssrLoadModule(route.filePath!)) as ZiroRouteClientProps
    }
    return route
  }

  const app = await bootstrapZiroApp(await getConfig(), routeParser)
  app.h3.use(fromNodeMiddleware(vite.middlewares))

  const routerConfigure = () => {
    // remove all of the routes
    app.routes.remove('/')
    // add routes again
    const paths = pathGenerator(vite.watcher.getWatched())
    Object.keys(paths).forEach((route) => {
      app.routes.insert(route, {
        isPluginRoute: false,
        URL: route,
        filePath: paths[route],
        clientBundle: async () => (await vite.ssrLoadModule(paths[route])) as ZiroRouteClientProps,
        serverBundle: async () => (await vite.ssrLoadModule(paths[route])) as ZiroRouteServerProps,
      })
    })
  }

  setTimeout(routerConfigure, 100)
  vite.watcher.on('all', routerConfigure)

  const router = createRouter()

  router.add(
    '/_ziro/**',
    eventHandler((event) => {
      const filePath = event.path.replace('/_ziro', '')
      if (/\.(js|mjs|jsx|ts|tsx)$/.test(filePath))
        setHeaders(event, {
          'Content-Type': 'text/javascript',
        })
      return sendRedirect(event, filePath)
    })
  )
  app.h3.use(router)
  app.transformHTML = async (template, event) => {
    return await vite.transformIndexHtml(event.path, template)
  }

  return app
}
