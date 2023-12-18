import { joinURL } from 'ufo'
import { DEV_ENV } from './constants'

// index.(.*)			 => / 			 	matches only root paths
// [slug].(.*) 		 => /:slug 		matches named routes (e.g. /a and /b, not /a/b).
// [..slug].(.*) 	 => /**:slug  named wild card route

// docs: https://github.com/unjs/radix3#usage

export const namedRouteRegex = /\[(?!\.\.\.)(.*)\]/s
export const namedWildcardRouteRegex = /\[(\.\.\.)(.*)\]/s
export const rootRegex = /index\.([a-zA-Z0-9]+$)/s

export const pathGenerator = (directories: Record<string, string[]>) => {
  // This function generates radix3 compatible route paths based on file system
  // The file system rules follows as bellow

  const paths: Record<string, string> = {}
  Object.keys(directories).forEach((dirPath) => {
    if (process.env.NODE_ENV === DEV_ENV && !dirPath.startsWith(joinURL(process.cwd(), '/pages'))) return

    directories[dirPath].map((filename) => {
      const dirPrettyPath = dirPath.replace(joinURL(process.cwd(), '/pages'), '')
      if (rootRegex.test(filename)) paths[joinURL(dirPrettyPath, '/')] = joinURL(dirPath, filename)
      if (namedRouteRegex.test(filename)) {
        const m = namedRouteRegex.exec(filename)
        const routeName = m?.[1]
        paths[joinURL(dirPrettyPath, `/:${routeName}`)] = joinURL(dirPath, filename)
      }
      if (namedWildcardRouteRegex.test(filename)) {
        const m = namedWildcardRouteRegex.exec(filename)
        const routeName = m?.[2]
        paths[joinURL(dirPrettyPath, `/**:${routeName}`)] = joinURL(dirPath, filename)
      }
    })
  })
  return paths
}
