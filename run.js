const fs = require('fs');

const {run} = require('./src/compile');

const source = fs.readFileSync('./source.js');
run(source).then(([...outputs]) => {
    outputs.forEach(output => {
        if (output.error) {
            const {compiler, minifier, error} = output;
            console.error(`[${compiler} (${minifier})] ERROR: ${error.message}`);
        } else {
            const {compiler, minifier, codeSize, gzippedCodeSize} = output;
            console.log(`[${compiler} (${minifier})] bytes: ${codeSize} - ${gzippedCodeSize} gzipped`);
        }
    });
});
