import { createRouter, eventHandler, fromNodeMiddleware, setHeaders } from 'h3'
import { genImport } from 'knitwork'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { joinURL } from 'ufo'
import { ViteDevServer, createServer as createViteServer } from 'vite'
import { pathGenerator } from '../../server/lib/pathGenerator'
import { HyperRoute, HyperRouteClientProps, HyperRouteServerProps, bootstrapHyperApp, defaultHyperconfig } from '../hyperApp'
import { runHyperApp } from '../serve'

export const runHyperDevServer = async () => {
  const vite = await createViteServer({
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
          main: path.resolve(__dirname, '../assets/index.html'),
        },
      },
    },
  })

  const routeParser = async (route: HyperRoute) => {
    if (!route.serverBundle || !route.clientBundle) {
      route.clientBundle = async () => (await vite.ssrLoadModule(route.filePath)) as HyperRouteClientProps
      route.serverBundle = async () => (await vite.ssrLoadModule(route.filePath)) as HyperRouteServerProps
    }
    return route
  }

  let config = defaultHyperconfig
  if (existsSync(joinURL(process.cwd(), 'hyper.config.js'))) config = await import(joinURL(process.cwd(), 'hyper.config.js'))

  const app = await bootstrapHyperApp(undefined, routeParser)

  app.h3.use(fromNodeMiddleware(vite.middlewares))

  const routerConfigure = () => {
    // remove all of the routes
    app.routes.remove('/')
    // add routes again
    const paths = pathGenerator(vite.watcher.getWatched())
    Object.keys(paths).forEach((route) => {
      app.routes.insert(route, {
        URL: route,
        filePath: paths[route],
        clientBundle: async () => (await vite.ssrLoadModule(paths[route])) as HyperRouteClientProps,
        serverBundle: async () => (await vite.ssrLoadModule(paths[route])) as HyperRouteServerProps,
      })
    })
  }

  // regenerate the routes on file change
  vite.watcher.on('ready', routerConfigure)
  vite.watcher.on('all', routerConfigure)

  const router = createRouter()

  router.add(
    '/_hyper/**',
    eventHandler((event) => {
      const filePath = event.path.replace('/_hyper', '')
      setHeaders(event, {
        'Content-Type': 'text/javascript',
      })
      return clientBundleGenerator(vite, filePath)
    })
  )
  app.h3.use(router)
  app.transformHTML = async (template, event) => {
    return vite.transformIndexHtml(event.path, template)
  }
  runHyperApp(app)
}

const clientBundleGenerator = async (vite: ViteDevServer, filePath: string) => {
  const code = (
    await vite.pluginContainer.transform(
      `
${genImport(filePath, [{ name: 'page', as: 'Page' }, 'loader'])}
${genImport('react-dom/client', 'ReactDOM')}
${genImport('hyper/page', ['PageProvider'])}

window.root = ReactDOM.hydrateRoot(document.getElementById("hyper-app"),
	<PageProvider>
		<Page />
	</PageProvider>
)
`,
      filePath
    )
  ).code
  return code
}