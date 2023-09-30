import { join } from 'node:path'

export const isHyperPage = (pagePath: string) => {
  return pagePath.startsWith(join(process.cwd(), 'pages'))
}

export const generateBuildDirectoryFromFilename = (filename: string) => {
  return filename
    .replace(process.cwd() + '/', '')
    .split('/')
    .slice(0, -1)
    .join('/')
}

export const getFilename = (filename: string) => {
  return filename.split('/').slice(-1).join('/')
}
