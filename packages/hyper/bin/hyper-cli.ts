#!/usr/bin/env node --no-warnings
import { Command } from 'commander'
import { Listener } from 'listhen'
import { ViteDevServer } from 'vite'
import pkgJson from '../package.json' assert { type: 'json' }
import { runServer } from '../src/hyper'

const program = new Command()
program.name(pkgJson.name).description('React SSR Framework').version(pkgJson.version)

let listener: Listener | null = null
let vite: ViteDevServer | null = null

program
  .command('dev')
  .description('run dev server')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'development'
    runServer()
  })

program.parse(process.argv)
