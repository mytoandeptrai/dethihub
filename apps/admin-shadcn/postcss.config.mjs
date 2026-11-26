import path from 'node:path'

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    [path.resolve(process.cwd(), 'postcss.engine.cjs')]: {},
  },
}
