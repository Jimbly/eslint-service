# eslint-service

ESLint service worker for maximally efficient editor integrations.  Also implements global config file support and improves feedback through SublimeLinter-eslint.

Installation: `npm install --global eslint-service`

Usage (Sublime Text):
* Install `SublimeLinter` through Package Control
* Install `SublimeLinter-eslint` through Package Control
* Open `Preferences: SublimeLinter Settings` through the command palette
* Configure like so:
```json
{
  "linters": {
    "eslint": {
      "executable": "eslint-service",
      "args": "--rule no-trailing-spaces=off"
    }
  }
}
```

Notes
* Binds to `localhost:2881` by default, can be configured by setting `ESLINT_PORT` and `ESLINT_HOST` environment variables
* Service worker sticks around for 15 minutes by default, can be configured by setting `ESLINT_TIMEOUT` environment variable (timeout in seconds)
* Only the particular command-line options (`eslint --format json --stdin --stdin-filename`) used by SublimeLinter-eslint, and a single `--rule foo=off` are currently supported, but it would be very easy to add additional support for other options, PRs welcome!
* Updated for ESLint v9
  * Use v0.0.x for odler ESLint versions
  * ESLint 9 requires a new config file format (eslint.config.js)
  * `eslint-service` re-adds global config file support (place in `~/eslint.config.js` or `%USERPROFILE%\eslint.config.js`)

Timing comparison (on a fully primed disk cache):
* `eslint`: 343ms
* `eslint-service`: 87ms
