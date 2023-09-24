import { App, eventHandler, getRequestURL } from 'h3'
import { readFileSync } from 'node:fs'
import path from 'path'
import { createRouter } from 'radix3'
import { ViteDevServer } from 'vite'
import template from '../../assets/index.html'
import { DEV_ENV } from '../../cli/dev'
import { pageJsBundleHandler, pageSSRRenderer } from './page-renderer'

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

        if (process.env.NODE_ENV === DEV_ENV && vite) htmlContent = await vite.transformIndexHtml(event.path, template)
        else htmlContent = template

        render = await pageSSRRenderer(vite, routeData.filePath)

        const appHtml = await render()
        let html = htmlContent.replace(`<!--ssr-outlet-->`, appHtml)

        if (process.env.NODE_ENV === DEV_ENV) html = html.replace(`<!--hyper-data-->`, `<script type="module" src="/_hyper.js?page=${pathname}"></script>`)
        else html = html.replace(`<!--hyper-data-->`, `<script type="module" src="/${routeData.filePath.replace('.server', '')}"></script>`)
        return html
      }
    })
  )

  // generate route specific js file
  if (process.env.NODE_ENV === DEV_ENV && vite) app.use('/_hyper.js', pageJsBundleHandler(vite, router))
}
