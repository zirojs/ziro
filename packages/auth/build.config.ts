import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig([
  {
    entries: ['./index.ts'],
    declaration: true,
    rollup: {
      inlineDependencies: true,
      esbuild: {
        jsx: 'automatic',
        minify: true,
        treeShaking: true,
        format: 'esm',
      },
    },
  },
])
