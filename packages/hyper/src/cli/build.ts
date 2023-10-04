import { InlineConfig } from 'vite'
import { buildClientHydration } from './build/client'
import { buildServerBundles } from './build/server'

export const defaultBuildConfig: InlineConfig = {
  root: process.cwd(),
  define: {
    process: {
      env: {
        NODE_ENV: 'production',
      },
    },
  },
  build: {
    manifest: true,
    minify: true,
    emptyOutDir: false,
  },
}

export const hyperBuild = async () => {
  await Promise.all([buildClientHydration(), buildServerBundles()])
}
