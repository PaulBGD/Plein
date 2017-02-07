const {rollup} = require('rollup');
const svelte = require('rollup-plugin-svelte');
const buble = require('rollup-plugin-buble');
const rollupWatch = require('rollup-watch');
// const closure = require('rollup-plugin-closure-compiler-js');

const entries = {
    'modules/core/index.html': 'core.js'
};

exports.build = function build({dest, format, production, languageOut, watch}) {
    Object.keys(entries).forEach(entry => {
        const options = {
            entry,
            dest: dest.replace('%s', entries[entry]),
            format,
            plugins: [
                svelte(),
                format !== 'es' && buble()
            ]
        };
        // since this is a library we don't need to minify our sources
        // but if we ever release a iife based bundle we'll need this
        // if (production) {
        //     options.plugins.push(closure({
        //         compilationLevel: 'SIMPLE',
        //         languageIn: 'ES6',
        //         languageOut
        //     }));
        // }
        if (watch) {
            rollupWatch({rollup}, options).on('event', event => console.log(entry, event));
        } else {
            const time = Date.now();
            console.log('Building', entry, format);
            rollup(options)
                .then(bundle => bundle.write(options))
                .then(() => console.log('Took', (Date.now() - time) / 1000 + 's', 'to build', entry, format))
                .catch(err => console.error(entry, err));
        }

    });
};
