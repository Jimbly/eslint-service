const assert = require('assert');
const http = require('http');
const path = require('path');
const { PORT, HOST, TIMEOUT } = require('./config.js');

let server;

function doTimeout() {
  console.log(new Date().toISOString(), '[ESLINT SERVICE WORKER] timeout');
  server.close();
}

console.log('[ESLINT SERVICE WORKER] startup');

let timeout;
function resetTimeout() {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(doTimeout, TIMEOUT);
}
resetTimeout();

const cache = new Array(10);
let cache_idx = 0;

let ESLint;
server = http.createServer((req, res) => {
  console.log(new Date().toISOString(), '[ESLINT SERVICE WORKER] request');
  if (!ESLint) {
    // eslint-disable-next-line global-require
    ESLint = require('eslint').ESLint;
  }
  resetTimeout();
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    for (let ii = 0; ii < cache.length; ++ii) {
      let entry = cache[ii];
      if (entry && entry.data === data) {
        res.statusCode = entry.code;
        res.setHeader('Content-Type', 'text/plain');
        res.end(entry.result);
        return;
      }
    }
    try {
      data = JSON.parse(data);
      // console.log({
      //   ...data,
      //   code: '<>',
      // });
    } catch (e) {
      console.log(e);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(e && e.stack || e.toString());
      return;
    }

    (async function main() {
      let overrideConfig;
      if (data.rule) {
        overrideConfig = {
          rules: {},
        };
        let pair = data.rule.split('=');
        overrideConfig.rules[pair[0]] = pair[1];
      }
      let cwd;
      if (data['stdin-filename']) {
        cwd = path.dirname(data['stdin-filename']);
      }
      // 1. Create an instance.
      const eslint = new ESLint({ ignore: false, overrideConfig, cwd });

      // 2. Lint files.
      const results = await eslint.lintText(data.code, {
        filePath: data['stdin-filename'],
      });
      if (!results.length) {
        // Files that have `/.` in their path
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(JSON.stringify([{
          messages: [
            {
              ruleId: 'ignored',
              severity: 1,
              message: 'File appears to be ignored by ESLint',
              line: 1,
              column: 1,
              endLine: 1,
              endColumn: 1
            }
          ],
          errorCount: 1,
          warningCount: 0,
          fixableErrorCount: 0,
          fixableWarningCount: 0,
        }]));
        return;
      }
      assert.equal(results.length, 1);
      let result = results[0];
      delete result.source; // noisy, not needed?
      // delete result.usedDeprecatedRules; // noisy, not needed?
      let is_error = result.errorCount || result.warningCount;

      // 3. Format the results.
      const formatter = await eslint.loadFormatter(data.format);
      const resultText = formatter.format(results);

      // 4. Output it.
      let entry = cache[cache_idx++] = {
        code: is_error ? 400 : 200,
        result: resultText,
      };
      cache_idx %= cache.length;
      res.statusCode = entry.code;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(entry.result);
    }()).catch((error) => {
      let err = error && error.stack || error.toString();
      console.error(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(err);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(new Date().toISOString(), `[ESLINT SERVICE WORKER] listening at http://${HOST}:${PORT}/`);
});
