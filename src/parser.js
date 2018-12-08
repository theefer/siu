const acorn = require('acorn');

function listDependencies(source) {
    // Parse import statements to infer dependencies
    const program = acorn.parse(source, {sourceType: 'module'});
    const imports = program.body.filter(node => node.type === 'ImportDeclaration');
    const importPaths = imports.map(node => node.source.value);
    const relativeImport = importPaths.find(path => path.match(/\.\./));
    if (relativeImport) {
        throw new Error(`Relative import paths not allowed: ${relativeImport}`);
    }
    return importPaths.map(path => path.split('/')[0]);
}

module.exports = {listDependencies};
