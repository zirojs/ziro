import babel from '@babel/core'
import fs from 'fs'
import { glob } from 'glob'
import path from 'path'
import { joinURL } from 'ufo'
import { build } from 'vite'
import { extend } from '../../utils/extendObject'
import { generateBuildDirectoryFromFilename, getFilename, isHyperPage } from '../../utils/hyperPages'
import { removeUnusedImports } from '../babel-plugins/remove-unused-imports'
import { hyperBabelServerBundle } from '../babel-plugins/server-bundle'
import { defaultBuildConfig } from '../build'

export const buildServerBundles = async () => {
  return build(
    extend(defaultBuildConfig, {
      build: {
        ssr: true,
        // ssrEmitAssets: true,
        outDir: '.hyper/server-bundles',
        rollupOptions: {
          input: await glob(path.resolve(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' }),
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
          name: 'transform-client-bundles',
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
                plugins: [],
              })?.code!

              const serverBundle = babel.transformSync(code, {
                filename: id,
                targets: {
                  esmodules: true,
                },
                presets: ['@babel/preset-typescript'],
                plugins: [removeUnusedImports, hyperBabelServerBundle],
              })?.code!
              fs.mkdirSync(joinURL('.hyper/server-bundles', generateBuildDirectoryFromFilename(id)), { recursive: true })
              fs.writeFileSync(joinURL('.hyper/server-bundles', generateBuildDirectoryFromFilename(id), getFilename(id)), serverBundle, { encoding: 'utf-8' })
            }
            return {
              code: clientBundle,
            }
          },
        },
      ],
    })
  )
}
