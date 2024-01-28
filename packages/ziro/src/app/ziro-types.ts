import { H3Event } from 'h3'
import { FC } from 'react'
import { ZiroApp } from '.'

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

export type ZiroLoader = (event: H3Event, context?: ZiroPluginRouteContext['context']) => Promise<any> | any
export type ZiroAction<T = any, R = any> = (field: T, event: H3Event, context?: ZiroPluginRouteContext['context']) => Promise<R> | R
export type ZiroMeta<T = any> = (prop: ZiroPageProps<T>) => Promise<Record<string, string>> | Record<string, string>
export type ZiroRouteServerProps = {
  loader?: ZiroLoader
  action?: ZiroAction
  meta?: ZiroMeta
  [key: string]: any
}
export type ZiroRouteServerBundle = () => Promise<ZiroRouteServerProps>
export type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>
export type ZiroPluginRouteContext = {
  name?: string
  context?: unknown
}
export type ZiroRoute = {
  URL: string
  clientBundle: ZiroRouteClientBundle
  serverBundle: ZiroRouteServerBundle
  filePath?: string
  isPluginRoute?: boolean
  pluginContext?: ZiroPluginRouteContext
}

export type ZiroMiddleware = (url: string) => boolean | Promise<boolean>
export type ZiroRuntimeRoute = RequireKeys<ZiroRoute, 'clientBundle' | 'serverBundle'>

export type ZiroPlugins = (ZiroPlugin | ZiroPluginWithContext)[]

export type ZiroPlugin = {
  name: string
  install: (app: ZiroApp) => void
}
export type ZiroPluginWithContext<T = {}> = [(props: T) => ZiroPlugin, T]

export type ZiroConfig = {
  edge?: boolean
  plugins?: ZiroPlugin[]
}
