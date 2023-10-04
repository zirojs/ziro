import { transformSync as babelTranform } from '@babel/core'
import chalk from 'chalk'
import { buildSync } from 'esbuild'
import { rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { joinURL } from 'ufo'
import { readJsonFile } from '../server/lib/readJsonFile'

const serverBundlesDir = joinURL(process.cwd(), '.hyper', 'server-bundles')

let workerCode = `import { toWebHandler } from 'h3'
import { joinURL } from 'ufo'
import { bootstrapEdgeHyperApp } from 'hyper/dist/server/edge/index.mjs'


<--import-manifest-->
<--import-page-modules-->

const webHandler = toWebHandler(bootstrapEdgeHyperApp(routes))

export default {
  async fetch(request: any, env: any, ctx: any) {
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
}`

const saveWorkerCode = (code: string, destination: string) => {
  return writeFileSync(destination, code, {
    encoding: 'utf-8',
  })
}

export const generateWorkerCode = () => {
  console.log(chalk.yellow('Generating worker bundle...'))
  const routes = readJsonFile(joinURL(serverBundlesDir, 'manifest.json'))
  const importManifest = `const routes: Record<string, { file: string; module: any }> = await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', 'manifest.json'))})`
  let importPageModules = ``
  Object.keys(routes).forEach((key: string) => {
    importPageModules += `routes["${key}"].clientModule = await import(${JSON.stringify(joinURL(process.cwd(), '.hyper', 'server-bundles', routes[key].file))});\n`
  })

  workerCode = workerCode.replace('<--import-manifest-->', importManifest)
  workerCode = workerCode.replace('<--import-page-modules-->', importPageModules)

  const transformedCode = babelTranform(workerCode, {
    presets: ['@babel/preset-typescript'],
    filename: '_worker.ts',
  })
  if (transformedCode?.code) {
    const tmpWorker = joinURL(process.cwd(), '.hyper', '_worker.mjs')
    saveWorkerCode(transformedCode.code, tmpWorker)
    buildSync({
      entryPoints: [tmpWorker],
      minify: true,
      bundle: true,
      format: 'esm',
      outfile: joinURL(process.cwd(), '.hyper', '_worker.js'),
    })

    unlinkSync(tmpWorker)
    rmSync(serverBundlesDir, { recursive: true, force: true })
    console.log(chalk.green('✓') + chalk.yellow(' Worker bundle generated'))
  }
}
