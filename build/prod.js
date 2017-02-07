const {build} = require('./util');


build({
    dest: 'es/%s',
    format: 'es',
    production: true,
    languageOut: 'ES6'
});

build({
    dest: 'cjs/%s',
    format: 'cjs',
    production: true,
    languageOut: 'ES5'
});
