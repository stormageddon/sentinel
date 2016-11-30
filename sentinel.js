/**
 * Created by mcaputo on 11/29/16.
 */

'use strict';

const http = require('request');
const jsdom = require('jsdom');
const fs = require('fs');
const crypto = require('crypto');

let numChanged = 0;
let index = 0;

http.get("http://virmedica.atlassian.net/wiki/rest/api/content/36864032\?expand\=body.storage.content", function(err, response) {
    let body = JSON.parse(response.body);
    let htmlString = body.body.storage.value;

    jsdom.env(htmlString, ["http://code.jquery.com/jquery.js"], function(err, window) {

        window.$("a").each( function() {
            let url = cleanString(window.$(this).text());
            let prefix = url.substring(url.length - 4);

            if (prefix === '.pdf') {
                downloadPDF(url, window.$("a").length);
            }

            else {
                downloadHtmlSite(url, window.$("a").length)
            }
        });
    });
}).auth(process.env.SENTINEL_CONFLUENCE_USER, process.env.SENTINEL_CONFLUENCE_PASSWORD);

function downloadHtmlSite(url, len) {
    http.get(url, function(err, response) {
        let fileName = crypto.createHash('md5').update(url).digest('hex'); // Give each file a unique name
        let dataHash = crypto.createHash('md5').update(response.body).digest('hex'); // Get site data as md5 hash
        //
        compareHash(fileName, dataHash, function(matches) {
            if (!matches) {
                console.log(`${url} has changed`);
            }
            index++;
            if (index >= len) {
                console.log(`Found ${numChanged} outdated policies`);
            }
            writeHash(fileName, dataHash);
        });
    });
}

function downloadPDF(url, len) {
    http.get(url, function(err, response) {
        let pdfName = generateHash(url);
        let dataHash = generateHash(response.body);
        //
        compareHash(pdfName, dataHash, function(matches) {

           if (!matches) {
               console.log(`${url} has changed`);
           }
           index++;
            if (index >= len) {
                console.log(`Found ${numChanged} outdated policies`);
            }
           writeHash(pdfName, dataHash);
        });
    });
    //http.get(url).pipe(fs.createWriteStream(pdfName + '.pdf'));
}

function generateHash(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function writeHash(fileName, hash) {
    fs.writeFile(fileName + '.md5', hash, function(err) {
        if (err) {
            console.log(err);
            throw err;
        }

    });
}

function compareHash(fileName, newHash, callback) {
    fs.readFile(fileName + '.md5', {encoding: 'utf-8'}, function(err, data) {
        if (err) {
            console.log('File not found');
            return callback(true);
        }
        let matches = data === newHash;

        if (!matches) {
            numChanged++;
        }

        return callback(matches);
    });
}

function cleanString(str) {
    str.replace(/(\n|\r)+$/, '');
    return str.trim();
}

