import { NodePath, PluginItem } from '@babel/core';
import * as types from '@babel/types';

export const ziroBabelServerBundle: PluginItem = (types) => ({
  name: 'build-server',
  visitor: {
    VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
      if (
        (path.node.declarations[0].id as types.Identifier).name === 'Page' ||
        (path.node.declarations[0].id as types.Identifier).name === 'loading' ||
        (path.node.declarations[0].id as types.Identifier).name === 'error'
      ) {
        path.remove()
      }
    },
		ExportDefaultDeclaration(path: NodePath<types.ExportDefaultDeclaration>) {
			path.remove();
		},
  },
})
