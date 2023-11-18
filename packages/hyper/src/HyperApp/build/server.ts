import babel from '@babel/core'
import { glob } from 'glob'
import { joinURL } from 'ufo'
import { build } from 'vite'
import { defaultBuildConfig } from '.'
import { HyperApp } from '../hyperApp'
import { extend } from '../utils/extendObject'
import { generateBuildDirectoryFromFilename, isHyperPage } from '../utils/hyperPages'
import { hyperBabelClientBundle } from './babel-plugins/client-bundle'
import { hyperBabelServerBundle } from './babel-plugins/server-bundle'

const minify = true

export const buildServerBundles = async (app: HyperApp) => {
  const pluginsFiles = app.thirdPartyRoutesArray.map((route) => route.filePath)

  await build(
    extend(defaultBuildConfig, {
      build: {
        ssr: true,
        minify,
        outDir: '.hyper/server-bundles',
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
          name: 'hyper/server/transform-client-bundles',
          enforce: 'pre',
          transform(code, id) {
            let clientBundle = code
            if (isHyperPage(id)) {
              clientBundle = babel.transformSync(code, {
                filename: id,
                targets: {
                  esmodules: true,
                },
                presets: ['@babel/preset-typescript'],
                plugins: [hyperBabelClientBundle],
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
        outDir: '.hyper/server-bundles',
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
          name: 'hyper/server/transform-server-bundles',
          enforce: 'pre',
          transform(code, id) {
            let serverBundle = code

            if (isHyperPage(id)) {
              serverBundle = babel.transformSync(code, {
                filename: id,
                targets: {
                  esmodules: true,
                },
                presets: ['@babel/preset-typescript'],
                plugins: [hyperBabelServerBundle],
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
