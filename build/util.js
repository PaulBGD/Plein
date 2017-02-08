const {rollup} = require('rollup');
const svelte = require('rollup-plugin-svelte');
const buble = require('rollup-plugin-buble');
const rollupWatch = require('rollup-watch');
const path = require('path');
const fs = require('fs');
// const closure = require('rollup-plugin-closure-compiler-js');

const entries = {
    'modules/core/index.html': 'core'
};
const shared = fs.readdirSync('./modules/shared');
const external = [
    path.resolve('./node_modules/svelte/shared.js'),
].concat(shared.map(name => path.resolve(`./modules/shared/${name}`)));
console.log(external);

exports.build = function build({dest, format, production, languageOut, watch}) {
    shared.forEach(shared => {
        const options = {
            entry: path.join('./modules/shared', shared),
            dest: dest.replace('%s', 'shared/' + shared),
            format,
            plugins: format !== 'es' && [
                buble()
            ] || undefined,
            external
        };
        if (watch) {
            rollupWatch({rollup}, options).on('event', event => console.log(`shared/${shared}`, event));
        } else {
            const time = Date.now();
            console.log('Building', `shared/${shared}`, format);
            rollup(options)
                .then(bundle => bundle.write(options))
                .then(() => console.log('Took', (Date.now() - time) / 1000 + 's', 'to build', `shared/${shared}`, format))
                .catch(err => console.error(`shared/${shared}`, err));
        }
    });
    Object.keys(entries).forEach(entry => {
        const options = {
            entry,
            dest: dest.replace('%s', entries[entry]) + '/index.js',
            format,
            plugins: [
                svelte(),
                format !== 'es' && buble()
            ],
            external,
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
