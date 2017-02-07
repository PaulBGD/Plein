const {build} = require('./util');

let watch = ~process.argv.indexOf('--watch') || ~process.argv.indexOf('-w');

build({
    dest: 'es/%s',
    format: 'es',
    watch
});

build({
    dest: 'cjs/%s',
    format: 'cjs',
    watch
});
