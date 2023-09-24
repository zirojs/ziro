import babel, { NodePath } from '@babel/core'
import * as types from '@babel/types'
import { glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'

const generateBuildDirectoryFromFilename = (filename: string) => {
  return filename
    .replace(process.cwd() + '/', '')
    .split('/')
    .slice(0, -1)
    .join('/')
}

const getFilename = (filename: string) => {
  return filename.split('/').slice(-1).join('/')
}

export const hyperBuild = async () => {
  build({
    root: process.cwd(),
    define: {
      process: {
        env: {
          NODE_ENV: 'production',
        },
      },
    },
    build: {
      manifest: true,
      outDir: '.hyper/client-bundles',
      minify: true,
      emptyOutDir: false,
      rollupOptions: {
        input: await glob(path.resolve(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' }),
        output: {
          entryFileNames(chunkInfo) {
            if (chunkInfo.facadeModuleId?.startsWith(path.join(process.cwd(), 'pages'))) {
              return path.join(generateBuildDirectoryFromFilename(chunkInfo.facadeModuleId), `${chunkInfo.name}.mjs`)
            }
            return `${chunkInfo.name}.mjs`
          },
        },
      },
    },
    plugins: [
      {
        name: 'transform-client-bundles',
        enforce: 'pre',
        transform(code, id) {
          let clientBundle = code
          if (id.includes(process.cwd())) {
            let importAdded = false
            clientBundle = babel.transformSync(code, {
              filename: id,
              targets: {
                esmodules: true,
              },
              presets: ['@babel/preset-typescript'],
              plugins: [
                ({ types: t }: { types: typeof types }) => ({
                  name: 'build-client',
                  visitor: {
                    VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
                      if (
                        (path.node.declarations[0].id as types.Identifier).name === 'action' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'loader' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'generatePaths'
                      ) {
                        path.remove()
                      }
                    },
                    ImportDeclaration(path: NodePath<types.ImportDeclaration>) {
                      if (!importAdded) {
                        path.insertBefore(t.importDeclaration([t.importSpecifier(t.identifier('RouterContext'), t.identifier('RouterContext'))], t.stringLiteral('hyper/router-context')))
                        path.insertBefore(t.importDeclaration([t.importDefaultSpecifier(t.identifier('ReactDOM'))], t.stringLiteral('react-dom/client')))
                        importAdded = true
                      }
                    },
                    Program: (path: NodePath<types.Program>) => {
                      const isWindowDefined = t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier('window')), t.stringLiteral('undefined'))

                      const ifStatement = t.ifStatement(
                        isWindowDefined,
                        t.blockStatement([
                          t.expressionStatement(
                            t.assignmentExpression(
                              '=',
                              t.identifier('window.root'),
                              t.callExpression(t.identifier('ReactDOM.hydrateRoot'), [
                                t.callExpression(t.identifier('document.getElementById'), [t.stringLiteral('hyper-app')]),
                                t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier('RouterContext'), [], false), t.jsxClosingElement(t.jsxIdentifier('RouterContext')), [
                                  t.jsxExpressionContainer(t.callExpression(t.identifier('page'), [])),
                                ]),
                              ])
                            )
                          ),
                        ])
                      )

                      path.pushContainer('body', ifStatement)
                    },
                  },
                }),
              ],
            })?.code!

            const serverBundle = babel.transformSync(code, {
              filename: id,
              targets: {
                esmodules: true,
              },
              presets: ['@babel/preset-typescript'],
              plugins: [
                {
                  name: 'remove unused imports',
                  visitor: {
                    ImportDeclaration(path) {
                      const importName = path.node.source.value
                      const importVariable = path.node.specifiers

                      const references = path.scope.getBinding(importName)?.referencePaths || []
                      if (references.length === 0 && importVariable.length) {
                        path.remove()
                      }
                    },
                  },
                },
                ({ types: t }: { types: typeof types }) => ({
                  name: 'build-server',
                  visitor: {
                    VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
                      if (
                        (path.node.declarations[0].id as types.Identifier).name === 'page' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'loading' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'error'
                      ) {
                        path.remove()
                      }
                    },
                  },
                }),
              ],
            })?.code!
            fs.mkdirSync(path.join('.hyper/server-bundles', generateBuildDirectoryFromFilename(id)), { recursive: true })
            fs.writeFileSync(path.join('.hyper/server-bundles', generateBuildDirectoryFromFilename(id), getFilename(id)), serverBundle, { encoding: 'utf-8' })
          }
          return {
            code: clientBundle,
          }
        },
      },
    ],
  })

  build({
    root: process.cwd(),
    define: {
      process: {
        env: {
          NODE_ENV: 'production',
        },
      },
    },

    build: {
      manifest: true,
      outDir: '.hyper/server-bundles',
      ssr: true,
      minify: true,
      emptyOutDir: false,
      rollupOptions: {
        input: await glob(path.resolve(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' }),
        output: {
          entryFileNames(chunkInfo) {
            if (chunkInfo.facadeModuleId?.startsWith(path.join(process.cwd(), 'pages'))) {
              return path.join(generateBuildDirectoryFromFilename(chunkInfo.facadeModuleId), `${chunkInfo.name}.server.mjs`)
            }
            return `${chunkInfo.name}.server.mjs`
          },
        },
      },
    },
    plugins: [
      {
        name: 'transform-client-bundles',
        enforce: 'pre',
        transform(code, id) {
          let clientBundle = code
          if (id.includes(process.cwd())) {
            let importAdded = false
            clientBundle = babel.transformSync(code, {
              filename: id,
              targets: {
                esmodules: true,
              },
              presets: ['@babel/preset-typescript'],
              plugins: [
                ({ types: t }: { types: typeof types }) => ({
                  name: 'build-server',
                  visitor: {
                    VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
                      if (
                        (path.node.declarations[0].id as types.Identifier).name === 'action' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'loader' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'generatePaths'
                      ) {
                        path.remove()
                      }
                    },
                    ImportDeclaration(path: NodePath<types.ImportDeclaration>) {
                      if (!importAdded) {
                        path.insertBefore(t.importDeclaration([t.importSpecifier(t.identifier('RouterContext'), t.identifier('RouterContext'))], t.stringLiteral('hyper/router-context')))
                        path.insertBefore(t.importDeclaration([t.importDefaultSpecifier(t.identifier('ReactDOM'))], t.stringLiteral('react-dom/client')))
                        importAdded = true
                      }
                    },
                    Program: (path: NodePath<types.Program>) => {
                      const isWindowDefined = t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier('window')), t.stringLiteral('undefined'))

                      const ifStatement = t.ifStatement(
                        isWindowDefined,
                        t.blockStatement([
                          t.expressionStatement(
                            t.assignmentExpression(
                              '=',
                              t.identifier('window.root'),
                              t.callExpression(t.identifier('ReactDOM.hydrateRoot'), [
                                t.callExpression(t.identifier('document.getElementById'), [t.stringLiteral('hyper-app')]),
                                t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier('RouterContext'), [], false), t.jsxClosingElement(t.jsxIdentifier('RouterContext')), [
                                  t.jsxExpressionContainer(t.callExpression(t.identifier('page'), [])),
                                ]),
                              ])
                            )
                          ),
                        ])
                      )

                      path.pushContainer('body', ifStatement)
                    },
                  },
                }),
              ],
            })?.code!

            const serverBundle = babel.transformSync(code, {
              filename: id,
              targets: {
                esmodules: true,
              },
              presets: ['@babel/preset-typescript'],
              plugins: [
                {
                  name: 'remove unused imports',
                  visitor: {
                    ImportDeclaration(path) {
                      const importName = path.node.source.value
                      const importVariable = path.node.specifiers

                      const references = path.scope.getBinding(importName)?.referencePaths || []
                      if (references.length === 0 && importVariable.length) {
                        path.remove()
                      }
                    },
                  },
                },
                ({ types: t }: { types: typeof types }) => ({
                  name: 'build-server',
                  visitor: {
                    VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
                      if (
                        (path.node.declarations[0].id as types.Identifier).name === 'page' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'loading' ||
                        (path.node.declarations[0].id as types.Identifier).name === 'error'
                      ) {
                        path.remove()
                      }
                    },
                  },
                }),
              ],
            })?.code!
            fs.mkdirSync(path.join('.hyper/server-bundles', generateBuildDirectoryFromFilename(id)), { recursive: true })
            fs.writeFileSync(path.join('.hyper/server-bundles', generateBuildDirectoryFromFilename(id), getFilename(id)), serverBundle, { encoding: 'utf-8' })
          }
          return {
            code: clientBundle,
          }
        },
      },
    ],
  })
}
