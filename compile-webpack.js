const {promisify} = require('util');

const MemoryFS = require('memory-fs');
const webpack = require("webpack");

const fs = new MemoryFS();

async function compile(options) {
    const compiler = webpack({
        mode: "production",
        entry: options.sourcePath,
        output: {
            path: '/dist',
            filename: 'out-webpack.js'
        },
        resolve: {
            modules: [options.nodeModulesDir],
        },
    });

    compiler.outputFileSystem = fs;
    try {
        const run = promisify(compiler.run.bind(compiler));
        const stats = await run();
        if (stats.hasErrors()) {
            // Handle errors here
            // console.log(stats);
            console.log('webpack error');
        }
    } catch (err) {
        // Handle errors here
        console.log(err);
    }

    // TODO: write to temp file
    const code = await promisify(fs.readFile.bind(fs))('/dist/out-webpack.js');
    return {
        code: String(code),
        codeSize: code.length,
    };
}

module.exports = compile;
