const assert = require('assert');
const http = require('http');
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
    data = JSON.parse(data);

    (async function main() {
      // 1. Create an instance.
      const eslint = new ESLint();

      // 2. Lint files.
      const results = await eslint.lintText(data.code, {
        filePath: data['stdin-filename'],
      });
      assert.equal(results.length, 1);
      let result = results[0];
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
      res.setHeader('Content-Type', 'text/plain');
      res.end(entry.result);
    }()).catch((error) => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(error && error.stack || error.toString());
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(new Date().toISOString(), `[ESLINT SERVICE WORKER] listening at http://${HOST}:${PORT}/`);
});
