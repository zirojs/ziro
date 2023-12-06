import { createRouter } from 'h3'
import { joinURL } from 'ufo'
import { Environment, HyperApp, HyperConfig, HyperRoute, HyperRouteClientBundle, HyperRouteServerBundle } from '../hyperApp'
import { bootstrapH3Server } from '../server'
import { pathGenerator } from './edge/pathGenerator'

const normalizeManifestData = (manifest: { css?: string[] }) => {
  if (manifest.css) {
    for (let i = 0; i < manifest.css.length; i++) {
      manifest.css[i] = joinURL('/_hyper', manifest.css[i])
    }
  }
  return manifest
}

export const HyperEdgeRunner = async (
  config: HyperConfig,
  manifest: Record<string, { file: string; module: any; isEntry: boolean; clientBundle: HyperRouteClientBundle; serverBundle: HyperRouteServerBundle }>
) => {
  const app = new HyperApp(Environment.PRODUCTION, [], {
    isEdge: true,
  })

  app.routeParser = async (route: HyperRoute) => {
    if (route.filePath) {
      const routeManifestKey: any = Object.keys(manifest).find((key) => key.endsWith(route.filePath!) && !key.startsWith('pages/'))
      const routeManifest = manifest[routeManifestKey]

      // @ts-ignore
      route.manifestData = normalizeManifestData(routeManifest)
      route.filePath = routeManifest.file
    }
    return route
  }

  await app.installPlugins(config!.plugins || [])

  const pages: Record<string, string[]> = {}

  for (const file of Object.keys(manifest))
    if (file.startsWith('pages/')) {
      const dir = file
        .replace(/(.*)pages\//i, '')
        .split('/')
        .slice(0, -1)
        .join('/')
      if (!pages[dir]) pages[dir] = []
      pages[dir].push(file.split('/').pop()!)
    }

  const paths = pathGenerator(pages)

  Object.keys(paths).forEach((route) => {
    app.routes.insert('/' + route, {
      URL: '/' + route,
      filePath: manifest[`pages/${paths[route]}`].file,
      // @ts-ignore
      manifestData: normalizeManifestData(manifest[`pages/${paths[route]}`]),
      clientBundle: manifest[`pages/${paths[route]}`].clientBundle,
      serverBundle: manifest[`pages/${paths[route]}`].serverBundle,
    })
  })

  // return file system file
  const router = createRouter()

  // router.add(
  //   '/_hyper/**',
  //   eventHandler(async (event) => {
  //     const filePath = event.path.replace('/_hyper', '')
  //     const extension = filePath.split('.')[filePath.split('.').length - 1]

  //     const contentTypes = {
  //       css: 'text/css',
  //       js: 'text/javascript',
  //       mjs: 'text/javascript',
  //     }

  //     setHeaders(event, {
  //       'Content-Type': contentTypes[extension as keyof typeof contentTypes],
  //     })
  //     return readFileSync(joinURL(process.cwd(), '.hyper', 'client-bundles', filePath))
  //   })
  // )

  app.h3.use(router)

  app.transformHTML = async (template, event) => {
    return template
  }

  bootstrapH3Server(app)

  return app.h3
}
