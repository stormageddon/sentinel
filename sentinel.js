#!/usr/bin/env node

/**
 * Created by mcaputo on 11/29/16.
 */

'use strict';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const BASE_PATH = process.env.SENTINEL_BASE_PATH;

const http = require('request');
const jsdom = require('jsdom');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');
const Mailgun = require('mailgun').Mailgun;
const mg = new Mailgun(MAILGUN_API_KEY);
const twilio = require('twilio');
const moment = require('moment');
const config = require(BASE_PATH + '/lib/config.json');


const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio.RestClient(accountSid, authToken);

let numChanged = 0;
let index = 0;

function run() {
    // read in urls from config
    config.sites.forEach(function (site) {
        console.log('site:', site.url);
        let linkUrl = cleanString(site.url);

        if (site.type === 'pdf') {
            downloadPDF(linkUrl, config.sites.length);
        }
        else {
            downloadHtmlSite(linkUrl, config.sites.length);
        }
    });
}

let output = '';

function downloadHtmlSite(siteUrl, len) {
    http.get(cleanString(siteUrl), function (err, response) {

        if (err) {
            console.log('err:', err);
            return;
        }
        let fileName = url.parse(siteUrl).hostname + '-';
        fileName += crypto.createHash('md5').update(siteUrl).digest('hex'); // Give each file a unique name
        let dataHash = crypto.createHash('md5').update(response.body).digest('hex'); // Get site data as md5 hash

        compareHash(fileName, dataHash, function (matches, newPolicy) {
            // Site has been updated
            if (!matches) {
                console.log(`${siteUrl} has changed`);
                output += `${siteUrl} has changed\n`;
            }

            if (!matches || newPolicy) {
                saveSnapshot(fileName, response, 'html');
                updateLastModified(siteUrl);
            }

            index++;
            if (index >= len) {
                console.log(`Found ${numChanged} outdated policies`);
                output += `Found ${numChanged} outdated policies\n`;
                // sendEmail();
                // sendText();
            }
            writeHash(fileName, dataHash);
        });
    });
}

function downloadPDF(pdfUrl, len) {
    let pdfName = url.parse(pdfUrl).hostname + '-';
    pdfName += generateHash(pdfUrl);

    let pdfMatches = true;

    http.get(pdfUrl, function (err, response) {

        let dataHash = generateHash(response.body);
        //
        compareHash(pdfName, dataHash, function (matches, newPolicy) {
            pdfMatches = matches;
            if (!matches) {
                console.log(`${pdfUrl} has changed`);
                output += `${pdfUrl} has changed\n`;
            }
            if (!matches || newPolicy) {
                // hack to pipe the pdf to file
                // Redownload the file until I can get streams working right
                http.get(pdfUrl).pipe(fs.createWriteStream(`${BASE_PATH}/snapshots/${pdfName}-${moment().format('MM-DD-YY')}.pdf`));

                updateLastModified(pdfUrl);
            }

            index++;
            if (index >= len) {
                console.log(`Found ${numChanged} outdated policies`);
                output += `Found ${numChanged} outdated policies\n`;
                //sendEmail();
                //sendText();
            }
            writeHash(pdfName, dataHash);
        });
    });
}

// Store a snapshot of the html content for future diffs
function saveSnapshot(site, response, extension) {
    let filename = `${BASE_PATH}/snapshots/${site}-${moment().format('MM-DD-YY')}.${extension}`;
    console.log('filename:', filename);
    if (extension === 'html') {
        fs.writeFile(filename, response.body, function (err) {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    }
    else {
        response.pipe(filename);
    }

}

// Update the lastUpdated field of the site configuration
function updateLastModified(url) {
    config.sites.map(function (site, index) {
        console.log(`${index}: ${site.url} ${site.last_updated}`);
        if (url === site.url) {
            config.sites[index].last_updated = moment().format('MM/DD/YY');
            saveConfigFile();
        }
    });
}

function saveConfigFile() {
    fs.writeFile(BASE_PATH + '/lib/config.json', JSON.stringify(config), function (err) {
        if (err) {
            throw err(err);
        }
    });
}

/*
 * Utility Functions
 */

function generateHash(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function writeHash(fileName, hash) {
    fs.writeFile(BASE_PATH + '/hashes/' + fileName + '.md5', hash, function (err) {
        if (err) {
            console.log(err);
            throw err;
        }
    });
}

function compareHash(fileName, newHash, callback) {
    fs.readFile(BASE_PATH + '/hashes/' + fileName + '.md5', {encoding: 'utf-8'}, function (err, data) {
        if (err) {
            console.log('Loading new policy');

            return callback(true, true);
        }
        let matches = data === newHash;

        if (!matches) {
            numChanged++;
        }

        return callback(matches, false);
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
        from: process.env.FROM_EMAIL,
        to: process.env.TO_EMAIL,
        subject: 'Sentinel - Outdated Policies Found'
    };

    console.log(opts.from, opts.to, opts.subject, output);
    console.log(process.env.MAILGUN_API_KEY);

    mg.sendText(opts.from, opts.to, opts.subject, output, function (error, body) {
        console.log('mail error:', error);
    });
}

function sendText() {

    // if (numChanged <= 0) {
    //     return;
    // }

    client.messages.create({
        body: `Sentinel Report (${moment().format('hh:mm MM/DD/YY')}) - ${output}`,
        to: process.env.TWILIO_TO_NUMBER,
        from: process.env.TWILIO_FROM_NUMBER
    }, function (err, message) {
        if (err) {
            console.log(err);
        }
    });

}

run();
