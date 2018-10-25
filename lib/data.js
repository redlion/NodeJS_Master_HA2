/*
 *
 * Library for writing and reading data
 * 
 */

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const dataStore = {};

dataStore.baseDir = path.join(__dirname, '/../.data/');

// Write data to file
dataStore.create = function(dir, file, data, cb) {
  // Try to open the file
  fs.open(dataStore.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
    if(!err && fileDescriptor) {
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it.
      fs.writeFile(fileDescriptor, stringData, function(err) {
        if(!err) {
          fs.close(fileDescriptor, function(err) {
            if(!err) {
              cb(false);
            } else {
              cb('Error closing new file');
            }
          });
        } else {
          cb('Error writing to the new file');
        }
      });
    } else {
      cb('Could not create new file, it may already exist.');
    }
  });
};

// Read data from a file
dataStore.read = function(dir, file, cb) {
  fs.readFile(dataStore.baseDir + dir + '/' + file + '.json', 'utf8', function(err, data) {
    if(!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      cb(false, parsedData);
    } else {
      cb(err, data);
    }
  });
};

// Update data inside file
dataStore.update = function(dir, file, data, cb) {
   fs.open(dataStore.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor) {
     if(!err && fileDescriptor) {
       // Convert data to string
       var stringData = JSON.stringify(data);

       // Truncate the file
       fs.ftruncate(fileDescriptor, function(err) {
         if(!err) {
           // Write to the file and close it
           fs.writeFile(fileDescriptor, stringData, function(err) {
             if(!err) {
               fs.close(fileDescriptor, function(err) {
                 if(!err) {
                   cb(false);
                 } else {
                   cb('Error closing the file.');
                 }
               });
             } else {
               cb('Error writing to existing file');
             }
           });
         } else {
           cb('Error truncating file');
         }
       });
     } else {
       cb('Could not open file for updating, it may not exist yet');
     }
   });
};

// Delete file
dataStore.delete = function(dir, file, cb) {
  fs.unlink(dataStore.baseDir + dir + '/' + file + '.json', function(err) {
    if(!err) {
      cb(false);
    } else {
      cb('Error deleting file');
    }
  });
}

// List all items in directory
dataStore.list = function(dir, cb) {
  fs.readdir(dataStore.baseDir + dir + '/', function(err, data) {
    if(!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach(function(fileName) {
        trimmedFileNames.push(fileName.replace('.json', ''));
      });
      cb(false, trimmedFileNames);
    } else {
      cb(err, data);
    }
  });
}

// Export the module
module.exports = dataStore;