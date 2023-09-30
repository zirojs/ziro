import { defaultContentType, eventHandler, getValidatedQuery } from 'h3'
import path from 'node:path'
import { RadixRouter } from 'radix3'
import ReactDOMServer from 'react-dom/server'
import { ViteDevServer } from 'vite'
import { DEV_ENV } from '../../cli/dev'
import { PageAttrs, RouteData } from './fsRouteWatcher'

export const hyperLoaderDataVariableName = 'hyperLoaderData'

export const transformPageContent = async (vite: ViteDevServer, routeData: RouteData & { pageOnly: boolean }) => {
  const filePath = routeData.filePath
  const pageModule = await vite.ssrLoadModule(filePath)

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
			imp { page as Page, loader } from ${JSON.stringify(filePath)};
			${
        routeData.pageOnly
          ? `export { page: Page }`
          : `
			// imp RouterContext from 'hyper/router-context'
			imp ReactDOM from 'react-dom/client';
      imp {PageProvider} from 'hyper/page'

			window.root = ReactDOM.hydrateRoot(document.getElementById("hyper-app"),
			// <RouterContext>{
				<PageProvider>
					<Page />
				</PageProvider>
			// }</RouterContext>

			)

			`
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

export const loadPageModules = async (filePath: string, vite: ViteDevServer | null) => {
  if (process.env.NODE_ENV === DEV_ENV && vite !== null) {
    return await vite.ssrLoadModule(filePath)
  } else {
    return await import(/* @vite-ignore */ path.join(process.cwd(), '.hyper', 'server-bundles', filePath))
  }
}

export const pageSSRRenderer = async (vite: ViteDevServer | null, filePath: string, pageAttrs: PageAttrs) => {
  let pageModule = await loadPageModules(filePath, vite)

  let loaderData = {}
  const loader = pageModule.loader
  if (loader) {
    loaderData = await loader()
    pageAttrs.scripts.push({
      dangerouslySetInnerHTML: { __html: `window.${hyperLoaderDataVariableName} = ${JSON.stringify(loaderData)}` },
    })
  }

  return async () => {
    if (!pageModule.page) {
      return ''
    }
    const Page = pageModule.page
    return ReactDOMServer.renderToString(<Page loaderData={loaderData} />)
  }
}
