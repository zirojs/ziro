import babel from '@babel/core'
import { glob } from 'glob'
import { joinURL } from 'ufo'
import { build } from 'vite'
import { extend } from '../../utils/extendObject'
import { generateBuildDirectoryFromFilename, isHyperPage } from '../../utils/hyperPages'
import { hyperBabelClientBundle } from '../babel-plugins/client-bundle'
import { defaultBuildConfig } from '../build'

export const buildClientHydration = async () => {
  return build(
    extend(defaultBuildConfig, {
      build: {
        outDir: '.hyper/client-bundles',
        rollupOptions: {
          input: await glob(joinURL(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' }),
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
}
