var db = require('./database');

module.exports.server = function(port, url, username, password) {
    
    if (!port) {
        port = process.env.PORT || 3000;
    }

    var express = require('express');
    var flash = require('express-flash');
    var app = express();
    var http = require('http').Server(app);
    var bodyParser = require( 'body-parser' );
    var cookieParser = require('cookie-parser');
    var passport = require('passport');
    var passportLocal = require('passport-local');
    var session = require('express-session');

    app.set('root', __dirname);

    var AuthStrategy = passportLocal.Strategy;

    // The port the app will listen to

    // Set up access to static files
    app.use(express.static('public'));

    // TODO : learn about keys
    app.use(cookieParser('secretString'));
    app.use(session({cookie: { maxAge: 600000 }}));
    app.use(flash());

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(bodyParser.urlencoded({ extended: true }));

    var signallingServer = require('./signalling');
    signallingServer.set(http, db);

    var accountManager = require('./account-manager');
    accountManager.set(passport, db);

    var controllers = require('./controllers/index.js');
    controllers.set(app, passport, db, signallingServer, accountManager);

    passport.serializeUser(function(user, done) {
        // Only serialise the Id to keep data
        // stored in sessions to a minimum.
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        // To deserialise, use the ID to search for the
        // user in the DB.
        db.User.findById(id, function(err, user) {
            done(null, user);
        });
    });

    // Set a Local Authentication Strategy for login.
    passport.use('login', new AuthStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
            // use the getAccount method on the accountManager.
            // password will be automatically encryted by the 
            // getAccount method before comparison
            db.User.findOne({
                username: username,
                password: password
            }, function(err, user) {        
                // If error is thrown pass it to done()
                if (err) {
                    return done(err);
                }

                // If user is not found then username or password
                // were incorrect. So pass false to done and set up
                // a message to display via req.flash()
                if (!user) {
                    return done(null, 
                            false,
                            req.flash('err', 'Incorrect username or password. Please try again.'));
                }

                // If no error and a user is returned, then 
                // login was successful, return user in done()
                // to indicate success.
                return done(null, user);
            });

        }
    ));

    // Listen for http requests on the port
    // indicated in 'port' variable.
    http.listen(port, function(){
        // Indicate the the port is listening
        console.log('Listening on port ' + port);
    });

}

module.exports.database = function(url, username, password) {
    // initliase the DB
    db.init(url, username, password);   
}

/* var options = {
    name: 'something',
    roomName: '',
    roomId: '',
    url: '',
    password: ''
    Embedable: ''
}

var callback = function(err, session){}
*/
module.exports.createSession = function(options, callback) {
    
    var dbCallback = function(err, room) {
            if (room) {
                addSession(options.name, options.url, room.roomId, options.embeddable, options.password, callback);
            } else if (err) {
                callback(err, null);
            } else {
                callback({ message: "Room not found"}, null);   
            }
    };
    
    // Find the room either by id or name depending on the user input
    if (options.roomId) {
        db.Room.findOne({ roomId : options.roomId }, dbCallback);
    } else if (options.roomName) {
        db.Room.findOne({ name : options.roomName }, dbCallback);                 
    } else {
        callback({ message: "Room not found"}, null); 
    }
}

// Method to add a session
function addSession(name, url, roomId, embeddable, password, callback) {
            
    var hasPassword = password != null && password != '';
    
    var newSession = new db.Session({
        name: name,
        url: url,
        embeddable: embeddable,
        roomId: roomId,
        passwordProtected : hasPassword
    });
    newSession.save(function(err, session, numberAffected) {
        if (hasPassword) {
            addCredentials(session.sessionId, password ,function(err, credentials, numberAffected) {
                console.log('credentials saved: ' + credentials);
                callback(null, session);
            });
        } else {
            callback(null, session);
        }
    });
}
        
// Method to store the credentials of a session
function addCredentials(sessionId, password, callback) {
    var newCredential = new db.SessionCredentials({
        sessionId: sessionId,
        password: password
    });
    newCredential.save(callback);
}





