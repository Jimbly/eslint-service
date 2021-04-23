/* eslint no-process-env:off */
exports.PORT = Number(process.env.ESLINT_PORT || '2881');
exports.HOST = process.env.ESLINT_HOST || '127.0.0.1';
exports.TIMEOUT = Number(process.env.ESLINT_TIMEOUT || 15*60) * 1000;
