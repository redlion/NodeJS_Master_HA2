/*
 *
 * Application Configuration file
 * 
 */

var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3031,
  'envName': 'staging',
  'hashingSecret': 'wiahf9wlwn2k348x'
};

// Production environment
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5031,
  'envName': 'production',
  'hashingSecret': 'aiwnos22k9siv9w02'
}

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check the current environment is one of the environments above, if not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;