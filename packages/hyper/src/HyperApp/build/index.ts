import { loadConfig } from 'c12'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { existsSync } from 'node:fs'
import { joinURL } from 'ufo'
import { InlineConfig } from 'vite'
import { Environment, HyperApp, HyperConfig, defaultHyperconfig } from '../hyperApp'
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

export const hyperBuild = async () => {
  const { config } = await loadConfig<Required<HyperConfig>>({
    name: 'hyper',
    defaultConfig: defaultHyperconfig,
    jitiOptions: {
      esmResolve: true,
    },
  })

  const app = new HyperApp(Environment.PRODUCTION, [])
  await app.installPlugins(config?.plugins || [])

  await buildClientHydration(app)
  await buildServerBundles(app)

  const configPath = joinURL(process.cwd(), 'hyper.config.js')
  const configOutFile = joinURL(process.cwd(), '.hyper/', 'hyper.config.mjs')

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
