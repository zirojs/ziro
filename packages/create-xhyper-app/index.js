const prompts = require('prompts')
const fs = require('node:fs')
const lodash = require('lodash')
const minimist = require('minimist')
const path = require('node:path')
const { yellow, lightBlue, reset, red, green } = require('kolorist')

const templates = fs.readdirSync('./templates')

const renameFiles = {
  _gitignore: '.gitignore',
}

const projectsLanguage = {
  js: yellow('JS'),
  ts: lightBlue('TS'),
}

const defaultTargetDir = 'hyper-app'

function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

function isEmpty(path) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function pkgFromUserAgent(userAgent) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

;(async () => {
  const argv = minimist(process.argv.slice(2))

  try {
    let targetDir = formatTargetDir(argv._[0])
    const response = await prompts([
      {
        type: targetDir ? null : 'text',
        name: 'targetDir',
        message: reset('Project name:'),
        initial: defaultTargetDir,
        onState: (state) => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir
        },
      },
      {
        type: () => (!fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'select'),
        name: 'overwrite',
        message: () => (targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`) + ` is not empty. Please choose how to proceed:`,
        initial: 0,
        choices: [
          {
            title: 'Remove existing files and continue',
            value: 'yes',
          },
          {
            title: 'Cancel operation',
            value: 'no',
          },
          {
            title: 'Ignore files and continue',
            value: 'ignore',
          },
        ],
      },

      {
        type: (_, { overwrite }) => {
          if (overwrite === 'no') {
            throw new Error(red('✖') + ' Operation cancelled')
          }
          return null
        },
        name: 'overwriteChecker',
      },
      {
        type: 'select',
        name: 'template',
        message: 'Please select a template',
        choices: templates.map((template) => ({
          title: lodash.upperFirst(template.split('-')[0]) + ' - ' + projectsLanguage[template.split('-')[1]],
          value: template,
        })),
      },
    ])

    const { template, overwrite } = response
    const root = path.join(process.cwd(), targetDir)

    if (overwrite === 'yes') {
      emptyDir(root)
    } else if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true })
    }

    const templateDir = path.resolve(__dirname, 'templates', template)
    const files = fs.readdirSync(templateDir)

    const write = (file, content) => {
      const targetPath = path.join(root, renameFiles[file] ?? file)
      if (content) {
        fs.writeFileSync(targetPath, content)
      } else {
        copy(path.join(templateDir, file), targetPath)
      }
    }

    for (const file of files.filter((f) => f !== 'package.json')) {
      write(file)
    }

    const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'))
    pkg.name = targetDir
    write('package.json', JSON.stringify(pkg, null, 2) + '\n')

    console.log(`\n${green('✔ Done')}.\n${yellow('⚡️ Hyper')} initialized succesffuly`)
    console.log(`\nNow run:\n`)
    const cdProjectName = path.relative(process.cwd(), root)
    if (root !== process.cwd()) {
      console.log(`  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`)
    }

    const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
    const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

    switch (pkgManager) {
      case 'yarn':
        console.log('  yarn')
        console.log('  yarn dev')
        break
      default:
        console.log(`  ${pkgManager} install`)
        console.log(`  ${pkgManager} run dev`)
        break
    }
    console.log()
  } catch (cancelled) {
    console.log(cancelled.message)
    return
  }
})()
