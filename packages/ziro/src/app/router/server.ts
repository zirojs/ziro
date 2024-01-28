import { AnyRoute, RouteMatch, Router, createRootRoute, createRoute, createRouter, lazyRouteComponent } from '@tanstack/react-router'
import glob from 'fast-glob'
import { H3Event, getRequestURL } from 'h3'
import { RadixNode } from 'radix3'
import { joinURL } from 'ufo'
import { ZiroApp } from '..'
import { h3ToTanstack } from '../lib/ziroPages'
import { getVite } from '../runners/dev/vite'
import { ZiroRoute } from '../ziro-types'

export const getCurrentRouteLoaderData = (event: H3Event, router: Router) => {
  const currentRoute = router.dehydrate().state.dehydratedMatches.find((route) => route.id === getRequestURL(event).pathname)

  if (currentRoute && (currentRoute as RouteMatch).loaderData) {
    return (currentRoute as RouteMatch).loaderData
  }
  return null
}

export const generateServerRouter = async (app: ZiroApp, event: H3Event) => {
  const vite = await getVite()
  const basePath = process.cwd()
  const rootPath = await glob(joinURL(basePath, '/pages/_root.{tsx, jsx}'))
  const createComponent = async (filePath: string) => {
    return vite.ssrLoadModule(filePath)
  }
  const createPageLoader = async (filePath: string, event: H3Event) => {
    const module = await createComponent(filePath)
    return () => (module.loader ? module.loader(event) : null)
  }
  let root = createRootRoute({
    component: undefined,
  })
  if (rootPath.length) {
    const rootComponent = (await createComponent(rootPath[0])).default
    if (rootComponent)
      root = createRootRoute({
        component: rootComponent,
      })
  }

  const createRoutes = async (root: AnyRoute, childRoutes: Map<string, RadixNode<ZiroRoute>>, routes: AnyRoute[] = []) => {
    for (const [, radixRoute] of childRoutes) {
      const ziroRoute = radixRoute.data!

      if (ziroRoute.filePath) {
        const route = createRoute({
          path: joinURL('/', root.fullPath, h3ToTanstack(ziroRoute.URL)),
          component: lazyRouteComponent(createComponent.bind(null, ziroRoute.filePath)),
          getParentRoute: () => root,
          loader: await createPageLoader(ziroRoute.filePath, event),
        })

        const routeChildren = radixRoute.children

        routes.push(route)
        if (routeChildren && routeChildren.size) {
          await createRoutes(root, routeChildren, routes)
        }
      }
    }

    return routes
  }

  return createRouter({
    routeTree: root.addChildren(await createRoutes(root, new Map(Object.entries(app.routes.ctx.staticRoutesMap)))),
    defaultPreload: 'intent',
  })
}
