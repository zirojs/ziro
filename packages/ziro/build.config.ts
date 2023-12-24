import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    entries: [
      'bin/ziro-cli.ts',
      'src/client/Link/index.tsx',
      'src/client/RouterContext/index.tsx',
      'src/client/PageContext/index.tsx',
      'src/ZiroApp/runners/edge.ts',
      'src/ZiroApp/ziro.ts',
      {
        builder: 'mkdist',
        input: 'src/assets',
        outDir: 'dist/assets',
      },
    ],
    declaration: true,
    rollup: {
      inlineDependencies: true,
      esbuild: {
        jsx: 'automatic',
      },
    },
  },
])
