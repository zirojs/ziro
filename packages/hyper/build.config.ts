import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig({
  entries: [
    'src/cli/dev.ts',
    'src/cli/build.ts',
    'bin/hyper-cli.ts',
    'src/client/Link/index.tsx',
    'src/client/RouterContext/index.tsx',
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
})
