import { NodePath, PluginItem } from '@babel/core'
import * as types from '@babel/types'

export const hyperBabelServerBundle: PluginItem = (types) => ({
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
})
