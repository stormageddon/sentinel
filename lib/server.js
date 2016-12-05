/**
 * Created by mcaputo on 12/4/16.
 */
'use strict';

const BASE_PATH = process.env.SENTINEL_BASE_PATH;
const Hapi = require('hapi');
const fs = require('fs');
const config = require(BASE_PATH + '/lib/config.json');
const Boom = require('boom');


const configPath = BASE_PATH + '/lib/config.json';

// Create server
const server = new Hapi.Server();
server.register(require('inert'));
server.connection({
    host: '0.0.0.0',
    port: 9375
});

// Add route
server.route({
    method: 'POST',
    path: '/site',
    handler: function (request, reply) {

        let site = {name: request.payload.name, url: request.payload.url};
        console.log(`adding site: ${site.name}`);
        console.log(`adding url: ${site.url}`);

        if (!site.name || !site.url) {
            return reply(Boom.badRequest('Name and URL are required'));
        }

        config.sites.push(site);

        // Write new url to config file
        fs.writeFile(configPath, JSON.stringify(config), (err)=> {
            if (err) {
                return reply(Boom.badRequest(err));
            }

            return reply({statusCode: 200, message: 'Site saved'});
        });
    }
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'webapp',
            listing: false
        }
    }
});

server.start((err) => {
   if (err) {
       throw err;
   }
   console.log(`Server running at: ${server.info.uri}`);
    console.log(`config: ${JSON.stringify(config)}`);
});
