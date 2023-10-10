import { PluginItem } from '@babel/core'

export const removeUnusedImports = (): PluginItem => {
  return {
    name: 'hyper/babel-plugin-remove-unused-imports',
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
  }
}
