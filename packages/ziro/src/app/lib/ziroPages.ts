import glob from 'fast-glob'
import { joinURL } from 'ufo'
import { namedRouteRegex, namedWildcardRouteRegex, rootRegex } from './pathGenerator'

export const isZiroPage = (pagePath: string) => {
  return pagePath.includes(joinURL('pages', '/')) && /\.(js|mjs|jsx|ts|tsx)$/.test(pagePath) && (namedRouteRegex.test(pagePath) || namedWildcardRouteRegex.test(pagePath) || rootRegex.test(pagePath))
}

export const findAllPages = async (basePath: string) => {
  return (await glob(joinURL(basePath, '/pages/**/*.{tsx,jsx}'))).filter((page) => isZiroPage(page))
}

export const normalizePagePath = (fileFullPath: string) => {
  return fileFullPath.replaceAll(joinURL(process.cwd(), 'pages'), '')
}

export const generateBuildDirectoryFromFilename = (filename: string) => {
  return filename.replace(`${process.cwd()}/`, '').split('/').slice(0, -1).join('/')
}

export const getFilename = (filename: string, extension?: string) => {
  if (!extension) return filename.split('/').slice(-1).join('/')
  return `${filename.split('/').slice(-1).join('/').split('.')[0]}.${extension}`
}

const patterns = [
  {
    pattern: rootRegex,
    toTanstackRoute: (normalizedFilePath: string) => {
      const matches = normalizedFilePath.match(rootRegex)
      if (matches) return normalizedFilePath.substring(0, normalizedFilePath.indexOf(matches[0]))
    },
    toH3Route: (normalizedFilePath: string) => {
      const matches = normalizedFilePath.match(rootRegex)
      if (matches) return normalizedFilePath.substring(0, normalizedFilePath.indexOf(matches[0]))
    },
  },
  {
    pattern: namedRouteRegex,
    toTanstackRoute: (normalizedFilePath: string) => {
      const matches = normalizedFilePath.match(namedRouteRegex)
      if (matches) return joinURL(normalizedFilePath.substring(0, normalizedFilePath.indexOf(matches[0])), `$${matches[1]}`)
    },
    toH3Route: (normalizedFilePath: string) => {
      const matches = normalizedFilePath.match(namedRouteRegex)
      if (matches) return joinURL(normalizedFilePath.substring(0, normalizedFilePath.indexOf(matches[0])), `:${matches[1]}`)
    },
  },
  {
    pattern: namedWildcardRouteRegex,
    toTanstackRoute: (normalizePagePath: string) => {
      const matches = normalizePagePath.match(namedWildcardRouteRegex)
      if (matches) return joinURL(normalizePagePath.substring(0, normalizePagePath.indexOf(matches[0])), '$')
    },
    toH3Route: (normalizePagePath: string) => {
      const matches = normalizePagePath.match(namedWildcardRouteRegex)
      const groups = namedWildcardRouteRegex.exec(normalizePagePath)
      if (matches) return joinURL(normalizePagePath.substring(0, normalizePagePath.indexOf(matches[0])), `**:${matches[2]}`)
    },
  },
]

export const getRoutePattern = (filePath: string) => {
  const pattern = patterns.find((pattern) => {
    return pattern.pattern.test(normalizePagePath(filePath))
  })

  if (!pattern)
    return {
      pattern: filePath,
      toTanstackRoute: (path: string) => path,
      toH3Route: (path: string) => path,
    }

  return pattern
}

export const genRoutePath = (filePath: string) => {
  return getRoutePattern(filePath)?.toTanstackRoute(normalizePagePath(filePath)) || '/'
}

export const h3ToTanstack = (routeSegment: string) => {
  routeSegment = routeSegment.replace('**:(.*)', '$')
  const regex = /\:(.*)/i
  if (regex.test(routeSegment)) {
    routeSegment = routeSegment.replace(':', '$')
  }
  return routeSegment
}

export const getRouteImportName = (filePath: string) => {
  return filePath.replaceAll('/', '_').replace('...', '__').replaceAll('[', '_').replaceAll(']', '_').replaceAll('.', '__')
}
