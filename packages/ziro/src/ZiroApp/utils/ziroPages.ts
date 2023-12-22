import { joinURL } from 'ufo'
import { namedRouteRegex, namedWildcardRouteRegex, rootRegex } from '../lib/pathGenerator'

export const isZiroPage = (pagePath: string) => {
  return pagePath.includes(joinURL('pages', '/')) && /\.(js|mjs|jsx|ts|tsx)$/.test(pagePath) && (namedRouteRegex.test(pagePath) || namedWildcardRouteRegex.test(pagePath) || rootRegex.test(pagePath))
}

export const generateBuildDirectoryFromFilename = (filename: string) => {
  return filename
    .replace(process.cwd() + '/', '')
    .split('/')
    .slice(0, -1)
    .join('/')
}

export const getFilename = (filename: string, extension?: string) => {
  if (!extension) return filename.split('/').slice(-1).join('/')
  return filename.split('/').slice(-1).join('/').split('.')[0] + '.' + extension
}
