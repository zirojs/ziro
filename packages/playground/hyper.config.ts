import customPlugin from './plugins/custom'

export default {
  edge: false,
  plugins: [customPlugin],
}

// create middleware for something
// const createMiddleware = (url: string) => ({
//   handler: () => {},
// })

// on build, we add these pages to the bundle
// we need to transpile the page and middlewares to h3 compatible code
// we do not add jsx pages, we just add the api loaders
