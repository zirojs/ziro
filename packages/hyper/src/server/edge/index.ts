import { App, createApp, eventHandler, getRequestURL } from 'h3'
import { createRouter } from 'radix3'
import { RouteData } from '../lib/RouterObj'
import { PageAttrs, attachPageAttrs } from '../lib/htmlInjector'
import { pageSSRRenderer } from './pageRenderer'
import { pathGenerator } from './pathGenerator'

const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--hyper-meta-->
    <!--hyper-links-->
  </head>
  <body>
    <div id="hyper-app"><!--ssr-outlet--></div>
    <!--hyper-scripts-->
  </body>
</html>
`

export const setupFsRoutes = (app: App, routes: any) => {
  let router = createRouter<RouteData>()

  const data = routes
  const pages: Record<string, string[]> = {}

  for (const file of Object.keys(data))
    if (file.startsWith('pages/')) {
      const dir = file.replace('pages/', '').split('/').slice(0, -1).join('/')
      if (!pages[dir]) pages[dir] = []
      pages[dir].push(file.split('/').pop()!)
    }

  const paths = pathGenerator(pages)

  Object.keys(paths).forEach((route) => {
    // @ts-ignore
    router.insert('/' + route, { filePath: data[`pages/${paths[route]}`].file, manifestData: data[`pages/${paths[route]}`] })
  })

  // configure middleware to handle routes matches with file system
  app.use(
    eventHandler(async (event) => {
      const pathname = getRequestURL(event).pathname
      const routeData = router.lookup(pathname)

      if (routeData) {
        let render, htmlContent

        const pageAttrs: PageAttrs = { scripts: [], links: [], meta: {} }

        htmlContent = template

        render = await pageSSRRenderer(routeData, pageAttrs)

        const appHtml = await render()
        let html = htmlContent.replace(`<!--ssr-outlet-->`, appHtml)

        pageAttrs.scripts.push({
          type: 'module',
          src: `/_hyper/${routeData.filePath.replace('.server', '')}`,
        })
        if (routeData.manifestData?.css) {
          routeData.manifestData?.css.map((href) => {
            pageAttrs.links.push({
              href: `/_hyper/${href}`,
              rel: 'stylesheet',
              type: 'text/css',
            })
          })
        }

        html = attachPageAttrs(html, pageAttrs)
        return html
      }
    })
  )
}

export const bootstrapEdgeHyperApp = (routes: any) => {
  const app = createApp()

  setupFsRoutes(app, routes)

  return app
}
