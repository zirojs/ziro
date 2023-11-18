import { createRouter, eventHandler, setHeaders } from 'h3'
import { existsSync, readFileSync } from 'node:fs'
import { joinURL } from 'ufo'
import { HyperRoute, bootstrapHyperApp, defaultHyperconfig } from '../hyperApp'
import { pathGenerator } from '../lib/pathGenerator'
import { readJsonFile } from '../lib/readJsonFile'
import { serveLocal } from './utils/serveLocal'

const normalizeManifestData = (manifest: { css?: string[] }) => {
  if (manifest.css) {
    for (let i = 0; i < manifest.css.length; i++) {
      manifest.css[i] = joinURL('/_hyper', manifest.css[i])
    }
  }
  return manifest
}

export const runHyperProductionServer = async () => {
  let config = defaultHyperconfig
  const configPath = joinURL(process.cwd(), '.hyper', 'hyper.config.mjs')
  if (existsSync(configPath)) config = (await import(configPath)).default

  const data = readJsonFile(joinURL(process.cwd(), '.hyper', 'server-bundles', 'manifest.json'))

  const routeParser = async (route: HyperRoute) => {
    const routeManifestKey: any = Object.keys(data).find((key) => key.endsWith(route.filePath) && !key.startsWith('pages/'))
    const routeManifest = data[routeManifestKey]

    route.clientBundle = async () => await import(joinURL(process.cwd(), '.hyper', 'server-bundles', routeManifest.file))
    route.serverBundle = async () => {
      const pathSplit = routeManifest.file.split('/')
      pathSplit[pathSplit.length - 1] = 'server.' + pathSplit[pathSplit.length - 1]
      return await import(joinURL(process.cwd(), '.hyper', 'server-bundles', pathSplit.join('/')))
    }
    // @ts-ignore
    route.manifestData = normalizeManifestData(routeManifest)
    route.filePath = routeManifest.file
    return route
  }

  const app = await bootstrapHyperApp(config, routeParser)

  const pages: Record<string, string[]> = {}

  for (const file of Object.keys(data))
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
      filePath: data[`pages/${paths[route]}`].file,
      // @ts-ignore
      manifestData: normalizeManifestData(data[`pages/${paths[route]}`]),
      clientBundle: async () => await import(joinURL(process.cwd(), '.hyper', 'server-bundles', data[`pages/${paths[route]}`].file)),
      serverBundle: async () => {
        const pathSplit = data[`pages/${paths[route]}`].file.split('/')
        pathSplit[pathSplit.length - 1] = 'server.' + pathSplit[pathSplit.length - 1]
        return await import(joinURL(process.cwd(), '.hyper', 'server-bundles', pathSplit.join('/')))
      },
    })
  })

  // return file system file
  const router = createRouter()

  router.add(
    '/_hyper/**',
    eventHandler(async (event) => {
      const filePath = event.path.replace('/_hyper', '')
      const extension = filePath.split('.')[filePath.split('.').length - 1]

      const contentTypes = {
        css: 'text/css',
        js: 'text/javascript',
        mjs: 'text/javascript',
      }

      setHeaders(event, {
        'Content-Type': contentTypes[extension as keyof typeof contentTypes],
      })
      return readFileSync(joinURL(process.cwd(), '.hyper', 'client-bundles', filePath))
    })
  )

  app.h3.use(router)

  app.transformHTML = async (template, event) => {
    return template
  }

  serveLocal(app)
}
