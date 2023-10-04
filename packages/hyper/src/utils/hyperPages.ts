import { joinURL } from 'ufo'

export const isHyperPage = (pagePath: string) => {
  return pagePath.startsWith(joinURL(process.cwd(), 'pages')) && /\.(js|mjs|jsx|ts|tsx)$/.test(pagePath)
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
