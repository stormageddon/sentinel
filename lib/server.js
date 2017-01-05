/**
 * Created by mcaputo on 12/4/16.
 */
'use strict';

const BASE_PATH = process.env.SENTINEL_BASE_PATH;
const Hapi = require('hapi');
const fs = require('fs');
let config = require(BASE_PATH + '/lib/config.json');
const Boom = require('boom');
const moment = require('moment');


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

        let site = {name: request.payload.name, url: request.payload.url, type: request.payload.type};
        console.log(`adding site: ${site.name}`);
        console.log(`adding url: ${site.url}`);

        if (!site.name || !site.url) {
            return reply(Boom.badRequest('Name and URL are required'));
        }

        site.last_updated = moment().format('MM/DD/YY');

        config.sites.push(site);



        // Write new url to config file
        fs.writeFile(configPath, JSON.stringify(config), (err)=> {
            if (err) {
                return reply(Boom.badRequest(err));
            }
            config = require(BASE_PATH + '/lib/config.json');
            return reply({statusCode: 200, message: 'Site saved', data: site});
        });
    }
});

server.route({
    method: 'GET',
    path: '/site',
    handler: function (request, reply) {
        delete require.cache[require.resolve(BASE_PATH + '/lib/config.json')];
        config = require(BASE_PATH + '/lib/config.json');
        reply(config.sites);
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
