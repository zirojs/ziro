import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig([
  {
    entries: ['./index.ts'],
    declaration: true,
    clean: false,
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
