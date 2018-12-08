const path = require('path');
const libnpm = require('libnpm');

// TODO: allow installing specific version
async function installModules(names, nodeModulesDir) {
    // TODO: only install each package once
    // TODO: install parallel, while preventing conflicts
    for (const name of names) {
        await installModule(name, nodeModulesDir);
    }
}

// TODO: allow installing specific version
async function installModule(name, nodeModulesDir) {
    // List and install deps
    // TODO: use a saner module resolution algo!
    // TODO: take semver into account
    const manifest = await libnpm.manifest(name);
    await installModules(Object.keys(manifest.dependencies), nodeModulesDir);

    const dirPath = path.join(nodeModulesDir, name);
    await libnpm.extract(name, dirPath);
}

module.exports = {installModules};
