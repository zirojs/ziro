#!/usr/bin/env node --no-warnings
import { Command } from 'commander'
import { name, version } from '../package.json' assert { type: 'json' }
import { hyperBuild } from '../src/cli/build'
import { runServer } from '../src/cli/dev'

const program = new Command()
program.name(name).description('React SSR Framework').version(version)

program
  .command('dev')
  .description('run hyper dev server')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'development'
    runServer()
  })

program
  .command('build')
  .description('build hyper project')
  .action(async (str, options) => {
    process.env.NODE_ENV = 'production'
    hyperBuild()
  })

program.parse(process.argv)
