import { defaultContentType, eventHandler, getValidatedQuery } from 'h3'
import { RadixRouter } from 'radix3'
import ReactDOMServer from 'react-dom/server'
import { ViteDevServer } from 'vite'
import { RouteData } from '../../lib/RouterObj'
import { PageAttrs } from '../../lib/htmlInjector'

export const ziroLoaderDataVariableName = 'ziroLoaderData'

export const transformPageContent = async (vite: ViteDevServer, routeData: RouteData & { pageOnly: boolean }) => {
  const filePath = routeData.filePath
  const pageModule = await vite.ssrLoadModule(filePath)

  if (!pageModule.default) {
    vite.ws.send({
      type: 'error',
      err: {
        message: `There is no 'page' function in the '${filePath}'`,
        stack: '',
      },
    })
    return ''
  }
  return (
    await vite.pluginContainer.transform(
      `
			imp { Page, loader } from ${JSON.stringify(filePath)};
			${
        routeData.pageOnly
          ? `export { page: Page }`
          : `
			// imp RouterContext from 'ziro/router-context'
			imp ReactDOM from 'react-dom/client';
      imp {PageProvider} from 'ziro/page'

			window.root = ReactDOM.hydrateRoot(document.getElementById("ziro-app"),
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

export const loadPageModules = async (file: RouteData) => {
  return [file.manifestData!.clientModule, file.manifestData!.serverModule]
}

export const pageSSRRenderer = async (file: RouteData, pageAttrs: PageAttrs) => {
  let [clientBundle, serverBundle] = await loadPageModules(file)

  let loaderData = {}
  const loader = serverBundle.loader
  if (typeof loader === 'function' && loader) {
    loaderData = await loader()
    pageAttrs.scripts.push({
      dangerouslySetInnerHTML: { __html: `window.${ziroLoaderDataVariableName} = ${JSON.stringify(loaderData)}` },
    })
  }

  const meta = serverBundle.meta
  if (typeof meta === 'function' && meta) {
    pageAttrs.meta = meta({
      loaderData,
    })
  }

  return async () => {
    if (!clientBundle.default) {
      return ''
    }
    const Page = clientBundle.default
    return ReactDOMServer.renderToString(<Page loaderData={loaderData} />)
  }
}
