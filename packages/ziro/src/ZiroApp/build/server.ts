import babel from '@babel/core'
import { glob } from 'glob'
import { joinURL } from 'ufo'
import { build } from 'vite'
import { defaultBuildConfig } from '.'
import { extend } from '../utils/extendObject'
import { generateBuildDirectoryFromFilename, isZiroPage } from '../utils/ziroPages'
import { ZiroApp } from '../ziro'
import { ziroBabelClientBundle } from './babel-plugins/client-bundle'
import { ziroBabelServerBundle } from './babel-plugins/server-bundle'

const minify = true

export const buildServerBundles = async (app: ZiroApp) => {
  const pluginsFiles = app.thirdPartyRoutesArray.map((route) => route.filePath).filter((d) => !!d) as []

  await build(
    extend(defaultBuildConfig, {
      build: {
        manifest: true,
        ssr: true,
        minify,
        outDir: '.ziro/server-bundles',
        rollupOptions: {
          input: [...(await glob(joinURL(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' })), ...pluginsFiles],
          output: {
            entryFileNames(chunkInfo) {
              if (chunkInfo.facadeModuleId?.startsWith(joinURL(process.cwd(), 'pages'))) {
                return joinURL(generateBuildDirectoryFromFilename(chunkInfo.facadeModuleId), `${chunkInfo.name}.mjs`)
              }
              return `${chunkInfo.name}.mjs`
            },
          },
        },
      },
      plugins: [
        {
          name: 'ziro/server/transform-client-bundles',
          enforce: 'pre',
          transform(code, id) {
            let clientBundle = code
            if (isZiroPage(id)) {
              clientBundle = babel.transformSync(code, {
                filename: id,
                targets: {
                  esmodules: true,
                },
                presets: ['@babel/preset-typescript'],
                plugins: [ziroBabelClientBundle],
              })?.code!
            }
            return {
              code: clientBundle,
            }
          },
        },
      ],
    })
  )

  await build(
    extend(defaultBuildConfig, {
      build: {
        manifest: false,
        minify,
        ssrEmitAssets: true,
        ssr: true,
        outDir: '.ziro/server-bundles',
        rollupOptions: {
          input: [...(await glob(joinURL(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' })), ...pluginsFiles],
          output: {
            entryFileNames(chunkInfo) {
              if (chunkInfo.facadeModuleId?.startsWith(joinURL(process.cwd(), 'pages'))) {
                return joinURL(generateBuildDirectoryFromFilename(chunkInfo.facadeModuleId), `server.${chunkInfo.name}.mjs`)
              }
              return `server.${chunkInfo.name}.mjs`
            },
          },
        },
      },
      plugins: [
        {
          name: 'ziro/server/transform-server-bundles',
          enforce: 'pre',
          transform(code, id) {
            let serverBundle = code

            if (isZiroPage(id)) {
              serverBundle = babel.transformSync(code, {
                filename: id,
                targets: {
                  esmodules: true,
                },
                presets: ['@babel/preset-typescript'],
                plugins: [ziroBabelServerBundle],
              })?.code!
            }
            return {
              code: serverBundle,
            }
          },
        },
      ],
    })
  )
}
