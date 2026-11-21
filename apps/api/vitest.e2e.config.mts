import swc from 'unplugin-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    root: './',
    include: ['src/__tests__/**/*.e2e-spec.ts'],
    exclude: [
      'src/__tests__/article.e2e-spec.ts',
      'src/__tests__/auth.e2e-spec.ts',
      'src/__tests__/order.e2e-spec.ts',
      'src/__tests__/user-management.e2e-spec.ts',
    ],
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30_000,
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'esnext',
        keepClassNames: true,
      },
      module: {
        type: 'es6',
      },
    }),
    tsconfigPaths(),
  ],
})
