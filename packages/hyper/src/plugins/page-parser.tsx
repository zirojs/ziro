import { UserConfig } from 'vite'

export function PageParser(config: UserConfig) {
  return {
    name: 'page-parser',
    transform(code: string, id: string) {
      return {
        code,
        map: null,
      }
    },
  }
}
