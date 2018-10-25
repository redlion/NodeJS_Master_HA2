/*
 *
 * Request handlers
 * 
 */

const dataStore = require('./data');
const helpers = require('./helpers');

var handlers = {};

handlers.notFound = function(data, cb) {
  cb(404);
};

// Users public interface
handlers.users = function(data, cb) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, cb);
  } else {
    cb(405);
  }
};

// Users private methods container
handlers._users = {};

// Users private post method
handlers._users.post = function(data, cb) {
  var firstName = _validateData.firstName(data.payload.firstName);

  var lastName = _validateData.lastName(data.payload.lastName);

  var email = _validateData.email(data.payload.email);

  var password = _validateData.password(data.payload.password);

  var tosAgreement = _validateData.tosAgreement(data.payload.tosAgreement);

  if (firstName && lastName && email && password && tosAgreement) {
    // Make sure the user does not exist
    dataStore.read('users', email, function(err, data) {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          var userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'hashedPassword': hashedPassword,
            'cart': "",
            'tosAgreement': true
          };

          // Store the user
          dataStore.create('users', email, userObject, function(err) {
            if(!err) {
              cb(200);
            } else {
              console.log(err);
              cb(500, {'Error': 'Could not create the new user'});
            }
          });
        } else {
          cb(500, {'Error': 'Could not hash the user\'s password'});
        }
      } else {
        // User already exists
        cb(400, {'Error': 'A user with that phone number already exists'});
      }
    });
  } else {
    console.log(firstName, lastName, email, password, tosAgreement);
    cb(400, {'Error': 'Missing required field(s)'});
  }
};

// Users private get method
handlers._users.get = function(data, cb) {
  var email = _validateData.email(data.payload.email);

  if (email) {
    // Get the token from the headers
    var token = _validateData.tokenId(data.headers.token);

    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token, email, function(tokenValidation) {
      if (tokenValidation) {
        // Lookup the user
        dataStore.read('users', email, function(err, readData) {
          if (!err && readData) {
            // Remove the hashed password from the object before returning it to the requestor
            delete readData.hashedPassword;
            cb(200, readData);
          } else {
            cb(404);
          }
        });
      } else {
        cb(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    cb(400, {'Error': 'Missing required field'});
  }
};

// Users - put
handlers._users.put = function(data, cb) {
  // Check for the required field
  var email = _validateData.email(data.payload.email);

  var firstName = _validateData.firstName(data.payload.firstName);

  var lastName = _validateData.lastName(data.payload.lastName);

  var password = _validateData.password(data.payload.password);

  if (email) {
    if (firstName || lastName || password) {
      // Get the token from the headers
      var token = _validateData.tokenId(data.headers.token);

      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
          // Lookup the user
          dataStore.read('users', email, function(err, userData) {
            if (!err && userData) {
              // Update the fields
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }

              // Store the new updates
              dataStore.update('users', email, userData, function(err) {
                if (!err) {
                  cb(200);
                } else {
                  cb(500, {'Error': 'Could not update the user'});
                }
              });
            } else {
              cb(400, {'Error': 'The specified user does not exists'});
            }
          });
        } else {
          cb(403, {'Error': 'Missing required token in header, or token is invalid'});
        }
      });
    } else {
      cb(400, {'Error': 'Missing fields to update'});
    }
  } else {
    cb(400, {'Error': 'Missing required field'});
  }
};

// Users - delete
handlers._users.delete = function(data, cb) {
  // Check that the phone number is valid
  var email = _validateData.email(data.queryStringObject.email);

  if (email) {
    // Get the token from the headers
    var token = _validateData.tokenId(data.headers.token);

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        dataStore.read('users', email, function(err, userData) {
          if (!err && userData) {
            dataStore.delete('users', email, function(err) {
              if (!err) {
                // Delete related data if any!!!

              } else {
                cb(500, {'Error': 'Could not delete the user'});
              }
            })
          } else {
            cb(400, {'Error': 'Could not find the specified user'});
          }
        })
      } else {
        cb(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    cb(400, {'Error': 'Missing required field'});
  }
}


// tokens
handlers.tokens = function(data, cb) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, cb);
  } else {
    cb(405);
  }
}

// private container for token methods
handlers._tokens = {};

// tokens post
handlers._tokens.post = function(data, cb) {
  var email = _validateData.email(data.payload.email);

  var password = _validateData.password(data.payload.password);

  if (email && password) {
    // Look up the user who matches that email
    dataStore.read('users', email, function(err, userData) {
      if (!err && userData) {
        // Hash the sent password and compare it to the password stored in the user logic.
        var hashedPassword = helpers.hash(password);

        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set expiration date 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          dataStore.create('tokens', tokenId, tokenObject, function(err) {
            if (!err) {
              cb(200, tokenObject);
            } else {
              cb(500, {'Error': 'Could not create the new token'});
            }
          });
        } else {
          cb(400, {'Error': 'Password did not match.'});
        }
      } else {
        cb(400, {'Error': 'Could not find the specified user'});
      }
    })
  } else {
    cb(400, {'Error': 'Missing required fields'});
  }
};

// Tokens - get 
handlers._tokens.get = function(data, cb) {
  // Check that the id is valid
  var id = _validateData.tokenId(data.queryStringObject.id);

  if (id) {
    // Look up the token
    dataStore.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        cb(200, tokenData);
      } else {
        cb(404);
      }
    })
  } else {
    cb(400, {'Error': 'Missing required field'});
  }
};

// Tokens - put
handlers._tokens.put = function(data, cb) {
  var id = _validateData.tokenId(data.payload.id);
  var extend = _validateData.extend(data.payload.extend);

  if (id && extend) {
    // Look up token
    dataStore.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure the token is not already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          dataStore.update('tokens', id, tokenData, function(err) {
            if(!err) {
              cb(200);
            } else {
              cb(500, {'Error': 'Could not update the token\'s expiration'});
            }
          });
        } else {
          cb(400, {'Error': 'The token has already expired, and cannot be extended.  Please sign in again.'});
        }
      } else {
        cb(400, {'Error': 'Specified token does not exist'});
      }
    });
  } else {
    cb(400, {'Error': 'Missing required fields or fields are invalid'});
  }
};

// Tokens - delete
handlers._tokens.delete = function(data, cb) {
  // Check that the id is valid
  var id = _validateData.tokenId(data.queryStringObject.id);

  if (id) {
    // Lookup the user
    dataStore.read('tokens', id, function(err, readData) {
      if (!err && readData) {
        dataStore.delete('tokens', id, function(err) {
          if (!err) {
            cb(200);
          } else {
            cb(500, {'Error': 'Could not delete the token'});
          }
        });
      } else {
        cb(400, {'Error': 'Could not find the specified token'});
      }
    });
  } else {
    cb(400, {'Error': 'Missing required field'});
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, email, cb) {
  // Lookup the token
  dataStore.read('tokens', id, function(err, tokenData) {
    if (!err && tokenData) {
      // check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        cb(true);
      } else {
        cb(false);
      }
    } else {
      cb(false);
    }
  });
};


// Menu items
handlers.menu = function(data, cb) {
  var acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, cb);
  } else {
    cb(405);
  }
};

handlers._menu = {};

// Get menu
handlers._menu.get = function(data, cb) {
  //var availableItems = ['plain', 'pepperoni', 'hawaiian', 'supreme'];

  var token = _validateData.tokenId(data.headers.token);
  var email = _validateData.email(data.headers.email);

  if(token && email) {
    // See if the token is valid for that user.
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if(tokenIsValid) {
        dataStore.list('menu', function(err, menuItems) {

          if(!err && menuItems && menuItems.length > 0) {
            // get the id from queryString, if not found then return the entire menu
            var id = typeof(data.queryStringObject.id) == 'string' &&     menuItems.indexOf(data.queryStringObject.id.trim()) > -1 ? data.queryStringObject.id.trim() : false;

            if (id) {
              dataStore.read('menu', id, function(err, itemData) {
                if(!err && itemData) {
                  cb(200, itemData)
                } else {
                  cb(403);
                }
              });
            } else {
              var allItems = [];
              menuItems.forEach(function(item) {
                dataStore.read('menu', item, function(err, itemData) {
                  allItems.push(itemData);
                  if(menuItems.length == allItems.length && menuItems.indexOf(item) == menuItems.length - 1) {
                    cb(200, allItems);
                  }
                });
              });
            }
          } else {
            cb(500, {'Error': 'Could not find any menu items'});
          }
        });
      } else {
        cb(403);
      }
    });
  } else {
    cb(400, {'Error': 'Login to see the menu'});
  }

};


// Cart interface
handlers.carts = function(data, cb) {
  var acceptableMethods = ['get', 'post', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._carts[data.method](data, cb);
  } else {
    cb(405);
  }
};

handlers._carts = {};

handlers._carts.post = function(data, cb) {
  // get menu item from payload with quantity,
  // the user needs to be logged in with a valid token and matched email
  // create a cart and add the menu item to the cart if it is valid
  var token = _validateData.tokenId(data.headers.token);
  var email = _validateData.email(data.payload.email);

  if (token && email) {
    // Check to see if token is valid
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        var menuItem = _validateData.menuItem(data.payload.menuItem);

        var quantity = _validateData.quantity(data.payload.quantity);

        dataStore.read('menu', menuItem.name.toLowerCase(), function(err, itemData) {
          if(!err && itemData && quantity > 0) {
            var cartId = helpers.createRandomString(10);
            var lineItemObject = {
              'name': menuItem.name,
              'description': menuItem.description,
              'price': menuItem.price,
              'quantity': quantity,
              'itemTotal': menuItem.price * quantity
            };
            var cartItems = [lineItemObject];
            var cartObject = {
              'id': cartId,
              'email': email,
              'items': cartItems
            };

            // Store the cart
            dataStore.create('carts', cartId, cartObject, function(err) {
              if(!err) {
                dataStore.read('users', email, function(err, userData) {
                  if (!err && userData) {
                    userData.cart = cartId;

                    dataStore.update('users', email, userData, function(err) {
                      if (!err) {
                        cb(200, cartObject);
                      } else {
                        // if the user update fails, then delete the cart and report the error so there are no stale carts around.
                        dataStore.delete('carts', cartId, function(err) {
                          if (!err) {
                            cb(500, {'Error': 'Cannot update user with cart id, deleted cart file'});
                          } else {
                            cb(500, {'Error': 'Cannot delete cart file since update user file failed.  Stale Cart file ' + cartID});
                          }
                        });
                      }
                    });
                  } else {
                    cb(500, {'Error': 'Cannot read user data'});
                  }
                });
              } else {
                cb(500, {'Error': 'Could not create new cart'});
              }
            });
          } else {
            cb(400, {'Error': 'Item does not exist.  Cannot add to cart'});
          }
        });
      } else {
        cb(400, {'Error': 'Token is not valid'});
      }
    });
  } else {
    cb(400, {'Error': 'Missing required fields'});
  }
};

// Carts get
handlers._carts.get = function(data, cb) {
  var id = _validateData.cartId(data.queryStringObject.id);

  if (id) {
    dataStore.read('carts', id, function(err, cartData) {
      if (!err && cartData) {
        var token = _validateData.tokenId(data.headers.token);

        handlers._tokens.verifyToken(token, cartData.email, function(tokenIsValid) {
          if (tokenIsValid) {
            cb(200, cartData);
          } else {
            cb(403, {'Error': 'Token not valid'});
          }
        });
      } else {
        cb(404);
      }
    });
  } else {
    cb(400, {'Error': 'Missing required field'});
  }
};

// Carts put
handlers._carts.put = function(data, cb) {
  var id = _validateData.cartId(data.queryStringObject.id);

  if (id) {
    dataStore.read('carts', id, function(err, cartData) {
      if (!err && cartData) {
        var token = _validateData.tokenId(data.headers.token);

        handlers._tokens.verifyToken(token, cartData.email, function(tokenIsValid) {

          if (tokenIsValid) {
            var menuItem = _validateData.menuItem(data.payload.menuItem);
            var quantity = _validateData.quantity(data.payload.quantity);

            var itemIndex = cartData.items.findIndex(function(item) {
              return item.name.toLowerCase() === menuItem.name.toLowerCase();
            });
          
            if (itemIndex > -1) {
              // Item already in cart
              var existingItem = cartData.items[itemIndex];
              existingItem.quantity = existingItem.quantity + quantity;
              if (existingItem.quantity > 0) {
                existingItem.itemTotal = menuItem.price * existingItem.quantity;
                cartData.items.splice(itemIndex, 1, existingItem);
              } else {
                // delete the item from the cart
                cartData.items.splice(itemIndex, 1);
              }
            } else {
              // item is not already in cart, add it
              if (quantity > 0) {
                var lineItemObject = {
                  'name': menuItem.name,
                  'description': menuItem.description,
                  'price': menuItem.price,
                  'quantity': quantity,
                  'itemTotal': menuItem.price * quantity
                };
                cartData.items.push(lineItemObject);
              }
            }
          
            dataStore.update('carts', id, cartData, function(err) {
              if (!err) {
                cb(200, cartData);
              } else {
                cb(500, {'Error': 'Could not update the cart'});
              }
            });
          } else {
            cb(403, {'Error': 'Token invalid'});
          }
        });
      } else {
        cb(404, {'Error': 'Cart not found'});
      }
    });
  } else {
    cb(400, {'Error': 'Missing required field'});
  }
};

// Carts delete
handlers._carts.delete = function(data, cb) {
  // Check that the cart id is valid.
  var id = _validateData.cartId(data.queryStringObject.id);

  if (id) {
    dataStore.read('carts', id, function(err, cartData) {
      if (!err && cartData) {
        var token = _validateData.tokenId(data.headers.token);

        handlers._tokens.verifyToken(token, cartData.email, function(tokenIsValid) {
          if (tokenIsValid) {
            dataStore.delete('carts', id, function(err) {
              if (!err) {
                // Look up user to delete cart id from user data.
                dataStore.read('users', cartData.email, function(err, userData) {
                  if (!err && userData) {
                    userData.cart = "";

                    dataStore.update('users', cartData.email, userData, function(err) {
                      if (!err) {
                        cb(200);
                      } else {
                        cb(500, {'Error': 'Could not update the user'});
                      }
                    })
                  } else {
                    cb(500, {'Error': 'Could not find the user data so cannot remove the cart from user data'});
                  }
                });
              } else {
                cb(500, {'Error': 'Could not delete the cart data'});
              }
            })
          } else {
            cb(403);
          }
        })
      } else {
        cb(400, {'Error': 'The cart ID might not be valid or cannot read the cart data'});
      }
    });
  } else {
    cb(400, {'Error': 'Cart Id is not valid'});
  }
}

// Validate methods
// private validate data methods container
var _validateData = {};

// validate email
_validateData.email = function(email) {
  var emailValue = typeof(email) == 'string' &&
  email.trim().length > 0 && /^[A-Za-z0-9]+@[A-Za-z0-9]+.[A-Za-z]/.test(email.trim()) ? email.trim() : false;
  return emailValue;
};

// validate firstName
_validateData.firstName = function(firstName) {
  var firstNameValue = typeof(firstName) == 'string' && firstName.trim().length > 0 ? firstName.trim() : false;
  return firstNameValue;
};

// validate lastName
_validateData.lastName = function(lastName) {
  var lastNameValue = typeof(lastName) == 'string' && lastName.trim().length > 0 ? lastName.trim() : false;
  return lastNameValue;
};

// validate password
_validateData.password = function(password) {
  var passwordValue = typeof(password) == 'string' && password.trim().length > 0 ? password.trim() : false;
  return passwordValue;
};

// validate tosAgreement
_validateData.tosAgreement = function(tosAgreement) {
  var tosAgreementValue = typeof(tosAgreement) == 'boolean' && tosAgreement == true ? true : false;
  return tosAgreementValue;
};

_validateData.tokenId = function(id) {
   var idValue = typeof(id) == 'string' && id.trim().length == 20 ? id.trim() : false;
   return idValue;
};

_validateData.extend = function(extend) {
   var extendValue = typeof(extend) == 'boolean' && extend == true ? true : false;
   return extendValue;
};

_validateData.cartId = function(id) {
  var idValue = typeof(id) == 'string' && id.trim().length == 10 ? id.trim() : false;
  return idValue;
};

_validateData.menuItem = function(item) {
  var menuItem = typeof(item) == 'object' && typeof(item.name) == 'string' ? item : false;
  return menuItem;
};

_validateData.quantity = function(units) {
  var quantity = typeof(units) == 'number' ? units : false;
  return quantity;
};

module.exports = handlers;