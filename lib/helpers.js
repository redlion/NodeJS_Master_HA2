
const crypto = require('crypto');
const config = require('./config');

const helpers = {};

helpers.msg = function(message, colorChoice) {
  const color = {};

  color.Reset = "\x1b[0m";
  color.Bright = "\x1b[1m";
  color.Dim = "\x1b[2m";
  color.Underscore = "\x1b[4m";
  color.Blink = "\x1b[5m";
  color.Reverse = "\x1b[7m";
  color.Hidden = "\x1b[8m";
   
  color.FgBlack = "\x1b[30m";
  color.FgRed = "\x1b[31m";
  color.FgGreen = "\x1b[32m";
  color.FgYellow = "\x1b[33m";
  color.FgBlue = "\x1b[34m";
  color.FgMagenta = "\x1b[35m";
  color.FgCyan = "\x1b[36m";
  color.FgWhite = "\x1b[37m";
   
  color.BgBlack = "\x1b[40m";
  color.BgRed = "\x1b[41m";
  color.BgGreen = "\x1b[42m";
  color.BgYellow = "\x1b[43m";
  color.BgBlue = "\x1b[44m";
  color.BgMagenta = "\x1b[45m";
  color.BgCyan = "\x1b[46m";
  color.BgWhite = "\x1b[47m";

  var chosenColor = "";

  if(colorChoice != null && color.hasOwnProperty(colorChoice)) {
    chosenColor = color[colorChoice];
  } else {
    chosenColor = color.Reset;
  }

  console.log(chosenColor, message);
};

helpers.parseJsonToObject = function(buffer) {
  try {
    var obj = JSON.parse(buffer);
    return obj;
  } catch(e) {
    return {};
  }
};

helpers.hash = function(str) {
  if (typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHash('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

  if (strLength) {
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';

    for(i = 1; i <= strLength; i++) {
      // Get a random character from the possibleCharacters string
      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

      // Append the random character to the final string
      str += randomCharacter;
    }

    // Return the final string
    return str;

  } else {
    return false;
  }
}

module.exports = helpers;