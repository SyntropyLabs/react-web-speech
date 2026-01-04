import pluginBabel from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
  treeshake: true,
  exports: true,
  external: ['react', 'react-dom'],
  fixedExtension: true,
  plugins: [
    pluginBabel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      parserOpts: {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      },
      plugins: ['babel-plugin-react-compiler'],
    }),
  ],
})
