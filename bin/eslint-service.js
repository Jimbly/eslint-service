#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const assert = require('assert');
const child_process = require('child_process');
const { PORT, HOST } = require('../lib/config.js');
const fs = require('fs');
const http = require('http');
const path = require('path');


// The supported options, as used by SublimeLinter-eslint
assert.equal(argv.stdin, true);
assert.equal(argv.format, 'json');
//assert(argv['stdin-filename']); // Not strictly needed

argv.code = fs.readFileSync(0, 'utf-8');
let data = JSON.stringify(argv);

function tryit(on_error) {
  function onError(err) {
    if (on_error) {
      on_error(err);
      on_error = null;
    }
  }
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/eslint',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(data, 'utf8'),
    },
  };

  const req = http.request(options, (res) => {
    let res_data = '';
    res.on('data', (d) => {
      res_data += d;
    });
    res.on('end', () => {
      if (res.statusCode !== 200 && res.statusCode !== 400) {
        console.log(`Unexpected status code: ${res.statusCode}`);
      }
      console.log(res_data);
      if (res.statusCode !== 200) {
        process.exitCode = -1;
      }
    });
    res.on('error', onError);
  });

  req.on('error', onError);
  req.write(data);
  req.end();
}

tryit(function (err) {
  // Failed, presumably service not running, try to start it...
  let subprocess = child_process.spawn('node', [path.join(__dirname, '../lib/service-worker.js')], {
    detached: true,
    stdio: 'ignore',
  });
  subprocess.unref();
  let retries = 10;
  function doTry(err) {
    if (!--retries) {
      console.error(err);
      process.exitCode = -1;
      return;
    }
    tryit(function (err) {
      setTimeout(function () {
        doTry(err);
      }, 1000);
    });
  }
  doTry(err);
});
