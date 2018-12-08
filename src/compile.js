const {promisify} = require('util');
const path = require('path');
const zlib = require('zlib');
const fs = require('fs');

const tmp = require('tmp-promise');

const rollup = require('./compilers/rollup');
const webpack = require('./compilers/webpack');

const {listDependencies} = require('./parser');
const {installModules} = require('./install');

const gzip = promisify(zlib.gzip.bind(zlib));
const writeFile = promisify(fs.writeFile.bind(fs));

async function writeSource(source, sourcePath) {
    await writeFile(sourcePath, source, {encoding: 'utf8'});
}

async function runCompilers(sourcePath, nodeModulesDir) {
    function compile(compiler, name, extraOptions = {}) {
        const baseOutput = {
            compiler: name,
            minifier: extraOptions.minifier || 'default',
        };
        return compiler({
            sourcePath,
            nodeModulesDir,
            ...extraOptions,
        }).then(async (output) => {
            const {code} = output;
            const codeSize = code.length;
            const gzippedCodeSize = await gzippedSize(code);
            return {
                ...baseOutput,
                ...output,
                codeSize,
                gzippedCodeSize,
            };
        }, (error) => {
            return {
                ...baseOutput,
                error,
            };
        });
    }

    return Promise.all([
        compile(webpack, 'webpack'),
        compile(rollup, 'rollup'),
        compile(rollup, 'rollup', {minifier: 'uglify'}),
        compile(rollup, 'rollup', {minifier: 'uglify-es'}),
        compile(rollup, 'rollup', {minifier: 'terser'}),
        compile(rollup, 'rollup', {minifier: 'closure'}),
    ]);
}

async function run(source) {
    const dependencies = listDependencies(source);

    // TODO: use tmp.withDir instead
    const {path: workDir, cleanup: cleanupWorkDir} = await tmp.dir({
        prefix: 'siu-',
        unsafeCleanup: true,
    });
    const nodeModulesDir = path.join(workDir, 'node_modules');
    const sourcePath = path.join(workDir, 'source.js');

    try {
        await installModules(dependencies, nodeModulesDir);
        await writeSource(source, sourcePath);

        return await runCompilers(sourcePath, nodeModulesDir);
    } catch (e) {
        console.error('Unexpected error', e);
    } finally {
        cleanupWorkDir();
    }
}

// TODO: return promise
function gzippedSize(data) {
    return gzip(data, {level: 9}).then(compressed => compressed.length);
}

module.exports = {run};
