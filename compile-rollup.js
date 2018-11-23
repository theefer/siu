const {rollup} = require('rollup');

const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

const babel = require("rollup-plugin-babel");
const buble = require("rollup-plugin-buble");

// Minifiers
const {uglify} = require("rollup-plugin-uglify");
const compiler = require('@ampproject/rollup-plugin-closure-compiler');
const {terser} = require("rollup-plugin-terser");

// TODO: configure minification engine
// TODO: use commonjs plugin?

async function compile(options) {
    const bundle = await rollup({
        input: options.sourcePath,
        plugins: [
            resolve({
                // TODO: probably not wanted?
                // modulesOnly: true,
                customResolveOptions: {
                    moduleDirectory: options.nodeModulesDir
                },
            }),
            commonjs(),
            // babel(),
            ...(options.minifier === 'uglify' ? [uglify()] : []),
            ...(options.minifier === 'terser' ? [terser()] : []),
            ...(options.minifier === 'closure' ? [compiler()] : []),
        ]
    });
    const { code, map } = await bundle.generate({
        output: {
            format: 'iife',
        },
    });
    return {
        code,
        codeSize: code.length,
    };
}

module.exports = compile;
