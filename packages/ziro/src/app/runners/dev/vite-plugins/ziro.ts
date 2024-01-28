import babel from '@babel/core'
import { joinURL } from 'ufo'
import { Plugin, ViteDevServer } from 'vite'
import { ziroBabelClientBundle } from '../../../build/babel-plugins/client-bundle'
import { isZiroPage } from '../../../lib/ziroPages'
import { onZiroConfigChanges } from '../../dev'
import { ziroConfigPath } from '../load-config'
import { generateRouterCode } from './router/router'

export const ziro = (): Plugin => {
  const ziroEntryVirtualModuleId = '/@ziro-entry'
  const ziroRouterVirtualModuleId = '/@ziro-router'

  const onConfigChanges = async () => {
    console.clear()
    console.info('Config has changed, restarting server...')
    await onZiroConfigChanges()
  }

  let viteDevServer: ViteDevServer | null = null
  return {
    name: 'ziro',
    enforce: 'pre',
    async watchChange(id, change) {
      // TODO: on rename ziro config file is not working
      if (id === ziroConfigPath) await onConfigChanges()
    },
    async handleHotUpdate({ server: vite, file }) {
      console.log(file)
      const configModule = vite.moduleGraph.getModuleById(ziroConfigPath)
      let isConfigChanged = false
      if (configModule?.ssrImportedModules)
        for (const m of configModule?.ssrImportedModules) {
          if (m.file === file) isConfigChanged = true
        }
      if (isConfigChanged) {
        vite.moduleGraph.onFileChange(ziroConfigPath)
        await onConfigChanges()
        return []
      }
    },
    resolveId(id) {
      if (id === ziroEntryVirtualModuleId || id === ziroRouterVirtualModuleId) {
        return id
      }
    },
    configureServer(server) {
      viteDevServer = server
    },
    async load(id) {
      if (id === ziroEntryVirtualModuleId && viteDevServer) {
        // generate router code here
        const code = `import * as React from 'react'
						import ReactDOM from 'react-dom/client'
						import { createRouter } from '/@ziro-router';
						import { StartClient, DehydrateRouter } from 'ziro/router'

						const router = createRouter()
						router.hydrate()

						ReactDOM.hydrateRoot(document.getElementById("ziro-app"),
								React.createElement(StartClient, { router })
						)`
        return code
      }
      if (id === ziroRouterVirtualModuleId) {
        return await generateRouterCode(joinURL(process.cwd() ?? ''))
      }
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module', src: ziroEntryVirtualModuleId },
          injectTo: 'body',
        },
      ]
    },
    transform(code, id, options = { ssr: false }) {
      if (isZiroPage(id) && !options.ssr) {
        const output = babel.transformSync(code, {
          filename: id,
          targets: {
            esmodules: true,
          },
          presets: ['@babel/preset-typescript'],
          plugins: [ziroBabelClientBundle],
        })
        if (output) {
          return output.code
        }
        return code
      }
      return code
    },
  }
}
