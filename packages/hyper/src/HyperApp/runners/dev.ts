import babel from '@babel/core'
import react from '@vitejs/plugin-react'
import consola from 'consola'
import { createRouter, eventHandler, fromNodeMiddleware, setHeaders } from 'h3'
import { genImport } from 'knitwork'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { dirname } from 'path'
import { joinURL } from 'ufo'
import { fileURLToPath } from 'url'
import { ModuleNode, ViteDevServer, createServer as createViteServer } from 'vite'
import { hyperBabelClientBundle } from '../build/babel-plugins/client-bundle'
import { HyperConfig, HyperRoute, HyperRouteClientProps, HyperRouteServerProps, bootstrapHyperApp, defaultHyperconfig } from '../hyperApp'
import { pathGenerator } from '../lib/pathGenerator'
import { isHyperPage } from '../utils/hyperPages'
import { serveLocal } from './utils/serveLocal'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const moduleImporterCheck = (modules: Set<ModuleNode> | undefined, checker: (file: string) => boolean, parentModule: ModuleNode | null = null): boolean => {
  if (modules) {
    for (const module of modules) {
      if (!parentModule || (parentModule && parentModule.file !== module.file)) {
        console.log(parentModule?.file, module.file)

        if (module.file && checker(module.file)) return true
        return moduleImporterCheck(module.importers, checker, module)
      }
    }
  }
  return false
}

const configFileWatcher = (vite: ViteDevServer, onChange: any) => {
  const configPath = joinURL(process.cwd(), 'hyper.config.js')
  vite.watcher.on('all', async (event, path) => {
    const configModule = vite.moduleGraph.getModuleById(configPath)

    let isConfigChanged = false
    if (configModule?.ssrImportedModules)
      for (const m of configModule?.ssrImportedModules) {
        if (m.file === path) isConfigChanged = true
      }
    if (isConfigChanged) {
      vite.moduleGraph.onFileChange(configPath)
      await onChange()
    }
  })
}

export const runHyperDevServer = async () => {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: true },
    appType: 'custom',
    root: process.cwd(),
    configFile: false,
    clearScreen: false,
    plugins: [
      {
        enforce: 'pre',
        name: 'hyper-pages-hmr',
        transform(code, id, options = { ssr: false }) {
          if (isHyperPage(id) && !!!options.ssr) {
            return babel.transformSync(
              `
						${genImport('react', 'React')}
						${code}

						if(import.meta.hot){
							import.meta.hot.accept((newModule) => {
								if (newModule) {
									mount(newModule.page)
								}
							})
						}

						`,
              {
                filename: id,
                targets: {
                  esmodules: true,
                },
                presets: [
                  '@babel/preset-typescript',
                  [
                    '@babel/preset-react',
                    {
                      development: true,
                    },
                  ],
                ],
                plugins: [hyperBabelClientBundle],
              }
            )?.code!
          }
          return code
        },
      },
      react(),
    ],
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
${genImport('react', ['Fragment'])}
${genImport('xhyper/page', ['PageProvider'])}

const mount = (Page = Fragment) => {
	if(!window.root)
		window.root = ReactDOM.hydrateRoot(document.getElementById("hyper-app"),
			<PageProvider>
				<Page />
			</PageProvider>
		)
}
mount(Page)
`,
      filePath
    )
  ).code

  return code
}
