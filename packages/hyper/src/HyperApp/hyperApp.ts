import consola from 'consola'
import { App as H3App, H3Event, Router, createApp, createRouter as createH3Router, eventHandler } from 'h3'
import { RadixRouter, createRouter } from 'radix3'
import { FC } from 'react'
import { isDevelopment } from 'std-env'
import { hyperRouteHandler } from './server'

export enum Environment {
  DEV = 1,
  PRODUCTION = 2,
}

export type HyperAppOptions = {
  isEdge: boolean
}

export const defaultHyperAppOptions: HyperAppOptions = {
  isEdge: false,
}

export type HyperPageProps<T = any> = { loaderData: T }

export type HyperPage<T = any> = FC<HyperPageProps<T>>
export type HyperLoading = FC
export type HyperError = FC

export type HyperRouteClientProps = {
  page: HyperPage
  loading?: HyperLoading
  error?: HyperError
  [key: string]: any
}
export type HyperRouteClientBundle = () => Promise<HyperRouteClientProps>

export type HyperLoader = (event: H3Event) => Promise<any> | any
export type HyperAction<T = any, R = any> = (field: T, event: H3Event) => Promise<R> | R
export type HyperMeta<T = any> = (prop: HyperPageProps<T>) => Promise<Record<string, string>> | Record<string, string>
export type HyperRouteServerProps = {
  loader?: HyperLoader
  action?: HyperAction
  meta?: HyperMeta
  [key: string]: any
}
export type HyperRouteServerBundle = () => Promise<HyperRouteServerProps>
export type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>
export type HyperRoute =
  | {
      isFileBased?: boolean
      URL: string
      clientBundle: HyperRouteClientBundle
      serverBundle: HyperRouteServerBundle
      filePath: string
      manifestData?: {
        clientModule?: any
        serverModule?: any
        css?: string[]
        imports?: string[]
        file: string
        isEntry: boolean
        src: string
      }
    }
  | {
      isFileBased?: boolean
      URL: string
      clientBundle?: HyperRouteClientBundle
      serverBundle?: HyperRouteServerBundle
      filePath: string
      manifestData?: {
        clientModule?: any
        serverModule?: any
        css?: string[]
        imports?: string[]
        file: string
        isEntry: boolean
        src: string
      }
    }

export type HyperMiddleware = (url: string) => boolean | Promise<boolean>
export type HyperRuntimeRoute = RequireKeys<HyperRoute, 'clientBundle' | 'serverBundle'>
export class HyperApp {
  public middlewares: HyperMiddleware[] = []
  public routes: RadixRouter<HyperRuntimeRoute>
  public h3: H3App = createApp()
  private thirdPartyRoutes: Router = createH3Router()
  public thirdPartyRoutesArray: HyperRoute[] = []
  constructor(public readonly environment: Environment, public readonly defaultRoutes: HyperRuntimeRoute[], public readonly options: HyperAppOptions = defaultHyperAppOptions) {
    this.routes = createRouter()
    for (const route of defaultRoutes) this.routes.insert(route.URL, route)
    this.h3.use(this.thirdPartyRoutes)
  }
  async addPage(route: HyperRoute) {
    route.isFileBased = false
    await this.routeParser(route)
    this.thirdPartyRoutesArray.push(route)
    this.thirdPartyRoutes.add(
      route.URL,
      eventHandler(async (event) => await hyperRouteHandler(route as HyperRuntimeRoute, this, event))
    )
  }
  addMiddleware(middleware: HyperMiddleware) {
    this.middlewares.push(middleware)
  }
  async installPlugins(plugins: HyperPlugin[]) {
    console.log('')
    consola.start('Installing plugins...')
    for (const plugin of plugins) {
      await plugin.install(this)
      consola.success(`[${plugin.name}] installed`)
    }
    console.log('')
  }
  async transformHTML(template: string, event: H3Event) {
    return template
  }
  async routeParser(route: HyperRoute) {
    return route
  }
}
export type HyperPlugin = {
  name: string
  install: (app: HyperApp) => void
}
export type HyperConfig = {
  edge?: boolean
  plugins?: HyperPlugin[]
}
export const defaultHyperconfig: Required<HyperConfig> = {
  edge: false,
  plugins: [],
}

export const bootstrapHyperApp = async (config?: Required<HyperConfig>, routeParser?: (route: HyperRoute) => Promise<HyperRoute>): Promise<HyperApp> => {
  consola.wrapAll()
  consola.info('Starting Hyper App')

  console.log('')
  consola.start('Loading Config...')

  // const { config } = await loadConfig<Required<HyperConfig>>({
  //   name: 'hyper',
  //   defaultConfig: defaultHyperconfig,
  //   async resolve() {
  //     if (overrideConfig)
  //       return {
  //         config: overrideConfig,
  //       }
  //     else return null
  //   },
  //   jitiOptions: {
  //     esmResolve: true,
  //   },
  // })
  consola.success('Config loaded')
  console.log('')

  const app = new HyperApp(isDevelopment ? Environment.DEV : Environment.PRODUCTION, [], {
    isEdge: config!.edge,
  })

  if (routeParser) app.routeParser = routeParser

  await app.installPlugins(config!.plugins)

  return app
}
