import { loadConfig } from 'c12'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { existsSync } from 'node:fs'
import { joinURL } from 'ufo'
import { InlineConfig } from 'vite'
import { Environment, ZiroApp, ZiroConfig, ziroDefaultConfig } from '../ziro'
import { buildClientHydration } from './client'
import { buildServerBundles } from './server'
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

export const ziroBuild = async () => {
  const { config } = await loadConfig<Required<ZiroConfig>>({
    name: 'ziro',
    defaultConfig: ziroDefaultConfig,
    jitiOptions: {
      esmResolve: true,
    },
  })

  const app = new ZiroApp(Environment.PRODUCTION, [])
  await app.installPlugins(config?.plugins || [])

  await buildClientHydration(app)
  await buildServerBundles(app)

  const configPath = joinURL(process.cwd(), 'ziro.config.js')
  const configOutFile = joinURL(process.cwd(), '.ziro/', 'ziro.config.mjs')

  if (existsSync(configPath))
    await build({
      bundle: false,
      entryPoints: [configPath],
      outfile: configOutFile,
      minify: true,
      target: 'esnext',
      jsx: 'automatic',
      format: 'esm',
      platform: 'neutral',
      mainFields: ['main', 'module'],
      plugins: [polyfillNode()],
    })
}
