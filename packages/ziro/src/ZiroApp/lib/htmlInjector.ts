import React from 'react'
import ReactDOMServer from 'react-dom/server'

export type PageAttrs = {
  scripts: Record<string, any>[]
  links: Record<string, any>[]
  meta: Record<string, string>
}
export const attachPageAttrs = (html: string, pageAttrs: PageAttrs): string => {
  html = html.replace(
    `<!--ziro-links-->`,
    ReactDOMServer.renderToString(
      React.createElement(
        React.Fragment,
        {},
        pageAttrs.links.map((link, id) => {
          return React.createElement('link', { key: id, ...link })
        })
      )
    )
  )
  html = html.replace(
    `<!--ziro-scripts-->`,
    ReactDOMServer.renderToString(
      React.createElement(
        React.Fragment,
        {},
        pageAttrs.scripts.map((script, id) => {
          return React.createElement('script', { key: id, ...script })
        })
      )
    )
  )
  html = html.replace(
    `<!--ziro-meta-->`,
    ReactDOMServer.renderToString(
      React.createElement(
        React.Fragment,
        {},
        Object.keys(pageAttrs.meta).map((name) => {
          if (name === 'title') return React.createElement('title', { key: name }, pageAttrs.meta[name])
          return React.createElement('meta', { key: name, content: pageAttrs.meta[name] })
        })
      )
    )
  )
  return html
}
