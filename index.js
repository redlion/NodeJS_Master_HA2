/*
 *
 * Entry for pizza delivery company API
 * 
 */

const server = require('./lib/server.js');

const app = {};

app.init = function() {
  server.init();
};

//start the application
app.init();

