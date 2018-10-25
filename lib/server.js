/*
 *
 * Server file
 * 
 */

const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const helpers = require('./helpers');
const config = require('./config');
const handlers = require('./handlers');

var server = {};

server.httpServer = http.createServer( function(req, res) {
  // Get the url and parse
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  //var trimmedPath = path.replace(/^\/+|\/+$/g, '');
  var route = path.replace(/^\/api\/v1\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  // Get the headers as an object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');

  var buffer = '';

  req.on('data', function(data) {
    buffer += decoder.write(data);
  });

  req.on('end', function() {
    buffer += decoder.end();

    // choose the handler for this request, if it's not found then use notFound
    var chosenHandler = typeof(server.router[route]) !== 'undefined' ? server.router[route] : server.router['notFound'];

    var data = {
      'route': route,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    chosenHandler(data, function(statusCode, payload) {
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      payload = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  })

});

// Define a request server.router
server.router = {
  'users': handlers.users,
  'tokens': handlers.tokens,
  'menu': handlers.menu,
  'carts': handlers.carts,
  'notFound': handlers.notFound
};

// Init function
server.init = function() {
  // Start http server
  server.httpServer.listen(config.httpPort, function() {
    helpers.msg(`The server is listening on port ${config.httpPort} in ${config.envName} now`);
  });
};

module.exports = server;