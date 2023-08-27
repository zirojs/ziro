import { eventHandler } from 'h3'
import path from 'path'
import { createRouter } from 'radix3'
import { ViteDevServer } from 'vite'
import template from '../../assets/index.html'
import { DEV_ENV } from '../../hyper'
import { pageRenderer } from './pagerenderer.ts'

const namedRouteRegex = /\[(?!\.\.\.)(.*)\]/s
const namedWildcardRouteRegex = /\[(\.\.\.)(.*)\]/s
const rootRegex = /index\.([a-zA-Z0-9]+$)/s

const pathGenerator = (directories: Record<string, string[]>) => {
  const paths: Record<string, string> = {}
  Object.keys(directories).forEach((dirPath) => {
    if (!dirPath.startsWith(path.join(process.cwd(), '/pages'))) return
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

export const fsRouteGenerator = (vite: ViteDevServer) => {
  let router = createRouter<{ filePath: string }>()

  const routerConfigure = () => {
    router.remove('/')
    const paths = pathGenerator(vite.watcher.getWatched())
    Object.keys(paths).forEach((route) => {
      console.log('route inserted: ', route)
      router.insert(route, { filePath: paths[route] })
    })
  }

  vite.watcher.on('ready', routerConfigure)
  vite.watcher.on('all', routerConfigure)

  return eventHandler(async (event) => {
    const routeData = router.lookup(event.path)
    if (routeData) {
      let render, htmlContent

      if (process.env.NODE_ENV === DEV_ENV && vite !== null) {
        htmlContent = await vite.transformIndexHtml(event.path, template)
        render = await pageRenderer(vite, routeData.filePath)
      } else {
        htmlContent = template
        render = () => 'something' // TODO: render on build
      }

      const appHtml = await render()
      const html = htmlContent.replace(`<!--ssr-outlet-->`, appHtml).replace(`<!--hyper-data-->`, `<script>window._pagePath = '${path.resolve(routeData.filePath)}'</script>`)
      return html
    }
  })
}
