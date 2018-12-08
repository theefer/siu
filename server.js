'use strict';

const Hapi = require('hapi');

const {run} = require('./src/compile');

const server = Hapi.server({
    host: '0.0.0.0',
    port: 8000
});

async function start() {
    await server.register(require('inert'));

    server.route({
        method: 'POST',
        path: '/api/compile',
        handler(request, h) {
            const payload = request.payload;
            const source = payload.source;
            return run(source);
        }
    });

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: 'static'
            }
        }
    });

    await server.start();

    console.log('Server running at:', server.info.uri);
};

start();
