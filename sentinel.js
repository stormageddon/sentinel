/**
 * Created by mcaputo on 11/29/16.
 */

'use strict';

const VIRMEDICA_CONFLUENCE_URL = 'http://virmedica.atlassian.net/wiki/rest/api/content/36864032\?expand\=body.storage.content';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

const http = require('request');
const jsdom = require('jsdom');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');
const Mailgun = require('mailgun').Mailgun;
const mg = new Mailgun(MAILGUN_API_KEY);
const twilio = require('twilio');
const config = require('./lib/config.json');

let accountSid = process.env.TWILIO_SID;
let authToken = process.env.TWILIO_AUTH_TOKEN;

let client = new twilio.RestClient(accountSid, authToken);
let numChanged = 0;
let index = 0;



/*http.get(VIRMEDICA_CONFLUENCE_URL, function(err, response) {
    let body = JSON.parse(response.body);
    let htmlString = body.body.storage.value;

    // Parse the html string response to get all the links from the Confluence page
    jsdom.env(htmlString, ["http://code.jquery.com/jquery.js"], function(err, window) {
        console.log(`Checking ${window.$("a").length} policies for updates...`);
        window.$("a").each( function() {
            let linkUrl = cleanString(window.$(this).text());
            let prefix = linkUrl.substring(linkUrl.length - 4); // Check for a .pdf extension at the end of the url

            if (prefix === '.pdf') {
                downloadPDF(linkUrl, window.$("a").length);
            }

            else {
                downloadHtmlSite(linkUrl, window.$("a").length)
            }
        });
    });
}).auth(process.env.SENTINEL_CONFLUENCE_USER, process.env.SENTINEL_CONFLUENCE_PASSWORD);*/

function run() {
    // read in urls from config
    config.sites.forEach(function(site) {
        console.log('site:', site.url);
        let linkUrl = cleanString(site.url);
        let prefix = linkUrl.substring(linkUrl.length - 4); // Check for a .pdf extension at the end of the url

        if (prefix === '.pdf') {
            downloadPDF(linkUrl, config.sites.length);
        }

        else {
            downloadHtmlSite(linkUrl, config.sites.length);
        }
    });
}

let output = '';

function downloadHtmlSite(siteUrl, len) {
    http.get(cleanString(siteUrl), function(err, response) {

        if (err) {
            console.log('err:', err);
            return;
        }
        let fileName = url.parse(siteUrl).hostname + '-';
        fileName += crypto.createHash('md5').update(siteUrl).digest('hex'); // Give each file a unique name
        let dataHash = crypto.createHash('md5').update(response.body).digest('hex'); // Get site data as md5 hash

        compareHash(fileName, dataHash, function(matches) {
            if (!matches) {
                console.log(`${siteUrl} has changed`);
                output += `${siteUrl} has changed\n`;
            }
            index++;
            if (index >= len) {
                console.log(`Found ${numChanged} outdated policies`);
                output += `Found ${numChanged} outdated policies\n`;
                sendEmail();
                sendText();
            }
            writeHash(fileName, dataHash);
        });
    });
}

function downloadPDF(pdfUrl, len) {
    http.get(pdfUrl, function(err, response) {
        let pdfName = url.parse(pdfUrl).hostname + '-';
        pdfName += generateHash(pdfUrl);
        let dataHash = generateHash(response.body);
        //
        compareHash(pdfName, dataHash, function(matches) {

           if (!matches) {
               console.log(`${pdfUrl} has changed`);
               output += `${pdfUrl} has changed\n`;
           }
           index++;
            if (index >= len) {
                console.log(`Found ${numChanged} outdated policies`);
                output += `Found ${numChanged} outdated policies\n`;
                sendEmail();
                sendText();
            }
           writeHash(pdfName, dataHash);
        });
    });
}

/*
 * Utility Functions
 */

function generateHash(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function writeHash(fileName, hash) {
    fs.writeFile('hashes/' + fileName + '.md5', hash, function(err) {
        if (err) {
            console.log(err);
            throw err;
        }
    });
}

function compareHash(fileName, newHash, callback) {
    fs.readFile('hashes/' + fileName + '.md5', {encoding: 'utf-8'}, function(err, data) {
        if (err) {
            console.log('Loading new policy');
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

function sendEmail() {
    // if (numChanged <= 0) {
    //     return;
    // }
    return;
    let opts = {
        from: 'therubikscubekid@gmail.com',
        to: ['mike@caputo.io', 'therubikscubekid@gmail.com'],
        subject: 'Sentinel - Outdated Policies Found'
    };

    console.log(opts.from, opts.to, opts.subject, output);
    console.log(process.env.MAILGUN_API_KEY);

    mg.sendText(opts.from, opts.to, opts.subject, output, function(error, body) {
       console.log('mail error:', error);
    });
}

function sendText() {

    // if (numChanged <= 0) {
    //     return;
    // }

    client.messages.create({
        body: 'Sentinel Report - ' + output,
        to: process.env.TWILIO_TO_NUMBER,
        from: process.env.TWILIO_FROM_NUMBER
    }, function(err, message) {
        if (err) {
            console.log(err);
        }
    });

}

run();