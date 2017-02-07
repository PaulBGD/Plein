import buble from 'rollup-plugin-buble';
import closure from 'rollup-plugin-closure-compiler-js';
import {join} from 'path';

export default {
    entry: join(__dirname, 'src/example.js'),
    dest: join(__dirname, 'dist/bundle.js'),
    format: 'iife',
    plugins: [
        buble(),
        process.env.NODE_ENV === 'production' && closure({
            compilationLevel: 'ADVANCED',
            warningLevel: 'QUIET'
        })
    ]
}