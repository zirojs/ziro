import { H3Event, eventHandler, getRequestURL, getValidatedQuery } from 'h3'
import ReactDOMServer from 'react-dom/server'
import { joinURL } from 'ufo'
import template from '../assets/index.html'
import { HyperApp, HyperRuntimeRoute } from './hyperApp'
import { attachPageAttrs } from './lib/htmlInjector'
import { parseBody } from './utils/parseBody'

export type PageAttrs = {
  scripts: Record<string, any>[]
  links: Record<string, any>[]
  meta: Record<string, string>
}

export const hyperLoaderDataVariableName = 'hyperLoaderData'

export const renderSSR = async (route: HyperRuntimeRoute, pageAttrs: PageAttrs, event: H3Event) => {
  const clientModule = await route.clientBundle()
  const serverModule = await route.serverBundle()

  let loaderData = {}
  const loader = serverModule.loader
  if (typeof loader === 'function' && loader) {
    loaderData = await loader(event)
    pageAttrs.scripts.push({
      dangerouslySetInnerHTML: { __html: `window.${hyperLoaderDataVariableName} = ${JSON.stringify(loaderData)}` },
    })
  }

  const meta = serverModule.meta
  if (typeof meta === 'function' && meta) {
    pageAttrs.meta = await meta({
      loaderData,
    })
  }

  return async () => {
    if (!clientModule.Page) {
      return ''
    }
    const Page = clientModule.Page
    return ReactDOMServer.renderToString(<Page loaderData={loaderData} />)
  }
}

export const hyperRouteHandler = async (route: HyperRuntimeRoute, app: HyperApp, event: H3Event) => {
  let render, htmlContent

  const pageAttrs: PageAttrs = { scripts: [], links: [], meta: {} }

  htmlContent = await app.transformHTML(template, event)
  render = await renderSSR(route, pageAttrs, event)

  const appHtml = await render()
  let html = htmlContent.replace(`<!--ssr-outlet-->`, appHtml)

  if (route.filePath) {
    pageAttrs.scripts.push({
      type: 'module',
      src: joinURL('/_hyper', route.filePath.replace(process.cwd(), '/')),
    })
  }

  if (route.manifestData?.css) {
    route.manifestData?.css.map((href) => {
      pageAttrs.links.push({
        href,
        rel: 'stylesheet',
        type: 'text/css',
      })
    })
  }

  html = attachPageAttrs(html, pageAttrs)
  return html
}

export const bootstrapH3Server = (app: HyperApp) => {
  app.h3.use(
    eventHandler(async (event) => {
      const pathname = getRequestURL(event).pathname
      const route = app.routes.lookup(pathname)
      if (route) {
        return hyperRouteHandler(route, app, event)
      }
    })
  )

  app.h3.use(
    '/api',
    eventHandler(async (event) => {
      const { page } = await getValidatedQuery<{ page: string }>(event, (data) => {
        const page = (data as { page: string }).page

        return new Promise((resolve, reject) => {
          if (page && (app.routes.lookup(page) || app.thirdPartyRoutesArray.find((route) => route.URL === page))) resolve({ page })
          else {
            reject('page path is not valid!')
          }
        })
      })
      let pageInfo = app.routes.lookup(page)
      if (!pageInfo) {
        const matchedRoute = app.thirdPartyRoutesArray.find((route) => route.URL === page)
        if (matchedRoute) {
          pageInfo = matchedRoute! as HyperRuntimeRoute
        }
      }

      const serverModule = await pageInfo?.serverBundle()

      if (event.method === 'POST' && serverModule) {
        const action = serverModule.action
        if (action) {
          try {
            return await action(await parseBody(event), event)
          } catch (err) {
            return
          }
        }
      } else if (event.method === 'GET' && serverModule && serverModule.loader) {
        const loader = serverModule.loader

        return loader(event)
      }
      return {}
    })
  )
}
