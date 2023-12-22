import { createRouter, eventHandler, setHeaders } from 'h3'
import { existsSync, readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { joinURL } from 'ufo'
import { pathGenerator } from '../lib/pathGenerator'
import { readJsonFile } from '../lib/readJsonFile'
import { ZiroRoute, bootstrapZiroApp, ziroDefaultConfig } from '../ziro'
import { serveLocal } from './utils/serveLocal'

type ManifestFile = {
  css?: string[]
  file: string
  imports?: string[]
}

const getImportersCss = (importer: ManifestFile, css: Set<string>, manifestData: Record<string, ManifestFile>) => {
  if (importer.css) {
    importer.css.forEach((c) => {
      css.add(c)
    })
  }
  if (importer.imports) {
    for (let i = 0; i < importer.imports.length; i++) {
      if (!!manifestData[importer.imports[i]]) getImportersCss(manifestData[importer.imports[i]], css, manifestData)
    }
  }
}

const normalizeManifestData = (manifest: ManifestFile, allManifest: Record<string, ManifestFile>) => {
  const css = new Set<string>()
  getImportersCss(manifest, css, allManifest)
  manifest.css = []
  for (const c of css) {
    manifest.css.push(joinURL('/_ziro', c))
  }
  return manifest
}

export const ziroProductionServer = async () => {
  let config = ziroDefaultConfig
  const configPath = joinURL(process.cwd(), '.ziro', 'ziro.config.mjs')
  if (existsSync(configPath)) config = (await import(configPath)).default

  const manifest = readJsonFile(joinURL(process.cwd(), '.ziro', 'server-bundles', '.vite', 'manifest.json'))

  const routeParser = async (route: ZiroRoute) => {
    if (route.filePath) {
      const routeManifestKey: any = Object.keys(manifest).find((key) => key.endsWith(route.filePath!) && !key.startsWith('pages/'))
      const routeManifest = manifest[routeManifestKey]

      route.clientBundle = async () => await import(joinURL(process.cwd(), '.ziro', 'server-bundles', routeManifest.file))
      route.serverBundle = async () => {
        const pathSplit = routeManifest.file.split('/')
        pathSplit[pathSplit.length - 1] = 'server.' + pathSplit[pathSplit.length - 1]
        return await import(joinURL(process.cwd(), '.ziro', 'server-bundles', pathSplit.join('/')))
      }
      // @ts-ignore
      route.manifestData = normalizeManifestData(routeManifest, manifest)
      route.filePath = routeManifest.file
    }
    return route
  }

  const app = await bootstrapZiroApp(config, routeParser)

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
      manifestData: normalizeManifestData(manifest[`pages/${paths[route]}`], manifest),
      clientBundle: async () => await import(joinURL(process.cwd(), '.ziro', 'server-bundles', manifest[`pages/${paths[route]}`].file)),
      serverBundle: async () => {
        const pathSplit = manifest[`pages/${paths[route]}`].file.split('/')
        pathSplit[pathSplit.length - 1] = 'server.' + pathSplit[pathSplit.length - 1]
        return await import(joinURL(process.cwd(), '.ziro', 'server-bundles', pathSplit.join('/')))
      },
    })
  })

  // return file system file
  const router = createRouter()

  router.add(
    '/_ziro/**',
    eventHandler(async (event) => {
      const filePath = event.path.replace('/_ziro', '')
      const extension = filePath.split('.')[filePath.split('.').length - 1]

      const contentTypes = {
        css: 'text/css',
        js: 'text/javascript',
        mjs: 'text/javascript',
      }

      setHeaders(event, {
        'Content-Type': contentTypes[extension as keyof typeof contentTypes],
      })
      return readFileSync(joinURL(process.cwd(), '.ziro', 'client-bundles', filePath))
    })
  )

  router.add(
    '/**',
    eventHandler(async (event) => {
      const filePath = event.path
      const isFileExists = existsSync(joinURL(process.cwd(), '.ziro', 'client-bundles', filePath))
      const isFile = !!extname(filePath)
      if (isFileExists && isFile) {
        const extension = filePath.split('.')[filePath.split('.').length - 1]
        const contentTypes = {
          css: 'text/css',
          js: 'text/javascript',
          mjs: 'text/javascript',
        }
        if (contentTypes[extension as keyof typeof contentTypes])
          setHeaders(event, {
            'Content-Type': contentTypes[extension as keyof typeof contentTypes],
          })
        return readFileSync(joinURL(process.cwd(), '.ziro', 'client-bundles', filePath))
      }
    })
  )

  app.h3.use(router)

  app.transformHTML = async (template, event) => {
    return template
  }

  serveLocal(app)
}
