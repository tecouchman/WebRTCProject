module.exports.set = function(app, passport, db) {
    
    var url = require('url');
    var ect = require('ect');
    var renderer = ect({ watch: true, root: app.get('root') + '/views', ext : '.ect' });
    
    // Set ECT as the view engine.
    // So that ECT templates and layouts can be used to
    // build the html to be sent to clients.
    app.set('view engine' ,'ect');
    app.engine('ect', renderer.render);
    app.use(renderer.compiler({ root : '/views', gzip: true }));
    
    // Set up routing for get requests made to the base URL.
    // Sends index.html to the client.
    app.get('/room/[a-zA-Z0-9]{1,9}', function(req, res) {
        res.sendFile(app.set('root') + '/index.html'); 
    });

    // Set up routing for get requests made to the base URL.
    // Sends index.html to the client.
    app.get('/install', function(req, res) {
            db.User.findOne({

            }, function(err, user) {

              if (err) {
                res.sendFile(__dirname + '/admin/error.html');   
              }

                // TODO: renabled this check
              if (true || !user){

                app.post('/register',
                    function (req, res) {

                        var adminAccount = new db.User({ 
                                                username: req.body.username, 
                                                password: req.body.password,
                                                emailAddress : req.body.email });
                        adminAccount.save();

                        // Take the user to the dashboard
                        res.sendFile(__dirname + '/admin/dashboard.html'); 
                    }
                );

                res.sendFile(__dirname + '/admin/install.html');
              } else {
                res.sendFile(__dirname + '/admin/install_complete.html');   
              }
            });
    });


    // Listener for when a user request the login page
    app.get('/login', function(req, res) {

        // Parse the request url to get access to the different parts
        var loginUrl = url.parse(req.url, true);
        // Store whether the query string indicates that
        // a previous failed attempt has been made.
        // This is passed to the page so a message can be displayed.
        var failedAttempt = !loginUrl.query.success;

        // Render the page using ECT middleware.
        // Pass in the failed attempt variable
        res.render('admin/login', {
            scripts: [ '/JS/jquery.min.js','JS/admin/login.js' ],
            failedAttempt: failedAttempt
        }); 

    });

    // When a user posts their account details from the the login page
    app.post('/login',
      passport.authenticate('local', {
        successRedirect : '/admin',
        failureRedirect : '/login?success=false'
      })
    );

    // On HTTP Get for admin page
    app.get('/admin', function(req, res) {

        res.redirect(302, '/admin/rooms'); 
    });

    // On get request for rooms list
    app.get('/admin/rooms', function(req, res) {

        db.Room.find(function(err, rooms) {
            res.render('admin/room-list', {
                rooms: rooms,
                scripts: [  '/JS/jquery.min.js', '/JS/admin/room-list.js' ]
            }); 
        });
    });


    // On client room delete request with the id of the room to be deleted.
    app.delete('/admin/rooms/[0-9]+', function(req, res) {

        // Get the roomId from the end of the request URL
        var roomId = getUrlQuery(req.originalUrl);

        // Search for the room based on the URL
        db.Room.findOne({ roomId: roomId },function(err, room) {
            // If the room is found
            if (room) {
                // Delete it
                room.remove();
                // Send a success message
                res.send({status:"ok", message:"Room " + room.name + " deleted."});
            } else {
                // If the room is not found return a failure message
                res.send({status:"nok", message:"Room could not be deleted"}); 
            }
        });
    });

    // On client get request for the sessions list
    app.get('/admin/sessions', function(req, res) {

        // Search teh db for all sessions
        db.Session.find(function sessionResultsCallback(err, sessions) {
            // Render the sessions list, and pass in the session data
            res.render('admin/session-list', {
                sessions: sessions,
                scripts: [ '/JS/jquery.min.js', '/JS/admin/session-list.js' ]
            }); 
        });
    });

    // On client session delete request with the id of the room to be deleted.
    app.delete('/admin/sessions/[0-9]+', function(req, res) {

        // Get the sessionId from the end of the request URL
        var sessionId = getUrlQuery(req.originalUrl);

        // Search for the room based on the URL
        db.Session.findOne({ sessionId: sessionId },function(err, session) {
            // If the session is found
            if (session) {
                // Delete it
                session.remove();
                // Send a success message
                res.send({status:"ok", message:"Session " + session.name + " deleted."});
            } else {
                // If the session is not found return a failure message
                res.send({status:"nok", message:"Session could not be deleted"}); 
            }
        });
    });


    // On client get request for the add session page
    app.get('/admin/add_session', function(req, res) {

        db.Room.find(function sessionResultsCallback(err, rooms) {

            res.render('admin/add-session', {
                scripts: [ '/JS/jquery.min.js', '/JS/admin/session-add.js' ],
                rooms: rooms
            }); 
        });

    });

    // On client post to the add session page
    app.post('/admin/add_session', function (req, res) {

            var newSession = new db.Session({
                name: req.body.name,
                url: req.body.url,
                embeddable: req.body.embeddable,
                roomId: req.body.roomId,
                passwordProtected : req.body.passwordProtected
            });
            newSession.save(function(err, session, numberAffected) {
                if (req.body.passwordProtected 
                    && req.body.password != null 
                    && req.body.password != '') {
                        addCredentials(session.sessionId, req.body.password ,function(err, password, numberAffected) {
                            res.redirect(302, '/admin/sessions'); 
                        });
                } else {
                    // Take the user to the dashboard
                    res.redirect(302, '/admin/sessions'); 
                }
            });
        }
    );
    
    function addCredentials(sessionId, password, callback) {
        var newPassword = new db.SessionCredentials({
            sessionId: sessionId,
            password: password
        });
        newPassword.save(callback);
    }

    app.get('/admin/edit_session/[0-9]+', function(req, res) {

        // Get the session id from the requested url
        var sessionId = getUrlQuery(req.originalUrl);

        // Find the room in the DB and show the edit page for that room
        db.Session.findOne({
            sessionId: sessionId
        }, function(err, session) {
            // If the sessions is found, display it
            if (session) {
                // Search the db for all rooms
                db.Room.find(function sessionResultsCallback(err, rooms) {
                    res.render('admin/edit-session', {
                        session: session,
                        rooms: rooms,
                        baseURL: req.headers.host,
                        scripts: [ '/JS/jquery.min.js', '/JS/admin/session-add.js' , '/JS/admin/session-edit.js' ]
                    }); 
                });
            } else {
                // else redirect the user to the room list
                res.redirect(302, '/admin'); 
            }

        });

    });

    app.post('/admin/edit_session/[0-9]+',
        function (req, res) {
            // Get the session id from the requested url
            var sessionId = getUrlQuery(req.originalUrl);

            var conditions = { sessionId: sessionId };
            // Create a object to hold the new values
            var updatedValues = { 
                name: req.body.name,
                url: req.body.url,
                embeddable: req.body.embeddable,
                roomId: req.body.roomId,
                passwordProtected : req.body.passwordProtected
            };

            // Call update on the Sessions model, passing in the
            // conditions that identify the session to update and the 
            // values to update. On complete redirect to the sessions list
            db.Session.update(conditions, updatedValues, {}, function() {
                
                db.SessionCredentials.findOne({ sessionId : sessionId }, function(err, sessionCredential) {
                    
                    var redirect = function() { res.redirect(302, '/admin/sessions') }; 
                    
                    if (sessionCredential) {
                        if (req.body.passwordProtected) {
                            sessionCredential.password = req.body.password;
                            sessionCredential.save(redirect);
                        } else {
                            sessionCredential.remove();
                        }
                       
                    } else {
                        if (req.body.passwordProtected) {
                            addCredentials(sessionId, req.body.password, redirect);   
                        } else {
                            redirect();
                        }
                    }
                    
                });
            });
        }
    );


    app.get('/admin/settings', function(req, res) {

        var stunServers, turnServers;

        db.IceServer.find({ type: 'STUN' }, function(err, servers) {
            if (servers) {
                stunServers = servers;
            } else {
                stunServers = [];   
            }
            reqCompleted();
        });
        db.IceServer.find({ type: 'TURN' }, function(err, servers) {
            if (servers) {
                turnServers = servers;
            } else {
                turnServers = [];   
            }
            reqCompleted();
        });

        // Called when each of the requests completed
        // When all of the data is available, the page is returned to the user.
        var reqCompleted = function() {
            if (stunServers && turnServers) {
                res.render('admin/settings', {
                    stunServers: stunServers,
                    turnServers: turnServers,
                    scripts: [  '/JS/jquery.min.js', '/JS/ect.min.js' ,'/JS/admin/settings.js' ]
                });    
            }
        }

    });

    // On post of ice server from client
    app.post('/admin/ice-servers',
        function (req, res) {

            // Create a new room with the data from the add_room form
            var newServer = new db.IceServer({ 
                serverURL: req.body.url,
                type: req.body.type
            });
            newServer.save(function() {
                // Send the success status back to the user
                res.send({status:"ok", message:"URL " + req.body.url + " added to database"});
            });
        }
    );

    // On post of ice server from client
    app.delete('/admin/ice-servers',
        function (req, res) {

            // Search for the room based on the URL
            db.IceServer.findOne({ serverURL: req.body.url },function(err, server) {
                // If the server is found
                if (server) {
                    // Delete it
                    server.remove();
                    // Send a success message
                    res.send({status:"ok", message:"Server " + server.serverURL + " deleted."});
                } else {
                    // If the server was not found return a failure message
                    res.send({status:"nok", message:"Server could not be deleted"}); 
                }
            });
        }
    );
    
    app.get('/admin/add_room', function(req, res) {

        res.render('admin/add-room', {
            scripts: [ '/JS/admin/add-room.js' ]
        }); 

    });

    app.post('/admin/add_room',
        function (req, res) {
            console.log('Adding room: ' + req.body.name);
            // Create a new room with the data from the add_room form
            var newRoom = new db.Room({ 
                name: req.body.name,
                maxUsers: req.body.maxUsers,
                hasVideo: req.body.hasVideo,
                hasAudio: req.body.hasAudio,
                hasMessaging: req.body.hasMessaging,
                hasFilesharing: req.body.hasFilesharing,
                hasCustomUserIds: req.body.hasCustomUserIds,
                theme: req.body.theme,
                recordAudio: req.body.recordAudio,
                recordVideo: req.body.recordVideo,
                logMessages: req.body.logMessages,
                fullscreenEnabled: req.body.fullscreenEnabled
            });
            newRoom.save(function() {
                // Take the user to the dashboard
                res.redirect(302, '/admin/rooms'); 
            });
        }
    );

    app.post('/admin/edit_room/[0-9]+',
        function (req, res) {
            // Get the room number from the requested url
            var roomId = getUrlQuery(req.originalUrl);

            var conditions = { roomId: roomId };
            // Create a object to hold the new values
            var updatedValues = { 
                name: req.body.name,
                maxUsers: req.body.maxUsers,
                hasVideo: req.body.hasVideo,
                hasAudio: req.body.hasAudio,
                hasMessaging: req.body.hasMessaging,
                hasFilesharing: req.body.hasFilesharing,
                hasCustomUserIds: req.body.hasCustomUserIds,
                theme: req.body.theme,
                recordAudio: req.body.recordAudio,
                recordVideo: req.body.recordVideo,
                logMessages: req.body.logMessages,
                fullscreenEnabled: req.body.fullscreenEnabled
            };

            // Call update on the Room model, passing in the
            // conditions that identify the room to update and the 
            // values to update. On complete redirect to the rooms list
            db.Room.update(conditions, updatedValues, {}, function() {
                // Take the user to the dashboard
                res.redirect(302, '/admin/rooms'); 
            });
        }
    );

    app.get('/admin/edit_room/[0-9]+', function(req, res) {

        // Get the room number from the requested url
        var room = getUrlQuery(req.originalUrl);

        // Find the room in the DB and show the edit page for that room
        db.Room.findOne({
            roomId: room
        }, function(err, room) {
            // If the room is found, display it
            if (room) {
                res.render('admin/edit-room', {
                    scripts: [ 'JS/admin/add-room.js' ],
                    room: room
                }); 
            } else {
                // else redirect the user to the room list
                res.redirect(302, '/admin'); 
            }

        });

    });
    
    app.get('/admin/logs/', function(req, res) {
        
        db.Message.distinct('sessionId', function(err, sessionIds){
            
            db.Session.find({ sessionId : {$in:sessionIds} }, function(err, sessions) {
                            
                res.render('admin/logs', {
                    sessions: sessions,
                    scripts: [  '/JS/jquery.min.js', '/JS/ect.min.js' ,'/JS/admin/settings.js' ]
                });              
            }); // end find sessions based on unique ids
        }); // end find unique session ids in message
    }); // end get /admin/logs
    
    
    app.get('/admin/logs/[0-9]+', function(req, res) {
        
        // Get the sessionId from the requested url
        var sessionId = getUrlQuery(req.originalUrl);
        
        db.Message.find({ sessionId : sessionId } ,function(err, messages) {

            res.render('admin/session-log', {
                messages: messages,
                sessionId : sessionId,
                scripts: [  '/JS/jquery.min.js', '/JS/ect.min.js' ,'/JS/admin/logs.js' ]
            });              
        }); // end find sessions based on unique ids

    });
    
        app.get('/admin/logs/[0-9]+', function(req, res) {
        
        // Get the sessionId from the requested url
        var sessionId = getUrlQuery(req.originalUrl);
        
        db.Message.find({ sessionId : sessionId } ,function(err, messages) {

            res.render('admin/session-log', {
                messages: messages,
                scripts: [  '/JS/jquery.min.js', '/JS/ect.min.js' ,'/JS/admin/settings.js' ]
            });              
        }); // end find sessions based on unique ids

    });
    
    // On client log delete request with the sessionId of the logs to be deleted.
    app.delete('/admin/logs/[0-9]+', function(req, res) {

        // Get the sessionId from the end of the request URL
        var sessionId = getUrlQuery(req.originalUrl);

        // Search for the room based on the URL
        db.Message.remove({ sessionId: sessionId },function(err) {
            // If the room is found
            if (err) {
                // If the room is not found return a failure message
                res.send({status:"nok", message:"Logs could not be deleted"}); 
            } else {
                // Send a success message
                res.send({status:"ok", message:"Logs deleted."});
            } 
        });
    });

    
    // Returns the content after the final forward slash in a URL
    function getUrlQuery(url) {
        return url.substr(url.lastIndexOf('/') + 1);;
    }
}