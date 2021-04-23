# eslint-service
================

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
			"executable": "eslint-service"
		}
	}
}
```

Notes
* Binds to `localhost:2881` by default, can be configured by setting `ESLINT_PORT` and `ESLINT_HOST` environment variables
* Service worker sticks around for 15 minutes by default, can be configured by setting `ESLINT_TIMEOUT` environment variable (timeout in seconds)
