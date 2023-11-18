import { defineBuildConfig } from 'unbuild'
export default defineBuildConfig([
  {
    entries: [],
    declaration: true,
    rollup: {
      cjsBridge: true,
      inlineDependencies: true,
      esbuild: {
        jsx: 'automatic',
      },
    },
  },
])
