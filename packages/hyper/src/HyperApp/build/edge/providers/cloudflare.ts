import { transformSync as babelTranform } from '@babel/core'
import chalk from 'chalk'
import { Plugin, build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { joinURL } from 'ufo'
import { readJsonFile } from '../../../../server/lib/readJsonFile'
import { EdgeProvider } from './interface'

let workerCode = `import { toWebHandler } from 'h3'
import { HyperEdgeRunner } from 'hyper/src/HyperApp/runners/edge'
import { joinURL } from 'ufo'

const config = await import('./hyper.config.mjs')
--manifest

console.log(manifest)

const webHandler = toWebHandler(await HyperEdgeRunner(config, manifest))

export default {
  async fetch(request /*: any, env: any, ctx: any*/) {
    const thisUrl = new URL(request.url)
    const pathName = thisUrl.pathname
    if (pathName.startsWith('/_hyper/')) {
      thisUrl.pathname = pathName.replace('/_hyper', './client-bundles')
      const newRequest = new Request(thisUrl.toString(), new Request(request, {}))
      return env.ASSETS.fetch(newRequest)
    }
    return webHandler(request, {
      cloudflare: { env, ctx },
    })
  },
}
`

let htmlLoaderPlugin: Plugin = {
  name: 'htmlLoader',
  setup(build) {
    // Load ".txt" files and return an array of words
    build.onLoad({ filter: /\.html/ }, async (args) => {
      let text = await readFileSync(args.path, 'utf8')
      return {
        contents: JSON.stringify(text.split(/\s+/)),
        loader: 'json',
      }
    })
  },
}

const saveWorkerCode = (code: string, destination: string) => {
  return writeFileSync(destination, code, {
    encoding: 'utf-8',
  })
}

export class Cloudflare implements EdgeProvider {
  private serverBundlesDir: string

  constructor(serverBundlesDir: string) {
    this.serverBundlesDir = serverBundlesDir
  }
  async generate() {
    console.log(chalk.yellow('Generating worker bundle...'))
    const manifest = readJsonFile(joinURL(this.serverBundlesDir, 'manifest.json'))

    let parsedStrings = ''
    Object.keys(manifest).forEach((key) => {
      const entry = manifest[key]
      if (entry.isEntry) {
        const pathSplit = entry.file.split('/')
        pathSplit[pathSplit.length - 1] = 'server.' + pathSplit[pathSplit.length - 1]
        parsedStrings += `
				manifest[${JSON.stringify(key)}].clientBundle = async () => await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', entry.file))})
				manifest[${JSON.stringify(key)}].serverBundle = async () => await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', pathSplit.join('/')))})
				`
      }
    })
    // const routes = readJsonFile(joinURL(this.serverBundlesDir, 'manifest.json'))
    // const importManifest = `const routes: Record<string, { file: string; module: any }> = await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', 'manifest.json'))})`
    // let importPageModules = ``
    // Object.keys(routes).forEach((key: string) => {
    //   if (isHyperPage(routes[key].file)) {
    //     importPageModules += `routes["${key}"].clientModule = await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', routes[key].file))});\n`
    //     const serverPage = routes[key].file.split('/')
    //     serverPage[serverPage.length - 1] = 'server.' + serverPage[serverPage.length - 1]
    //     importPageModules += `routes["${key}"].serverModule = await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', serverPage.join('/')))});\n`
    //   }
    // })

    workerCode = workerCode.replace(
      '--manifest',
      `const manifest = await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', 'manifest.json'))})

		${parsedStrings}`
    )

    console.log(workerCode)

    const transformedCode = babelTranform(workerCode, {
      presets: ['@babel/preset-typescript'],
      filename: '_worker.ts',
    })
    if (transformedCode?.code) {
      const tmpWorker = joinURL(process.cwd(), '.hyper', '_worker.mjs')
      saveWorkerCode(transformedCode.code, tmpWorker)
      await build({
        entryPoints: [tmpWorker],
        minify: false,
        bundle: true,
        format: 'esm',
        outfile: joinURL(process.cwd(), '.hyper', '_worker.js'),
        plugins: [polyfillNode(), htmlLoaderPlugin],
      })

      unlinkSync(tmpWorker)
      // rmSync(serverBundlesDir, { recursive: true, force: true })
      console.log(chalk.green('✓') + chalk.yellow(' Worker bundle generated'))
    }
  }
}
