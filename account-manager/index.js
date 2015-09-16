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
    
    module.exports.sendPasswordResetEmail = function(username, callback) {
    
        //async.waterfall
        
            var directTransport = require('nodemailer-direct-transport');
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'webrtcaddress@gmail.com',
                    pass: 'webrtcPassword'
                }
            });
            transporter.sendMail({
                from: 'tecouchman@gmail.com',
                to: 'tcouchman01@qub.ac.uk',
                subject: 'Password Reset',
                text: 'Password reset info would be here'
            });
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

    