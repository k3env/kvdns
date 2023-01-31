import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default {
  input: 'dist/main.js',
  output: {
    file: 'dist/app.js',
    format: 'esm',
  },
  plugins: [commonjs(), babel({ babelHelpers: 'bundled' })],
};
