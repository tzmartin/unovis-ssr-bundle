import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const external = ['d3-selection', 'd3-scale', 'd3-shape', 'd3-array'];
const globals = {
  'd3-selection': 'd3',
  'd3-scale': 'd3',
  'd3-shape': 'd3',
  'd3-array': 'd3'
};

const plugins = [
  resolve({
    browser: true
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: './dist/types'
  })
];

export default [
  // IIFE bundle for browsers
  {
    input: 'src/bundle-entry.ts',
    output: {
      file: 'dist/unovis-bundle.js',
      format: 'iife',
      name: 'Unovis',
      globals
    },
    plugins,
    external
  },
  // ESM bundle for modern environments
  {
    input: 'src/bundle-entry.ts',
    output: {
      file: 'dist/unovis-bundle.esm.js',
      format: 'esm'
    },
    plugins,
    external
  }
]; 