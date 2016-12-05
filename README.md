# sentinel
Sentinel is a simple monitoring tool that allows you to track webpages (.html and .pdf currently) for changes over time. Sentinel generates an md5 hash of the pages that you want to monitor, and then compares that hash to any existing hash for that site. If the hashes do not match, the page or the content of the pdf has changed. Sentinel currently uses Twilio to send a text notification when that content has changed.

## Recommended method of running Sentinel
It is recommended that the Sentinel frontend (found in [/lib](https://github.com/stormageddon/sentinel/tree/master/lib)) is running on an accessible remote server. This hapi server will serve the Sentinel Webapp, which is a very minimal frontend allowing anyone to add a new url to begin monitoring.

The [sentinel.js](https://github.com/stormageddon/sentinel/blob/master/sentinel.js) script should be setup in your preferred environment as a scheduled task. This script will do the actual comparison to determine if a watched resource has changed. The Sentinel Frontend is simply for populating the configuraiton file that the Sentinel Script will use to do the comparison.

## Environment Variables
Sentinel uses a number of environment variables. Make sure these are all set to valid values, or the script will not run.
