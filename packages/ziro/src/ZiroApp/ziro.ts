import consola from 'consola'
import { App as H3App, H3Event, Router, createApp, createRouter as createH3Router, eventHandler } from 'h3'
import { RadixRouter, createRouter } from 'radix3'
import { FC } from 'react'
import { isDevelopment } from 'std-env'
import { ziroRouteHandler } from './server'

export * from 'h3'

export enum Environment {
  DEV = 1,
  PRODUCTION = 2,
}

export type ZiroAppOptions = {
  isEdge: boolean
}

export const ziroAppDefaultOptions: ZiroAppOptions = {
  isEdge: false,
}

export type ZiroPageProps<T = any> = { loaderData: T }

export type ZiroPage<T = any> = FC<ZiroPageProps<T>>
export type ZiroLoading = FC
export type ZiroError = FC

export type ZiroRouteClientProps = {
  page: ZiroPage
  loading?: ZiroLoading
  error?: ZiroError
  [key: string]: any
}
export type ZiroRouteClientBundle = () => Promise<ZiroRouteClientProps>

export type ZiroLoader = (event: H3Event) => Promise<any> | any
export type ZiroAction<T = any, R = any> = (field: T, event: H3Event) => Promise<R> | R
export type ZiroMeta<T = any> = (prop: ZiroPageProps<T>) => Promise<Record<string, string>> | Record<string, string>
export type ZiroRouteServerProps = {
  loader?: ZiroLoader
  action?: ZiroAction
  meta?: ZiroMeta
  [key: string]: any
}
export type ZiroRouteServerBundle = () => Promise<ZiroRouteServerProps>
export type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>
export type ZiroRoute =
  | {
      isFileBased?: boolean
      URL: string
      clientBundle: ZiroRouteClientBundle
      serverBundle: ZiroRouteServerBundle
      filePath?: string
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
      clientBundle?: ZiroRouteClientBundle
      serverBundle?: ZiroRouteServerBundle
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

export type ZiroMiddleware = (url: string) => boolean | Promise<boolean>
export type ZiroRuntimeRoute = RequireKeys<ZiroRoute, 'clientBundle' | 'serverBundle'>
export class ZiroApp {
  public middlewares: ZiroMiddleware[] = []
  public routes: RadixRouter<ZiroRuntimeRoute>
  public h3: H3App = createApp()
  public thirdPartyRoutes: Router = createH3Router()
  public thirdPartyRoutesArray: ZiroRoute[] = []
  constructor(public readonly environment: Environment, public readonly defaultRoutes: ZiroRuntimeRoute[], public readonly options: ZiroAppOptions = ziroAppDefaultOptions) {
    this.routes = createRouter()
    for (const route of defaultRoutes) this.routes.insert(route.URL, route)
    this.h3.use(this.thirdPartyRoutes)
  }
  async addPage(route: ZiroRoute) {
    route.isFileBased = false
    await this.routeParser(route)
    this.thirdPartyRoutesArray.push(route)
    console.log('third party route added', route.URL)
    this.thirdPartyRoutes.add(
      route.URL,
      eventHandler(async (event) => await ziroRouteHandler(route as ZiroRuntimeRoute, this, event))
    )
  }
  addMiddleware(middleware: ZiroMiddleware) {
    this.middlewares.push(middleware)
  }
  async installPlugins(plugins: ZiroPlugin[]) {
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
  async routeParser(route: ZiroRoute) {
    return route
  }
}
export type ZiroPlugin = {
  name: string
  install: (app: ZiroApp) => void
}
export type ZiroConfig = {
  edge?: boolean
  plugins?: ZiroPlugin[]
}
export const ziroDefaultConfig: Required<ZiroConfig> = {
  edge: false,
  plugins: [],
}

export const bootstrapZiroApp = async (config?: Required<ZiroConfig>, routeParser?: (route: ZiroRoute) => Promise<ZiroRoute>): Promise<ZiroApp> => {
  consola.wrapAll()
  consola.info('Starting Ziro App')

  const app = new ZiroApp(isDevelopment ? Environment.DEV : Environment.PRODUCTION, [], {
    isEdge: config!.edge,
  })

  if (routeParser) app.routeParser = routeParser

  await app.installPlugins(config!.plugins)

  return app
}
