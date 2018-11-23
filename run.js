const fs = require('fs');

const {run} = require('./compile');

const source = fs.readFileSync('./source.js');
run(source);
