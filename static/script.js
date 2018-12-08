const sourceEl = document.querySelector('#source');
const compileEl = document.querySelector('#compile');
const outputsEl = document.querySelector('#outputs');
const exampleSelectorEl = document.querySelector('#example-selector');
const resultsNoticeEl = document.querySelector('.results-notice');

const EXAMPLES = [
    {
        spec: 'rxjs',
        namedImports: ['of'],
    },
    {
        spec: 'lodash-es',
        namedImports: ['pick'],
    },
    {
        spec: 'lodash-es/pick',
        defaultImport: 'pick',
    },
    {
        spec: 'ramda',
        namedImports: ['map'],
    },
    {
        spec: 'moment',
        defaultImport: 'moment',
    },
    {
        spec: 'date-fns',
        namedImports: ['format'],
    },
    {
        spec: 'immutable',
        namedImports: ['List', 'is'],
    },
    {
        spec: 'immutable',
        globImport: 'immutable',
    },
    {
        spec: 'immutable',
    },
    {
        spec: 'isarray',
        defaultImport: 'isArray',
    },
    {
        spec: 'camelcase',
        defaultImport: 'camelCase',
    },
    // TODO: add async-es
    // TODO: add bluebird
    // TODO: add underscore
    {
        spec: 'classnames',
        defaultImport: 'classnames',
    },
];

EXAMPLES.forEach(example => {
    let source = '';
    let symbols = [];
    let name;
    if (example.namedImports) {
        const imports = example.namedImports.join(', ');
        source += `import {${imports}} from '${example.spec}';`;
        symbols = example.namedImports;
        name = `${example.spec} (${imports})`;
    } else if (example.defaultImport) {
        source += `import ${example.defaultImport} from '${example.spec}';`;
        symbols = [example.defaultImport];
        name = `${example.spec} (default)`;
    } else if (example.globImport) {
        source += `import * as ${example.defaultImport} from '${example.spec}';`;
        symbols = [example.globImport];
        name = `${example.spec} (*)`;
    } else {
        source += `import '${example.spec}';`;
        name = `${example.spec}`;
    }
    source += `\n\n`;
    source += `// Reference symbols to prevent tree-shaking\n`;
    source += `console.log(${symbols.join(', ')});`;

    const optionEl = document.createElement('option');
    optionEl.value = source;
    optionEl.textContent = name;
    exampleSelectorEl.appendChild(optionEl);
});

exampleSelectorEl.addEventListener('change', (event) => {
    sourceEl.value = exampleSelectorEl.value;
});

compileEl.addEventListener('click', () => {
    const source = sourceEl.value;
    const payload = {
        source,
    };

    // Disable compile button, show processing notice
    compileEl.disabled = true;
    resultsNoticeEl.textContent = 'Compiling…';
    outputsEl.innerHTML = '';

    fetch('/api/compile', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(resp => resp.json()).then(resp => {
        // TODO: cleaner formatting
        // TODO: compare to recommended payload, for scale
        // TODO: order/highlight smallest

        // TODO: allow comparing two setups, eg moment vs date-fns, lodash-es specs
        resp.forEach(output => {
            let msg;
            if (output.error) {
                const {compiler, minifier, error} = output;
                msg = (`[${compiler} (${minifier})] ERROR: ${error}`);
            } else {
                const {compiler, minifier, codeSize, gzippedCodeSize} = output;
                msg = (`[${compiler} (${minifier})] bytes: ${codeSize} - ${gzippedCodeSize} gzipped`);
            }
            const item = document.createElement('li');
            item.appendChild(document.createTextNode(`${msg} (`));
            const viewSource = document.createElement('button');
            viewSource.textContent = 'view source';
            viewSource.addEventListener('click', event => {
                displaySource(output.code);
            });
            item.appendChild(viewSource);
            item.appendChild(document.createTextNode(')'));
            outputsEl.appendChild(item);
        });
    }).finally(() => {
        compileEl.disabled = false;
        resultsNoticeEl.textContent = '';
    });
});

let overlayEl = null;

function removeOverlay() {
    if (overlayEl) {
        document.body.removeChild(overlayEl);
        overlayEl = null;
    }
}

function displaySource(source) {
    removeOverlay();

    overlayEl = document.createElement('div');
    overlayEl.classList.add('overlay');
    const modalEl = document.createElement('div');
    modalEl.classList.add('modal');
    modalEl.classList.add('code-output');
    modalEl.textContent = source;
    overlayEl.appendChild(modalEl);
    overlayEl.addEventListener('click', () => {
        removeOverlay();
    });
    // TODO: add utility to prettify minified code
    document.body.appendChild(overlayEl);
}
