import babel, { NodePath } from '@babel/core'
import * as types from '@babel/types'
import { glob } from 'glob'
import path from 'node:path'
import { build } from 'vite'

export const hyperBuild = async () => {
  await build({
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
      rollupOptions: {
        input: await glob(path.resolve(process.cwd(), 'pages/**/*.tsx'), { ignore: 'node_modules/**' }),
        output: {
          entryFileNames(chunkInfo) {
            if (chunkInfo.facadeModuleId?.startsWith(path.join(process.cwd(), 'pages'))) {
              return `${chunkInfo.facadeModuleId
                .replace(process.cwd() + '/', '')
                .split('/')
                .slice(0, -1)
                .join('/')}/${chunkInfo.name}.js`
            }
            return `${chunkInfo.name}.js`
          },
        },
      },
    },
    plugins: [
      {
        name: 'transform-html',
        enforce: 'pre',
        transform(code, id) {
          if (id.includes(process.cwd())) {
            let importAdded = false
            code = babel.transformSync(code, {
              filename: id,
              targets: {
                esmodules: true,
              },
              presets: ['@babel/preset-typescript'],
              plugins: [
                ({ types: t }: { types: typeof types }) => ({
                  name: 'something',
                  visitor: {
                    VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
                      if ((path.node.declarations[0].id as types.Identifier).name === 'action' || (path.node.declarations[0].id as types.Identifier).name === 'loader') {
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
                      path.pushContainer(
                        'body',
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
                        )
                      )
                    },
                  },
                }),
              ],
            })?.code!
          }
          return {
            code,
          }
        },
      },
    ],
  })
}
