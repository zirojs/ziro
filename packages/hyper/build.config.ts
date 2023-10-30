import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig([
  {
    entries: [
      'src/cli/dev.ts',
      'src/cli/build.ts',
      'src/cli/preview.ts',
      'bin/hyper-cli.ts',
      'src/client/Link/index.tsx',
      'src/client/RouterContext/index.tsx',
      'src/client/PageContext/index.tsx',
      {
        builder: 'mkdist',
        input: 'src/assets',
        outDir: 'dist/assets',
      },
    ],
    declaration: true,
    rollup: {
      cjsBridge: true,
      inlineDependencies: true,
      esbuild: {
        jsx: 'automatic',
      },
    },
  },
  {
    entries: ['src/server/edge/index.ts'],
    rollup: {
      cjsBridge: true,
      inlineDependencies: true,
      esbuild: {
        jsx: 'automatic',
      },
    },
  },
  {
    entries: ['src/cli/edge/index.ts'],
    rollup: {
      cjsBridge: true,
      inlineDependencies: true,
      esbuild: {
        target: 'esnext',
        jsx: 'automatic',
      },
    },
  },
  {
    entries: ['src/HyperApp/runners/dev.ts', 'src/HyperApp/hyperApp.ts'],
    declaration: true,
    rollup: {
      cjsBridge: true,
      inlineDependencies: true,
      esbuild: {
        target: 'esnext',
        jsx: 'automatic',
      },
    },
  },
])
