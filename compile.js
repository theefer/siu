const {promisify} = require('util');
const path = require('path');
const zlib = require('zlib');
const fs = require('fs');

const tmp = require('tmp-promise');
const libnpm = require('libnpm');
const acorn = require('acorn');

const rollup = require('./compile-rollup');
const webpack = require('./compile-webpack');

const gzip = promisify(zlib.gzip.bind(zlib));
const writeFile = promisify(fs.writeFile.bind(fs));

// TODO: allow installing specific version
async function installModule(name, nodeModulesDir) {
    // List and install deps
    // TODO: use a saner module resolution algo!
    // TODO: take semver into account
    const manifest = await libnpm.manifest(name);
    await Promise.all(Object.keys(manifest.dependencies).map(dep => installModule(dep, nodeModulesDir)));

    const dirPath = path.join(nodeModulesDir, name);
    await libnpm.extract(name, dirPath);
}

async function run(source) {
    // Parse import statements to infer dependencies
    const program = acorn.parse(source, {sourceType: 'module'});
    const imports = program.body.filter(node => node.type === 'ImportDeclaration');
    const importPaths = imports.map(node => node.source.value);
    const relativeImport = importPaths.find(path => path.match(/\.\./));
    if (relativeImport) {
        throw new Error(`Relative import paths not allowed: ${relativeImport}`);
    }
    const dependencies = importPaths.map(path => path.split('/')[0]);

    // const nodeModulesDir = 'node_modules';
    // TODO: cleanupWorkDir at the end
    const {path: workDir, cleanup: cleanupWorkDir} = await tmp.dir({prefix: 'siu-'});
    const nodeModulesDir = path.join(workDir, 'node_modules');

    // TODO: parallel? conflict?
    for (const dep of dependencies) {
        await installModule(dep, nodeModulesDir);
    }

    const sourcePath = path.join(workDir, 'source.js');
    await writeFile(sourcePath, source, {encoding: 'utf8'});

    function compile(compiler, name, extraOptions = {}) {
        compiler({
            sourcePath,
            nodeModulesDir,
            ...extraOptions,
        }).then(async ({codeSize, code}) => {
            console.log(`[${name}] bytes: ${codeSize} - ${await gzippedSize(code)} gzipped`);
            // console.log(`[${name}] code:`);
            // console.log(code);
        });
    }

    // TODO: return output as data instead of logging out
    compile(webpack, 'webpack');
    compile(rollup, 'rollup');
    compile(rollup, 'rollup (uglify)', {minifier: 'uglify'});
    compile(rollup, 'rollup (terser)', {minifier: 'terser'});
    compile(rollup, 'rollup (closure)', {minifier: 'closure'});
}

// TODO: return promise
function gzippedSize(data) {
    return gzip(data, {level: 9}).then(compressed => compressed.length);
}

module.exports = {run};
