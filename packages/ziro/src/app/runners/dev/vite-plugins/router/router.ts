import fs from 'node:fs'
import path from 'node:path'
import { joinURL } from 'ufo'
import { findAllPages, getRoutePattern } from '../../../../lib/ziroPages'

const routeCache: Record<string, string> = {}

export async function generateRouterCode(directoryPath: string): Promise<string> {
  try {
    const ziroPages = await findAllPages(directoryPath)

    const rootComponentPath = path.join(directoryPath, 'pages', '_root.tsx')
    let rootComponentExists = false
    try {
      fs.accessSync(rootComponentPath, fs.constants.R_OK)
      rootComponentExists = true
    } catch (e) {}
    const rootComponentHasDefaultExport = rootComponentExists ? (await fs.readFileSync(rootComponentPath, 'utf-8')).includes('export default') : false

    // Import statements for React Router components
    let code = `import { RootRoute, Route, Router, lazyRouteComponent } from '@tanstack/react-router'\n`

    if (rootComponentHasDefaultExport) {
      code += `import { default as RootComponent } from '/pages/_root.tsx'\n`
    }

    // Create Route instances for each file
    const routes = []

    for (let index = 0; index < ziroPages.length; index++) {
      const filePath = ziroPages[index]
      const pattern = getRoutePattern(filePath)
      const filePathFromPagesDir = filePath.replace(joinURL(directoryPath, 'pages'), '')

      routes.push(` new Route({
        path: '${pattern?.toTanstackRoute(filePathFromPagesDir)}',
        ${
          // component: ${pattern.getRouteImportName(filePathFromPagesDir)},
          `component: lazyRouteComponent( () => import("${filePath}")),`
        }
        ${rootComponentHasDefaultExport && 'getParentRoute: () => root,'}
				loader: () => "something cool"
      })`)
    }

    // for (const route of getZiroApp().thirdPartyRoutesArray) {
    // 	if (route.clientBundle)
    // 		routes.push(
    // 			` new Route({
    // 				path: '${getRoutePattern(route.URL)?.toTanstackRoute(route.URL)}',
    // 				${
    // 					// component: ${pattern.getRouteImportName(filePathFromPagesDir)},
    // 					`component: lazyRouteComponent( () => import("${route.filePath}")),`
    // 				}
    // 				${rootComponentHasDefaultExport && "getParentRoute: () => root,"}
    // 				loader: () => "something cool"
    // 			})`,
    // new Route({
    // 	path: route.URL,
    // 	component: lazyRouteComponent(route.clientBundle),
    // 	getParentRoute: () => root,
    // }),
    // 		);
    // }

    // Create RootRoute instance
    code += `\nconst root = new RootRoute({
      component: RootComponent
    })\n\n`

    // Add Route instances to routeTree
    code += `const routeTree = root.addChildren([${routes.join(',')}])\n\n`

    // Create Router instance
    code += `export const createRouter = () => {
      return new Router({
        routeTree,
        defaultPreload: 'intent',
      })
    }\n`
    routeCache.x = code
    return code
  } catch (error: unknown) {
    console.error('Error:', error.message)
    return ''
  }
}
