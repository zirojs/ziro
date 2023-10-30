#!/usr/bin/env node --no-warnings
import { Command, Option } from 'commander'
import { name, version } from '../package.json' assert { type: 'json' }
import { hyperBuild } from '../src/HyperApp/build'
import { runHyperDevServer } from '../src/HyperApp/runners/dev'
import { runHyperProductionServer } from '../src/HyperApp/runners/production'
import { edgeProviders } from '../src/cli/edge'
const program = new Command()
program.name(name).description('React SSR Framework').version(version)

program
  .command('dev')
  .description('run hyper dev server')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'development'
    runHyperDevServer()
  })
program
  .command('build')
  .description('build hyper project')
  .addOption(new Option('--edge <provider>', 'build for edge').choices(edgeProviders))
  .action(async (options) => {
    process.env.NODE_ENV = 'production'
    await hyperBuild()
    // if (options.edge) {
    //   await generateEdgeBundle(options.edge)
    // }
  })

program
  .command('preview')
  .description('preview hyper project')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'production'
    await runHyperProductionServer()
  })

program.parse(process.argv)
