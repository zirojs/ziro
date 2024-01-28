import { createMemoryHistory } from '@tanstack/react-router'
import { StartServer, transformStreamWithRouter } from '@tanstack/react-router-server/server'
import { H3Event, createRouter, eventHandler, getHeader, getRequestURL, getRouterParams, setHeader, setResponseStatus } from 'h3'
import isbot from 'isbot'
import React, { FC, PropsWithChildren } from 'react'
import ReactDOMServer, { PipeableStream } from 'react-dom/server'
import { joinURL } from 'ufo'
import { ZiroApp } from '.'
import { attachPageAttrs, generateMetaSSR } from './lib/htmlInjector'
import { parseBody } from './lib/parseBody'
import { generateServerRouter, getCurrentRouteLoaderData } from './router/server'
import { ZiroRuntimeRoute } from './ziro-types'
const h = React.createElement
export type PageAttrs = {
  scripts: Record<string, any>[]
  links: Record<string, any>[]
  meta: Record<string, string>
}

export const ziroLoaderDataVariableName = 'ziroLoaderData'

export const renderSSR = async (app: ZiroApp, route: ZiroRuntimeRoute, pageAttrs: PageAttrs, event: H3Event) => {
  const clientModule = await route.clientBundle()
  // console.log(getRequestURL(event), clientModule);
  return async (template: (loaderData: any) => Promise<FC<PropsWithChildren>>) => {
    if (!clientModule.default) {
      return ''
    }

    const router = await generateServerRouter(app, event)

    const memoryHistory = createMemoryHistory({
      initialEntries: [getRequestURL(event).pathname],
    })

    router.update({
      history: memoryHistory,
    })

    await router.load()

    const loaderData = getCurrentRouteLoaderData(event, router)
    const Root = await template(loaderData)

    let didError = false

    const callbackName = isbot(getHeader(event, 'user-agent')) ? 'onAllReady' : 'onShellReady'

    let stream!: PipeableStream
    await new Promise<void>((resolve) => {
      stream = ReactDOMServer.renderToPipeableStream(React.createElement(Root, {}, React.createElement(StartServer, { router })), {
        [callbackName]: () => {
          setResponseStatus(event, didError ? 500 : 200)
          setHeader(event, 'Content-Type', 'text/html')
          resolve()
        },
        onError: (err) => {
          didError = true
          console.log(err)
        },
      })
    })

    const transforms = [transformStreamWithRouter(router)]
    const transformedStream = transforms.reduce((stream, transform) => stream.pipe(transform as any), stream)
    transformedStream.pipe(event.node.res)
    // return transformedStream
    // return sendStream(event, transformedStream.pipe(event.node.res))
    // Render the app
    // return ReactDOMServer.renderToString(React.createElement(StartServer, { router }))
    // return ReactDOMServer.renderToString(React.createElement(Page ))
  }
}

export const ziroRouteHandler = async (route: ZiroRuntimeRoute, app: ZiroApp, event: H3Event) => {
  const pageAttrs: PageAttrs = { scripts: [], links: [], meta: {} }

  const meta = (await route.serverBundle()).meta
  const injectedTags = attachPageAttrs(pageAttrs)
  const template = async (loaderData: any) => {
    const metaTags = meta ? generateMetaSSR(await meta({ loaderData })) : null
    const component: FC<PropsWithChildren> = ({ children }) =>
      h('html', {
        children: [
          h('head', {
            children: [
              h('script', {
                type: 'module',
                src: '/@vite/client',
              }),
              h('meta', {
                charSet: 'UTF-8',
              }),
              h('meta', {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1.0',
              }),
              h('script', {
                type: 'module',
                dangerouslySetInnerHTML: {
                  __html: `
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`,
                },
              }),
              metaTags,
              ...injectedTags.meta,
              ...injectedTags.scripts,
              ...injectedTags.links,
            ],
          }),
          h('body', {
            children: [
              h('div', {
                id: 'ziro-app',
                children,
              }),
              h('script', {
                type: 'module',
                src: '/@ziro-entry',
              }),
            ],
          }),
        ],
      })
    return component
  }

  await (
    await renderSSR(app, route, pageAttrs, event)
  )(template)
}

export const bootstrapH3Server = (app: ZiroApp) => {
  app.h3.use(
    eventHandler(async (event) => {
      const pathname = getRequestURL(event).pathname
      const route = app.routes.lookup(pathname)
      if (route) {
        return ziroRouteHandler(route, app, event)
      }
    })
  )
  const router = createRouter()
  app.h3.use(router)

  const loaderApi = eventHandler(async (event) => {
    const page = await findPage(event, app)
    const serverModule = await page?.serverBundle()
    if (serverModule && serverModule.loader) {
      const loader = serverModule.loader
      return loader(event, page?.pluginContext?.context)
    }
  })
  const actionApi = eventHandler(async (event) => {
    const page = await findPage(event, app)
    const serverModule = await page?.serverBundle()
    if (serverModule && serverModule.action) {
      const action = serverModule.action

      if (action) {
        try {
          return await action(await parseBody(event), event, page?.pluginContext?.context)
        } catch (err) {}
      }
    }
  })
  router.get('/api/', loaderApi).get('/api/**:page', loaderApi)
  router.post('/api/', actionApi).post('/api/**:page', actionApi)
}

const findPage = async (event: H3Event, app: ZiroApp) => {
  let page = getRouterParams(event).page
  const pathname = getRequestURL(event).pathname.replace('/api', '')
  if (!page && pathname === '/') page = pathname
  if (page) {
    let pageInfo = app.routes.lookup(joinURL('/', page))
    return pageInfo
  }
}
