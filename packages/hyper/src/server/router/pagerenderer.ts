import ReactDOMServer from 'react-dom/server'
import { ViteDevServer } from 'vite'

export const pageRenderer = async (vite: ViteDevServer, path: string) => {
  const pageModule = await vite.ssrLoadModule(path)
  return () => ReactDOMServer.renderToString(pageModule.page())
}
