import fs from 'fs'
import { defaultContentType, eventHandler, getValidatedQuery } from 'h3'
import path from 'node:path'
import { join } from 'path'
import { RadixRouter } from 'radix3'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ViteDevServer } from 'vite'
import { DEV_ENV } from '../../cli/dev'
import { RouteData } from './fsRouteWatcher'

export const transformPageContent = async (vite: ViteDevServer, routeData: RouteData & { pageOnly: boolean }) => {
  const filePath = routeData.filePath
  const pageModule = await vite.ssrLoadModule(filePath)
  const hasLayout = fs.existsSync(join(process.cwd(), 'index.tsx'))

  if (!pageModule.page) {
    vite.ws.send({
      type: 'error',
      err: {
        message: `There is no 'page' function in the '${filePath.replaceAll(process.cwd() + '/', '')}'`,
        stack: '',
      },
    })
    return ''
  }
  return (
    await vite.pluginContainer.transform(
      `
			imp { page, loader } from ${JSON.stringify(filePath)};
			imp RouterContext from 'hyper/router-context'
			${hasLayout ? 'imp {layout as Layout} from "/index.tsx"' : ''}
			${
        routeData.pageOnly
          ? `export { page }`
          : `
			imp ReactDOM from 'react-dom/client';
			window.root = ReactDOM.hydrateRoot(document.getElementById("hyper-app"), <RouterContext>
			${hasLayout ? '<Layout>' : ''}
			{page()}
			${hasLayout ? '</Layout>' : ''}
			</RouterContext>)`
      }
			`.replaceAll('imp', 'import'),
      filePath
    )
  ).code
}

export type TransformRouteQueryParams = {
  page: string
  pageOnly: boolean
}

export const pageJsBundleHandler = (vite: ViteDevServer, router: RadixRouter<RouteData>) => {
  return eventHandler(async (e) => {
    const { page, pageOnly } = await getValidatedQuery<TransformRouteQueryParams>(e, (data) => {
      const page = (data as TransformRouteQueryParams).page
      const pageOnly = typeof (data as TransformRouteQueryParams).pageOnly !== 'undefined'
      return new Promise((resolve, reject) => {
        if (page && router.lookup(page)) resolve({ page, pageOnly })
        else {
          reject('page path is not valid!')
        }
      })
    })
    defaultContentType(e, 'text/javascript')
    return transformPageContent(vite, {
      ...router.lookup(page)!,
      pageOnly,
    })
  })
}

export const pageSSRRenderer = async (vite: ViteDevServer | null, filePath: string) => {
  let pageModule: any = null
  if (process.env.NODE_ENV === DEV_ENV && vite !== null) {
    pageModule = await vite.ssrLoadModule(filePath)
  } else {
    pageModule = await import(path.join(process.cwd(), '.hyper', 'server-bundles', filePath))
  }
  const hasLayout = fs.existsSync(join(process.cwd(), 'index.tsx'))
  let Layout = React.Fragment

  if (hasLayout && vite) {
    const content = (await vite.ssrLoadModule(join(process.cwd(), 'index.tsx'))).layout
    Layout = content.layout || React.Fragment
  }

  return async () => {
    if (!pageModule.page) {
      return ''
    }
    return ReactDOMServer.renderToString(<Layout>{pageModule.page()}</Layout>)
  }
}
