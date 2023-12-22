import babel from '@babel/core'
import { glob } from 'glob'
import { joinURL } from 'ufo'
import { build } from 'vite'
import { defaultBuildConfig } from '.'
import { extend } from '../utils/extendObject'
import { generateBuildDirectoryFromFilename, isZiroPage } from '../utils/ziroPages'
import { ZiroApp } from '../ziro'
import { ziroBabelClientBundle } from './babel-plugins/client-bundle'

export const buildClientHydration = async (app: ZiroApp) => {
  const pluginsFiles = app.thirdPartyRoutesArray.map((route) => route.filePath).filter((d) => !!d) as string[]

  await build(
    extend(defaultBuildConfig, {
      build: {
        manifest: true,
        outDir: '.ziro/client-bundles',
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
          name: 'ziro/client/transform-client-bundles',
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
}
