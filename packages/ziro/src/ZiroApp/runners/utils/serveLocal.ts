import chalk from 'chalk'
import { toNodeListener } from 'h3'
import { listen } from 'listhen'
import { isDevelopment } from 'std-env'
import { bootstrapH3Server } from '../../server'
import { ZiroApp } from '../../ziro'

export const serveLocal = async (app: ZiroApp) => {
  await bootstrapH3Server(app)
  const listener = await listen(toNodeListener(app.h3), { port: 3000, showURL: false, hostname: '0.0.0.0' })
  isDevelopment && console.clear()
  console.log(`${chalk.yellowBright.bold('Ziro ۰')} ${chalk.green(isDevelopment ? '[Development]' : '[Production]')}`)
  console.log()
  console.log(`Running on: ${chalk.green(listener.url)}`)

  return listener
}