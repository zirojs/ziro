#!/usr/bin/env node --no-warnings
import { Command } from 'commander'
import { Listener } from 'listhen'
import { debounce } from 'lodash-es'
import { ViteDevServer } from 'vite'
import pkgJson from '../package.json' assert { type: 'json' }

const program = new Command()
program.name(pkgJson.name).description('React SSR Framework').version(pkgJson.version)

let listener: Listener | null = null
let vite: ViteDevServer | null = null

const runServerDebounced = debounce(async () => {
  let runServer = (await import(`../src/hyper`)).runServer
  // if (listener) {
  //   runServer = (await import(`../src/hyper`)).runServer
  //   console.log(`${chalk.green('Restarting server...')}`)
  //   await vite?.close()
  //   await listener.close()
  // }
  let server = await runServer()
  listener = server.listener
  vite = server.vite
}, 1000)

program
  .command('dev')
  .description('run dev server')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'development'
    runServerDebounced()
    // chokidar.watch(path.resolve(__dirname, '../')).on('all', runServerDebounced)
  })

program.parse(process.argv)
