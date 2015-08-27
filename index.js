var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require( 'body-parser' );
var passport = require('passport');
var passportLocal = require('passport-local');

app.set('root', __dirname);

var AuthStrategy = passportLocal.Strategy;

// The port the app will listen to
var port = 3000;

// Set up access to static files
app.use('/styles', express.static('Styles'));
app.use('/js', express.static('JS'));
app.use('/socket.io', express.static('socket.io'));
app.use('/examples', express.static('examples'));
app.use('/images', express.static('images'));


app.use(passport.initialize());
//app.use(passport.session);
app.use(bodyParser.urlencoded({ extended: true }));



// 
var db = require('./database');

var controllers = require('./controllers');
controllers.set(app, passport, db);


var signallingServer = require('./signalling');
signallingServer.set(http, db);

passport.serializeUser(function(user, done) {
    console.log('serialize');
  done(null, user);
});

passport.deserializeUser(function(user, done) {
    console.log('deserialize');
  done(null, user);
});

passport.use(new AuthStrategy(
    function(username, password, done) {

        db.User.findOne({
          'username': username
        }, function(err, user) {

          if (err) {
            return done(err);
          }

          if (!user) {
            return done(null, false);
          }

          if (user.password != password) {
            return done(null, false);
          }

          return done(null, user);
        });
        
    }
));

http.listen(port, function(){
    console.log('Listening on port ' + port);
});

/* var options = {
    name: 'something',
    roomName: '',
    roomId: '',
    url: '',
    password: ''
    Embedable: ''
}

var callback = function(session, err){}
*/

module.exports.createSession = function(options, callback) {
    
    var dbCallback = function(err, room) {
            if (room) {
                addSession(options.name, options.url, room.roomId, options.embeddable, options.password);
            } else if (err) {
                callback(null, err.message);
            } else {
                callback(null, "Room not found");   
            }
    };
    
    // Find the room either by id or name depending on the user input
    if (options.roomId) {
        db.Room.findOne({ roomId : options.roomId }, dbCallback);
    } else {
        db.Room.findOne({ name : options.roomName }, dbCallback);                 
    }
}

// Method to add a session
function addSession(name, url, roomId, embeddable, password) {
            
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
            addCredentials(session.sessionId, req.body.password ,function(err, credentials, numberAffected) {
                callback(session, null);
            });
        }
    });
}
        
// Method to store the credentials of a session
function addCredentials(sessionId, password, callback) {
    var newPassword = new db.SessionCredentials({
        sessionId: sessionId,
        password: password
    });
    newPassword.save(callback);
}





