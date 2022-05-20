/*
 * enables jsdom globally.
 */

var KEYS = require('jsdom-global/keys')
var defaultHtml = '<!doctype html><html><head><meta charset="utf-8">' +
  '</head><body></body></html>'

function globalJsdom (options) {
  html = defaultHtml

  if (options === undefined) {
    options = {}
  }

  // Idempotency
  if (global.navigator &&
    global.navigator.userAgent &&
    global.navigator.userAgent.indexOf('Node.js') > -1 &&
    global.document &&
    typeof global.document.destroy === 'function') {
    return global.document.destroy
  }

  var jsdom = require('jsdom')
  var document = new jsdom.JSDOM(html, options)
  var window = document.window

  KEYS.forEach(function (key) {
    global[key] = window[key]
  })

  var fetch = require('node-fetch');

  global.document = window.document
  global.window = window
  window.console = global.console
  window.fetch = fetch
  document.destroy = cleanup

  function cleanup () {
    KEYS.forEach(function (key) { delete global[key] })
  }

  return cleanup
}
globalJsdom({
  url: 'http:localhost/'
});