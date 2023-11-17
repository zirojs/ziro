import { loadConfig } from 'c12'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
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

  // build config file
  await build({
    bundle: true,
    entryPoints: [joinURL(process.cwd(), 'hyper.config.js')],
    // outdir: joinURL(process.cwd(), '.hyper/'),
    outfile: joinURL(process.cwd(), '.hyper/', 'hyper.config.js'),
    minify: true,
    target: 'esnext',
    jsx: 'automatic',
    platform: 'neutral',
    plugins: [polyfillNode()],
  })
}
