import { joinURL } from 'ufo'
import { namedRouteRegex, namedWildcardRouteRegex, rootRegex } from '../../lib/pathGenerator'

export const pathGenerator = (directories: Record<string, string[]>) => {
  // This function generates radix3 compatible route paths based on file system
  // The file system rules follows as bellow

  const paths: Record<string, string> = {}
  Object.keys(directories).forEach((dirPath) => {
    directories[dirPath].map((filename) => {
      const dirPrettyPath = dirPath.replace(joinURL('/pages'), '')
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
