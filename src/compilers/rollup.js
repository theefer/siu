const {rollup} = require('rollup');

const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

const babel = require("rollup-plugin-babel");
const buble = require("rollup-plugin-buble");

// Minifiers
const {uglify} = require("rollup-plugin-uglify");
const uglifyEs = require("rollup-plugin-uglify-es");
const closureCompiler = require('@ampproject/rollup-plugin-closure-compiler');
const {terser} = require("rollup-plugin-terser");

const MINIFIERS = {
    // TODO: preprocess via babel/buble before uglify iff ES>5
    // TODO: option to mangle props?
    'uglify': [uglify()],
    'uglify-es': [uglifyEs()],
    'terser': [terser()],
    'closure': [closureCompiler()],
};

async function compile(options) {
    const minifierOps = options.minifier ? MINIFIERS[options.minifier] : [];
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
            ...minifierOps,
        ]
    });
    const { code, map } = await bundle.generate({
        output: {
            format: 'iife',
        },
    });
    return {
        code,
        // TODO: return configuration
    };
}

module.exports = compile;
