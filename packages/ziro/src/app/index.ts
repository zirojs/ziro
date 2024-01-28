import consola from 'consola'
import { App as H3App, H3Event, createApp } from 'h3'
import { RadixRouter, createRouter } from 'radix3'
import { getRoutePattern } from './lib/ziroPages'
import { ZiroConfig, ZiroMiddleware, ZiroPluginRouteContext, ZiroPlugins, ZiroRoute, ZiroRuntimeRoute } from './ziro-types'

export * from 'h3'

export type ZiroAppOptions = {
  isEdge: boolean
}

export const ziroAppDefaultOptions: ZiroAppOptions = {
  isEdge: false,
}

let pluginRoutesContext: undefined | ZiroPluginRouteContext = undefined

export class ZiroApp {
  public middlewares: ZiroMiddleware[] = []
  public routes: RadixRouter<ZiroRoute>
  public h3: H3App = createApp()

  constructor(public readonly defaultRoutes: ZiroRuntimeRoute[], public readonly options: ZiroAppOptions = ziroAppDefaultOptions) {
    this.routes = createRouter()
    for (const route of defaultRoutes) this.routes.insert(route.URL, route)
  }
  async addPage(route: ZiroRoute, pluginContext = pluginRoutesContext) {
    route.isPluginRoute = true
    await this.routeParser(route)
    const routeURL = getRoutePattern(route.URL)!.toH3Route(route.URL)!
    route.pluginContext = pluginContext
    this.routes.insert(routeURL, route)
  }
  addMiddleware(middleware: ZiroMiddleware) {
    this.middlewares.push(middleware)
  }
  async installPlugins(plugins: ZiroPlugins) {
    consola.start('Installing plugins...')
    for (const plugin of plugins) {
      let pluginName = ''
      if (Array.isArray(plugin)) {
        pluginName = plugin[0](plugin[1]).name
        pluginRoutesContext = {
          name: pluginName,
          context: plugin[1],
        }
        await plugin[0](plugin[1]).install(this)
        pluginRoutesContext = undefined
      } else {
        await plugin.install(this)
        pluginName = plugin.name
      }
      consola.success(`[${pluginName}] installed`)
    }
  }
  async transformHTML(template: string, event: H3Event) {
    return template
  }
  async routeParser(route: ZiroRoute) {
    return route
  }
}
export const ziroDefaultConfig: Required<ZiroConfig> = {
  edge: false,
  plugins: [],
}

let app: ZiroApp | null = null

export const bootstrapZiroApp = async (config?: Required<ZiroConfig>, routeParser?: (route: ZiroRoute) => Promise<ZiroRoute>): Promise<ZiroApp> => {
  app = new ZiroApp([], {
    isEdge: config!.edge,
  })

  if (routeParser) app.routeParser = routeParser

  await app.installPlugins(config!.plugins)

  return app
}

export const getZiroApp = () => {
  return app as ZiroApp
}
