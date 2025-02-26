import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/bundle-entry.ts',
  output: {
    file: 'dist/unovis-bundle.js',
    format: 'iife',
    name: 'Unovis',
    globals: {
      'd3-selection': 'd3',
      'd3-scale': 'd3',
      'd3-shape': 'd3',
      'd3-array': 'd3'
    }
  },
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: ['d3-selection', 'd3-scale', 'd3-shape', 'd3-array']
}; 