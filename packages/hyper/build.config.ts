import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig([
  {
    entries: [
      'bin/hyper-cli.ts',
      'src/client/Link/index.tsx',
      'src/client/RouterContext/index.tsx',
      'src/client/PageContext/index.tsx',
      'src/HyperApp/runners/edge.ts',
      'src/HyperApp/hyperApp.ts',
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
