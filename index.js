var db = require('./models');

module.exports.server = function(port, app, http, url, username, password) {
    
    if (!port && !app && !http) {
        // Set the port to either, the first argument passed to console (after the filename)
        // or set it to the value in process.env.PORT or default to 3000 if neither of the 
        // other values are present
        port = process.argv[2] || process.env.PORT || 3000;
    }

    
    var rtc = require('./recording');
    
    // Get required modules
    var Express = require('express'),
        Session = require('express-session'),
         flash = require('express-flash'),
         //app = express(),
         //http = require('http').Server(app),
         BodyParser = require( 'body-parser' ), 
         CookieParser = require('cookie-parser'),
         Passport = require('passport'),
         PassportLocal = require('passport-local');
         
    
    var AuthStrategy = PassportLocal.Strategy;

    // TODO : learn about keys
    // Use the cookie parser middle ware to parse cookie headers
    app.use(CookieParser('secretString'));
    ses = Session({
      secret: 'pass',
      resave: true,
      saveUninitialized: true
    });
    
    
    app.use(ses);
    
    // Storing values in app means that can be accessed
    // by an module that can access app
    // Store directory root
    app.set('root', __dirname);
    // Store reference to passport
    app.set('passport', Passport);
    
    app.set('db', db);
    
        // Set up passport for authentication
    app.use(Passport.initialize());
    app.use(Passport.session());

    
    Passport.serializeUser(function(user, done) {
        // Only serialise the Id to keep data
        // stored in sessions to a minimum.
        done(null, user._id);
    });

    Passport.deserializeUser(function(id, done) {
        // To deserialise, use the ID to search for the
        // user in the DB.
        db.User.findById(id, function(err, user) {
            done(null, user);
        });
    });

    // Set a Local Authentication Strategy for login.
    Passport.use('login', new AuthStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
            db.User.authenticate(username, password, function(err, user) {   
                
                // If error is thrown pass it to done() and return
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
    
    var ect = require('ect');
    var renderer = ect({ watch: true, root: app.get('root') + '/views', ext : '.ect' });
    
    // Set ECT as the view engine.
    // So that ECT templates and layouts can be used to
    // build the html to be sent to clients.
    app.set('view engine' ,'ect');
    app.engine('ect', renderer.render);
    app.use(renderer.compiler({ root : '/views', gzip: true }));


    // Set up access to static files
    app.use(Express.static('public'));


    
    // Use flash so that flash messages can be sent to pages
    // e.g. notifications when a database has saved
    app.use(flash());

    // Use the body parser middleware to parse form data from requests
    app.use(BodyParser.urlencoded({ extended: true }));

    var signallingServer = require('./signalling');
    signallingServer.set(http, db, ses);

    var accountManager = require('./account-manager');
    accountManager.set(Passport, db);

    var controllers = require('./controllers/index.js');
    controllers.set(app, Passport, db, signallingServer, accountManager);

    
    
    
    // Set up controllers;
    var adminController = require('./controllers/admin')(app, db);
    var sessionController = require('./controllers/session')(app, db);
    var themeController = require('./controllers/theme')(app, db);
    var installationController = require('./controllers/installation')(app, db, adminController);
    var userController = require('./controllers/user.js')(app);
    
    // Pass controllers to routes
    var adminRoutes = require('./routes/admin')(app, adminController, sessionController, themeController);
    var installationRoutes  = require('./routes/installation')(app, installationController);
    var userRoutes  = require('./routes/user')(app, userController);
    
    
    

/*
    // Listen for http requests on the port
    // indicated in 'port' variable.
    http.listen(port, function(){
        // Indicate the the port is listening
        console.log('Listening on port ' + port);
    });
    
    */
    
    


module.exports.renderRoom = function(sessionName, userId, req, res) {
    
    
    userController.renderRoom(req, res);
    
}

    
    
    
    module.exports.render = function(sessionId, options, callback) {
        
        // Find the session in the database based on the sessionId passed by the user
        db.Session.findOne({ url : sessionId }, function(err, session) {
            
            // If err or session not found, render relevant error pages
            if (err) {
                callback(renderError(renderer, 'An Error Ocurred','Please check the url and try again.'));
            } else if (!session) {
                callback(renderError(renderer, 'Chat session not found', 'Please check the url and try again.'));
            } else {
            
                // Find the room for the requested session
                db.Room.findOne({ roomId: session.roomId }, function(err, room){

                    // If err or room not found render relevant error messages
                    if (err) {
                        callback(renderError(renderer, 'An Error Ocurred','Please check the address and try again.'));
                    } else if (!room) {
                        callback(renderError(renderer, 'Chat session not found', 'Please check the address and try again.'));
                    }

                    // Find the them for the current room
                    db.Theme.findOne({ themeName: room.themeName }, function(err, theme) {

                        var cssUrl = '';
                        // if the theme is found and it has custom css then generate the url to the css class
                        if (theme && theme.hasCustomCss) {
                            cssUrl = 'themes/' + encodeURIComponent(theme.themeName) + '.css'
                        } else {
                            cssUrl = 'default.css';   
                        }

                        // Render the sessions
                        callback(renderer.render('session', {
                            username: options.username,
                            standalone: options.standalone,
                            scripts: [  '/socket.io/socket.io.js',
                                        '/scripts/jquery.min.js',
                                        '/scripts/ect.min.js',
                                        '/scripts/adapter.js',
                                        '/scripts/MyWebRTC.js',
                                        '/scripts/MyWebRTC-Connection.js',
                                        '/scripts/MyWebRTC-UI.js',
                                        '/scripts/MyWebRTC-Com.js',
                                        '/scripts/MyWebRTC-File.js',
                                        '/scripts/Client.js',
                                        '//cdn.jsdelivr.net/emojione/1.5.0/lib/js/emojione.min.js'
                                     ],
                            styles: [  '/styles/' + cssUrl, 
                                    '/styles/mobile.css',
                                    '//cdn.jsdelivr.net/emojione/1.5.0/assets/css/emojione.min.css'
                                 ]
                        }));

                    });

                });
            }

        });


    }

    // Method to render the error page, with custom messages
    var renderError = function renderInfo(res, title, message) {
        res.render('info', {
            title: title,
            message: message
        });
    };
    
    
    
    

}

module.exports.database = function(url, username, password, prefix) {
    
    prefix = prefix || '';
    // initliase the DB
    db.init(url, username, password, prefix);   
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




