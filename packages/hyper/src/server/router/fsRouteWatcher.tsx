import { App, eventHandler, getRequestURL, getValidatedQuery, readMultipartFormData } from 'h3'
import { readFileSync } from 'node:fs'
import path from 'path'
import { createRouter } from 'radix3'
import ReactDOMServer from 'react-dom/server'
import { ViteDevServer } from 'vite'
import template from '../../assets/index.html'
import { DEV_ENV } from '../../cli/dev'
import { loadPageModules, pageJsBundleHandler, pageSSRRenderer } from './page-renderer'

const readJsonFile = (filepath: string) => JSON.parse(readFileSync(new URL(filepath, import.meta.url), { encoding: 'utf-8' }))

const pathGenerator = (directories: Record<string, string[]>) => {
  // This function generates radix3 compatible route paths based on file system
  // The file system rules follows as bellow

  // index.(.*)			 => / 			 	matches only root paths
  // [slug].(.*) 		 => /:slug 		matches named routes (e.g. /a and /b, not /a/b).
  // [..slug].(.*) 	 => /**:slug  named wild card route

  // docs: https://github.com/unjs/radix3#usage

  const namedRouteRegex = /\[(?!\.\.\.)(.*)\]/s
  const namedWildcardRouteRegex = /\[(\.\.\.)(.*)\]/s
  const rootRegex = /index\.([a-zA-Z0-9]+$)/s

  const paths: Record<string, string> = {}
  Object.keys(directories).forEach((dirPath) => {
    if (process.env.NODE_ENV === DEV_ENV && !dirPath.startsWith(path.join(process.cwd(), '/pages'))) return

    directories[dirPath].map((filename) => {
      const dirPrettyPath = dirPath.replace(path.join(process.cwd(), '/pages'), '')
      if (rootRegex.test(filename)) paths[path.join(dirPrettyPath, '/')] = path.join(dirPath, filename)
      if (namedRouteRegex.test(filename)) {
        const m = namedRouteRegex.exec(filename)
        const routeName = m?.[1]
        paths[path.join(dirPrettyPath, `/:${routeName}`)] = path.join(dirPath, filename)
      }
      if (namedWildcardRouteRegex.test(filename)) {
        const m = namedWildcardRouteRegex.exec(filename)
        const routeName = m?.[2]
        paths[path.join(dirPrettyPath, `/**:${routeName}`)] = path.join(dirPath, filename)
      }
    })
  })
  return paths
}
export type RouteData = { filePath: string }

export const setupFsRoutes = async (vite: ViteDevServer | null, app: App) => {
  let router = createRouter<RouteData>()

  if (process.env.NODE_ENV === DEV_ENV && vite) {
    const routerConfigure = () => {
      // remove all of the routes
      router.remove('/')
      // add routes again
      const paths = pathGenerator(vite.watcher.getWatched())
      Object.keys(paths).forEach((route) => {
        console.log('route inserted: ', route)
        router.insert(route, { filePath: paths[route] })
      })
    }
    // regenerate the routes on file change
    vite.watcher.on('ready', routerConfigure)
    vite.watcher.on('all', routerConfigure)
  } else {
    const data = readJsonFile(path.join(process.cwd(), '.hyper', 'server-bundles', 'manifest.json'))
    const pages: Record<string, string[]> = {}

    for (const file of Object.keys(data))
      if (file.startsWith('pages/')) {
        const dir = file.replace('pages/', '').split('/').slice(0, -1).join('/')
        if (!pages[dir]) pages[dir] = []
        pages[dir].push(file.split('/').pop()!)
      }

    const paths = pathGenerator(pages)

    Object.keys(paths).forEach((route) => {
      console.log('route inserted: ', route, data[`pages/${paths[route]}`].file)
      router.insert('/' + route, { filePath: data[`pages/${paths[route]}`].file })
    })
  }

  // configure middleware to handle routes matches with file system
  app.use(
    eventHandler(async (event) => {
      const pathname = getRequestURL(event).pathname
      console.log(pathname)
      const routeData = router.lookup(pathname)
      if (routeData) {
        let render, htmlContent

        const pageAttrs: PageAttrs = { scripts: [], links: [] }

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

export type PageAttrs = {
  scripts: Record<string, any>[]
  links: Record<string, any>[]
}

const attachPageAttrs = (html: string, pageAttrs: PageAttrs): string => {
  html = html.replace(
    `<!--hyper-links-->`,
    ReactDOMServer.renderToString(
      <>
        {pageAttrs.links.map((link, id) => {
          return <link key={id} {...link} />
        })}
      </>
    )
  )
  html = html.replace(
    `<!--hyper-scripts-->`,
    ReactDOMServer.renderToString(
      <>
        {pageAttrs.scripts.map((link, id) => {
          return <script key={id} {...link} />
        })}
      </>
    )
  )
  return html
}
