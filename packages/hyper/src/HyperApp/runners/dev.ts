import consola from 'consola'
import { createRouter, eventHandler, fromNodeMiddleware, setHeaders } from 'h3'
import { genImport } from 'knitwork'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { dirname } from 'path'
import { joinURL } from 'ufo'
import { fileURLToPath } from 'url'
import { ModuleNode, ViteDevServer, createServer as createViteServer } from 'vite'
import { HyperConfig, HyperRoute, HyperRouteClientProps, HyperRouteServerProps, bootstrapHyperApp, defaultHyperconfig } from '../hyperApp'
import { pathGenerator } from '../lib/pathGenerator'
import { serveLocal } from './utils/serveLocal'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const moduleImporterCheck = (modules: Set<ModuleNode> | undefined, checker: (file: string) => boolean): boolean => {
  if (modules) {
    for (const module of modules) {
      if (module.file && checker(module.file)) return true
      return moduleImporterCheck(module.importers, checker)
    }
  }
  return false
}

const configFileWatcher = (vite: ViteDevServer, onChange: any) => {
  const configPath = joinURL(process.cwd(), 'hyper.config.js')
  vite.watcher.on('all', async (event, path) => {
    console.log('file has changed')
    const modules = vite.moduleGraph.getModulesByFile(path)
    const isConfigChanged = moduleImporterCheck(modules, (path) => path === configPath)
    if (isConfigChanged) {
      const configModule = vite.moduleGraph.getModuleById(configPath)
      if (configModule) vite.moduleGraph.invalidateModule(configModule)
      await onChange()
    }
  })
}

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
  const listeners: { onRestart: any } = {
    onRestart: null,
  }
  configFileWatcher(vite, async () => {
    consola.info('Config file has change. Restarting server...')
    listeners.onRestart && listeners.onRestart()
    startServer(vite, listeners)
  })
  startServer(vite, listeners)
}

const startServer = async (vite: ViteDevServer, listeners: any) => {
  const routeParser = async (route: HyperRoute) => {
    if (!route.serverBundle && route.filePath) {
      route.serverBundle = async () => (await vite.ssrLoadModule(route.filePath!)) as HyperRouteServerProps
    }

    if (!route.clientBundle && route.filePath) {
      route.clientBundle = async () => (await vite.ssrLoadModule(route.filePath!)) as HyperRouteClientProps
    }
    return route
  }

  let config = defaultHyperconfig
  if (existsSync(joinURL(process.cwd(), 'hyper.config.js'))) config = (await vite.ssrLoadModule(joinURL(process.cwd(), 'hyper.config.js'))).default as Required<HyperConfig>

  const app = await bootstrapHyperApp(config, routeParser)

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

  routerConfigure()
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
  const listener = await serveLocal(app)
  listeners.onRestart = listener.close
}

const clientBundleGenerator = async (vite: ViteDevServer, filePath: string) => {
  const code = (
    await vite.pluginContainer.transform(
      `
${genImport(filePath, [{ name: 'page', as: 'Page' }, 'loader'])}
${genImport('react-dom/client', 'ReactDOM')}
${genImport('xhyper/page', ['PageProvider'])}

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
