import { H3Event, getRequestHeaders, getRequestHost, getRequestProtocol, readBody } from 'h3'

export function createFetchRequest(event: H3Event) {
  let origin = `${getRequestProtocol(event)}://${getRequestHost(event)}`
  // Note: This had to take originalUrl into account for presumably vite's proxying
  let url = new URL(event.node.req.originalUrl || event.node.req.url!, origin)

  let controller = new AbortController()
  event.node.req.on('close', () => controller.abort())

  let headers = new Headers()

  for (let [key, values] of Object.entries(getRequestHeaders(event))) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value)
        }
      } else {
        headers.set(key, values)
      }
    }
  }

  let init: any = {
    method: event.node.req.method,
    headers,
    signal: controller.signal,
  }

  if (event.node.req.method !== 'GET' && event.node.req.method !== 'HEAD') {
    init.body = readBody(event)
  }

  return new Request(url.href, init)
}
