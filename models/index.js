var connected = false;

module.exports.connected = function(){ return connected; };

module.exports.init = function(url, username, password, prefix) {
    
    // If prefix undefined, set it to an empty string
    prefix = prefix || '';
    
    // Require mongoose for database connectivity
    var mongoose = require('mongoose');
    
    // Connect to the database - TODO: section out the db stuff so another type of db can be used?
    mongoose.connect('mongodb://' + username + ':' + password + '@' + url);
    connected = true;

    // Export the DB Models, so they can be accessed from elsewhere
    module.exports.User = require('./User')(mongoose, prefix);
    module.exports.Room = require('./Room')(mongoose, prefix);
    module.exports.Session = require('./Session')(mongoose, prefix);
    module.exports.FileOptions = require('./FileOptions')(mongoose, prefix);
    module.exports.IceServer = require('./IceServer')(mongoose, prefix);
    module.exports.SessionCredentials = require('./SessionCredentials')(mongoose, prefix);
    module.exports.Message = require('./Message')(mongoose, prefix);
    module.exports.Theme = require('./Theme')(mongoose, prefix);
    module.exports.PasswordReset = require('./PasswordReset')(mongoose, prefix);

}
