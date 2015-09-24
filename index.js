/*
    Main InstantRTC module.
    Sets up the routes, controllers, and backend API
    
    @author Tom Couchman
*/

// Import required modules
var db = require('./models');
        config = require('./config'),
        Express = require('express'),
        Session = require('express-session'),
        flash = require('express-flash'),
        // Parses request body, allowing access to posted values
        BodyParser = require( 'body-parser' ), 
        CookieParser = require('cookie-parser'),
        Passport = require('passport'),
        PassportLocal = require('passport-local'),
        AuthStrategy = PassportLocal.Strategy,
        ect = require('ect');


/* Init */
module.exports.init = function (port) {
    
    if (!port) {
        // Set the port to either, the first argument passed to console (after the filename)
        // or set it to the value in process.env.PORT or default to 3000 if neither of the 
        // other values are present
        port = process.argv[2] || process.env.PORT || 3000;
    }
    
    // Create an instance of express
    var app = Express(),
        // Setup http server and pass in express instance
        http = require('http').Server(app);
    
    // init the app based on the express and http server
    module.exports.initShared(app, http);
        
    // Set http server to listen for requests on the port
    // stored in the 'port' variable.
    http.listen(port, function(){
        // Indicate the the port is listening
        console.log('InstantRTC Started');
        console.log('Listening on port ' + port);
    });
    
}

module.exports.initShared = function(app, http) {

    // Load the config data, to set up the database.
    config.getConfig(function(config) {
		
		if (config.dbURL) {
        	// init the db
        	var connection = db.init(config.dbURL, config.dbUser, config.dbPassword, config.dbTablePrefix, function(connection) {
				if (!connection) {
					console.log('Could not connect to the databse. Please ensure that mongoDB is running.');	
				}
			});
			
		} else {
			console.log('Database details have not beed entered. Please go to \'/install\' in your browser.');	
		}

    });
    
    // Use the cookie parser middleware to parse cookie headers
    app.use(CookieParser('123mdjdjdnqwndjE!WFV4'));
    // Set up a session to store values required for chat rooms
    ses = Session({
      secret: '123mdjdjdnqwndjE!WFV4eqeq2',
      resave: true,
      saveUninitialized: true
    });
    // Link the session middleware to app, so the session
    // can be used in conjunction with express
    app.use(ses);
    
    // Storing values in app means that can be accessed
    // by an module that can access app
    // Store directory root
    app.set('root', __dirname);
    // Store reference to passport
    app.set('passport', Passport);
    
    // Set up passport for authentication
    app.use(Passport.initialize());
    app.use(Passport.session());
    
        // Set up passport serialisation/deserialisation - allows
    // passport to add authenticated user info to the session
    
    // Only serialise the user Id to the session
    Passport.serializeUser(function(user, done) {
        // Only serialise the Id to keep data
        // stored in sessions to a minimum.
        done(null, user._id);
    });

    // Deserialising find the user in the db based on the 
    // information stored in the session
    Passport.deserializeUser(function(id, done) {
        // To deserialise, use the id stored in the session 
        // to search for the user in the DB.
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
    
    // Set ECT as the view engine.
    // So that ECT templates and layouts can be used to
    // build the html to be sent to clients.
    var renderer = ect({ watch: true, root: app.get('root') + '/views', ext : '.ect' });
    app.set('view engine' ,'ect');
    app.engine('ect', renderer.render);
    app.use(renderer.compiler({ root : '/views', gzip: true }));

    // Set up access to static files
    app.use(Express.static(__dirname + '/public'));

    // Use flash so that flash messages can be sent to pages
    // e.g. notifications when a database has saved
    app.use(flash());

    // Use the body parser middleware to parse form data from requests
    app.use(BodyParser.urlencoded({ extended: true }));

    // Store access to the db in app object
    app.set('db', db);

    // Start the signalling server
    var signallingServer = require('./signalling');
    signallingServer.init(http, db, ses);   

    // Set up controllers;
    var adminController = require('./controllers/admin')(app, db);
	var roomController = require('./controllers/Room')(app, db);
    var sessionController = require('./controllers/session')(app, db);
    var themeController = require('./controllers/theme')(app, db);
    var installationController = require('./controllers/installation')(app, db, adminController);
    var userController = require('./controllers/user.js')(app);

    // Pass controllers to routes
    var adminRoutes = require('./routes/admin')(app, adminController, sessionController, themeController, roomController);
    var installationRoutes  = require('./routes/installation')(app, installationController);
    var userRoutes  = require('./routes/user')(app, userController);

    // Set up the backend API
    var api = require('./api')(app, renderer, userController);
    return api;
    
}

// The DB can also be
module.exports.database = function(url, username, password, prefix) {
    
    prefix = prefix || '';
    // initliase the DB
    db.init(url, username, password, prefix);   
}

