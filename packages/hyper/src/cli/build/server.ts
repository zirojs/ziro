import babel from '@babel/core'
import { glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'
import { extend } from '../../utils/extendObject'
import { generateBuildDirectoryFromFilename, getFilename } from '../../utils/hyperPages'
import { removeUnusedImports } from '../babel-plugins/remove-unused-imports'
import { hyperBabelServerBundle } from '../babel-plugins/server-bundle'
import { defaultBuildConfig } from '../build'

export const buildServerBundles = async () => {
  return build(
    extend(defaultBuildConfig, {
      build: {
        ssr: true,
        outDir: '.hyper/server-bundles',
        rollupOptions: {
          input: await glob(path.resolve(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' }),
          output: {
            entryFileNames(chunkInfo) {
              if (chunkInfo.facadeModuleId?.startsWith(path.join(process.cwd(), 'pages'))) {
                return path.join(generateBuildDirectoryFromFilename(chunkInfo.facadeModuleId), `${chunkInfo.name}.mjs`)
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
            if (id.includes(process.cwd())) {
              let importAdded = false
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
              fs.mkdirSync(path.join('.hyper/server-bundles', generateBuildDirectoryFromFilename(id)), { recursive: true })
              fs.writeFileSync(path.join('.hyper/server-bundles', generateBuildDirectoryFromFilename(id), getFilename(id)), serverBundle, { encoding: 'utf-8' })
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
