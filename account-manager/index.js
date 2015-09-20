var passport, db;

module.exports.set = function(_passport, _db) {
    passport = _passport;   
    db = _db;
    
    var nodemailer = require('nodemailer'),
        async = require('async');
    
    
    module.exports.addAdminAccount = function(username, password, email, callback) {
        var adminAccount = new db.User({ 
            username: username, 
            password: password,
            emailAddress : email });
        adminAccount.save(callback);
    }
    
    module.exports.checkAccount = function(callback) {
        db.User.findOne({}, function(err, user) {
            // TODO: remove !, this is just for testing
            if (user) {
                callback(true);   
            } else {
                callback(false);   
            }

        });   
    }
    
    module.exports.checkCredentials = function checkCredentials(username, password, callback) {
        
        // Search for the user via the username
        db.User.findOne({
          'username': username
        }, function(err, user) {
            var match = user.password == password;
            callback(err, match);
        });
        
    }
}

    