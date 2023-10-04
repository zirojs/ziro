export type RouteData = {
  filePath: string
  manifestData?: {
    clientModule?: any
    serverModule?: any
    css?: string[]
    imports?: string[]
    file: string
    isEntry: boolean
    src: string
  }
}
