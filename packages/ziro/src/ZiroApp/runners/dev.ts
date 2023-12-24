import babel from '@babel/core'
import react from '@vitejs/plugin-react'
import consola from 'consola'
import { createRouter, eventHandler, fromNodeMiddleware, sendRedirect, setHeaders } from 'h3'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { dirname } from 'path'
import { joinURL } from 'ufo'
import { fileURLToPath } from 'url'
import { ModuleNode, ViteDevServer, createServer as createViteServer } from 'vite'
import { ziroBabelClientBundle } from '../build/babel-plugins/client-bundle'
import { pathGenerator } from '../lib/pathGenerator'
import { isZiroPage } from '../utils/ziroPages'
import { ZiroConfig, ZiroRoute, ZiroRouteClientProps, ZiroRouteServerProps, bootstrapZiroApp, ziroDefaultConfig } from '../ziro'
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
  const configPath = joinURL(process.cwd(), 'ziro.config.js')
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

export const ziroDevServer = async () => {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: true },
    appType: 'custom',
    root: process.cwd(),
    configFile: false,
    clearScreen: false,
    plugins: [
      {
        enforce: 'pre',
        name: 'ziro-plugin',
        transform(code, id, options = { ssr: false }) {
          if (isZiroPage(id) && !!!options.ssr) {
            const output = babel.transformSync(code, {
              filename: id,
              targets: {
                esmodules: true,
              },
              presets: ['@babel/preset-typescript'],
              plugins: [ziroBabelClientBundle],
            })?.code!
            return output
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
  const routeParser = async (route: ZiroRoute) => {
    if (!route.serverBundle && route.filePath) {
      route.serverBundle = async () => (await vite.ssrLoadModule(route.filePath!)) as ZiroRouteServerProps
    }

    if (!route.clientBundle && route.filePath) {
      route.clientBundle = async () => (await vite.ssrLoadModule(route.filePath!)) as ZiroRouteClientProps
    }
    return route
  }

  let config = ziroDefaultConfig
  if (existsSync(joinURL(process.cwd(), 'ziro.config.js'))) config = (await vite.ssrLoadModule(joinURL(process.cwd(), 'ziro.config.js'))).default as Required<ZiroConfig>

  const app = await bootstrapZiroApp(config, routeParser)

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
        clientBundle: async () => (await vite.ssrLoadModule(paths[route])) as ZiroRouteClientProps,
        serverBundle: async () => (await vite.ssrLoadModule(paths[route])) as ZiroRouteServerProps,
      })
    })
  }

  vite.watcher.once('ready', routerConfigure)
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
    return vite.transformIndexHtml(event.path, template)
  }
  const listener = await serveLocal(app)
  listeners.onRestart = listener.close
}
