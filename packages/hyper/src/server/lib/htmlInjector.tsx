import ReactDOMServer from 'react-dom/server'

export type PageAttrs = {
  scripts: Record<string, any>[]
  links: Record<string, any>[]
  meta: Record<string, string>
}
export const attachPageAttrs = (html: string, pageAttrs: PageAttrs): string => {
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
  html = html.replace(
    `<!--hyper-meta-->`,
    ReactDOMServer.renderToString(
      <>
        {Object.keys(pageAttrs.meta).map((name) => {
          if (name === 'title') return <title key={name}>{pageAttrs.meta[name]}</title>
          return <meta key={name} content={pageAttrs.meta[name]} />
        })}
      </>
    )
  )
  return html
}
