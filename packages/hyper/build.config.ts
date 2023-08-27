import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig({
  entries: [
    'src/hyper.ts',
    'bin/hyper-cli.ts',
    'src/entries/hyper.tsx',
    {
      builder: 'mkdist',
      input: 'src/assets',
      outDir: 'dist/assets',
    },
  ],
  declaration: true,
  rollup: {
    cjsBridge: true,
  },
})
