import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig({
  entries: [
    'src/hyper.ts',
    'bin/hyper-cli.ts',
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
  failOnWarn: false,
})
