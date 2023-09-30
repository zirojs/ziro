import { NodePath, PluginItem } from '@babel/core'
import * as types from '@babel/types'

export const hyperBabelClientBundle: PluginItem = ({ types: t }: { types: typeof types }) => ({
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
    Program: (path: NodePath<types.Program>) => {
      // import ReactDOM
      path.unshiftContainer('body', t.importDeclaration([t.importDefaultSpecifier(t.identifier('ReactDOM'))], t.stringLiteral('react-dom/client')))
      path.unshiftContainer('body', t.importDeclaration([t.importSpecifier(t.identifier('PageProvider'), t.identifier('PageProvider'))], t.stringLiteral('hyper/page')))

      const isWindowDefined = t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier('window')), t.stringLiteral('undefined'))
      const ifStatement = t.ifStatement(
        isWindowDefined,
        t.blockStatement([
          t.variableDeclaration('const', [t.variableDeclarator(t.identifier('Page'), t.identifier('page'))]),
          t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.identifier('window.root'),
              t.callExpression(t.identifier('ReactDOM.hydrateRoot'), [
                t.callExpression(t.identifier('document.getElementById'), [t.stringLiteral('hyper-app')]),
                // t.callExpression(t.identifier('page'), []),
                t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier('PageProvider'), [], false), t.jsxClosingElement(t.jsxIdentifier('PageProvider')), [
                  // t.jsxExpressionContainer(t.callExpression(t.identifier('page'), [])),
                  t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier('Page'), [], false), t.jsxClosingElement(t.jsxIdentifier('Page')), []),
                ]),
              ])
            )
          ),
        ])
      )

      path.pushContainer('body', ifStatement)
    },
  },
})
