#!/usr/bin/env node
import { Command, Option } from 'commander'
import { name, version } from '../package.json' assert { type: 'json' }
import { ziroBuild } from '../src/ZiroApp/build'
import { edgeProviders, generateEdgeBundle } from '../src/ZiroApp/build/edge'
import { ziroDevServer } from '../src/ZiroApp/runners/dev'
import { ziroProductionServer } from '../src/ZiroApp/runners/production'

const program = new Command()

program.name(name).description('React SSR Framework').version(version)

program
  .command('dev')
  .description('run ziro dev server')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'development'
    ziroDevServer()
  })
program
  .command('build')
  .description('build ziro project')
  .addOption(new Option('--edge <provider>', 'build for edge').choices(edgeProviders))
  .action(async (options) => {
    process.env.NODE_ENV = 'production'
    await ziroBuild()
    if (options.edge) {
      await generateEdgeBundle(options.edge)
    }
  })

program
  .command('preview')
  .description('preview ziro project')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'production'
    await ziroProductionServer()
  })

program.parse(process.argv)
