import { App, eventHandler, getRequestURL, getValidatedQuery, readMultipartFormData } from 'h3'
import { createRouter } from 'radix3'
import { joinURL } from 'ufo'
import { ViteDevServer } from 'vite'
import template from '../../assets/index.html'
import { RouteData } from '../lib/RouterObj'
import { DEV_ENV } from '../lib/constants'
import { PageAttrs, attachPageAttrs } from '../lib/htmlInjector'
import { pathGenerator } from '../lib/pathGenerator'
import { readJsonFile } from '../lib/readJsonFile'
import { loadPageModules, pageJsBundleHandler, pageSSRRenderer } from './pageRenderer'

export const setupFsRoutes = async (vite: ViteDevServer | null, app: App) => {
  let router = createRouter<RouteData>()

  if (process.env.NODE_ENV === DEV_ENV && vite) {
    const routerConfigure = () => {
      // remove all of the routes
      router.remove('/')
      // add routes again
      const paths = pathGenerator(vite.watcher.getWatched())
      Object.keys(paths).forEach((route) => {
        router.insert(route, { filePath: paths[route] })
      })
    }
    // regenerate the routes on file change
    vite.watcher.on('ready', routerConfigure)
    vite.watcher.on('all', routerConfigure)
  } else {
    const data = readJsonFile(joinURL(process.cwd(), '.hyper', 'server-bundles', 'manifest.json'))
    const pages: Record<string, string[]> = {}

    for (const file of Object.keys(data))
      if (file.startsWith('pages/')) {
        const dir = file.replace('pages/', '').split('/').slice(0, -1).join('/')
        if (!pages[dir]) pages[dir] = []
        pages[dir].push(file.split('/').pop()!)
      }

    const paths = pathGenerator(pages)

    Object.keys(paths).forEach((route) => {
      router.insert('/' + route, { filePath: data[`pages/${paths[route]}`].file, manifestData: data[`pages/${paths[route]}`] })
    })
  }

  // configure middleware to handle routes matches with file system
  app.use(
    eventHandler(async (event) => {
      const pathname = getRequestURL(event).pathname
      const routeData = router.lookup(pathname)

      if (routeData) {
        let render, htmlContent

        const pageAttrs: PageAttrs = { scripts: [], links: [], meta: {} }

        if (process.env.NODE_ENV === DEV_ENV && vite) htmlContent = await vite.transformIndexHtml(event.path, template)
        else htmlContent = template

        render = await pageSSRRenderer(vite, routeData.filePath, pageAttrs)

        const appHtml = await render()
        let html = htmlContent.replace(`<!--ssr-outlet-->`, appHtml)

        if (process.env.NODE_ENV === DEV_ENV) {
          pageAttrs.scripts.push({
            type: 'module',
            src: `/_hyper.js?page=${pathname}`,
          })
        } else {
          pageAttrs.scripts.push({
            type: 'module',
            src: `/${routeData.filePath.replace('.server', '')}`,
          })
          if (routeData.manifestData?.css) {
            routeData.manifestData?.css.map((href) => {
              pageAttrs.links.push({
                href,
                rel: 'stylesheet',
                type: 'text/css',
              })
            })
          }
        }

        html = attachPageAttrs(html, pageAttrs)
        return html
      }
    })
  )

  // generate route specific js file
  if (process.env.NODE_ENV === DEV_ENV && vite) app.use('/_hyper.js', pageJsBundleHandler(vite, router))

  app.use(
    '/api',
    eventHandler(async (event) => {
      const { page } = await getValidatedQuery<{ page: string }>(event, (data) => {
        const page = (data as { page: string }).page

        return new Promise((resolve, reject) => {
          if (page && router.lookup(page)) resolve({ page })
          else {
            reject('page path is not valid!')
          }
        })
      })

      const pageInfo = router.lookup(page)
      let pageModule = await loadPageModules(pageInfo?.filePath!, vite)

      if (event.method === 'POST') {
        const action = pageModule.action
        const data = await readMultipartFormData(event)

        if (data && action) {
          try {
            const fields: any = {}
            const multipartFormData = await readMultipartFormData(event)
            if (multipartFormData)
              for (const field of multipartFormData) {
                if (field.name && !field.filename) fields[field.name] = field.data.toString()
                if (field.name && field.filename) fields[field.name] = field
              }
            return await action(fields, event)
          } catch (err) {
            return
          }
        }
      } else if (event.method === 'GET') {
        const loader = pageModule.loader

        return loader(event)
      }
      return {}
    })
  )
}
