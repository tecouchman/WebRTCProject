/**
    Admin Routes
*/

module.exports.set = function(app) {}
        
    var adminController = require('../controllers/admin');

    // Middleware for checking whether a user is authenticated.
    // Easily added to route code by placing the middleware method
    // name before the callback. Then called by express when a
    // request is made.
    var checkAuthenticated = function(req, res, next) {
        // If the request is authenticated then no action required,
        // simple call next() to allow to the next middleware.
        if (req.isAuthenticated()) {
            return next();   
        } else {
            // If the user is not authenticated
            // redirect to the login screen
            res.redirect('/admin/login');
        }
    }
    
    // Listener for when a user request the login page
    app.get('/admin/login', adminController.renderLogin);

    // When a user posts their account details from the the login page
    app.post('/admin/login', adminController.login);
    
    // Listener for when a user request the login page
    app.get('/admin/request_password_reset', adminController.render);

    // When a user posts their account details from the the login page
    app.post('/admin/request_password_reset', function(req, res) {

        // Generate random bytes to build teh token from
        crypto.randomBytes(25, function(ex, buf){
            
            // convert the bytes to a string, byt passing 
            // 'hex' the characters are limited so the token
            // will be url safe.
            var token = buf.toString('hex');
        
            // Find the user with the submitted email address
            db.User.findOne({ emailAddress: req.body.email }, function(err, user) {
                

                if (err) {
                    console.log('err getting user');
                    req.flash('err','An error occurred. Please try again later.'); 
                    res.redirect('/admin/request_password_reset');
                } else if (!user) {
                    console.log('user not found');
                    req.flash('err','Account not found. Please check your email address and try again');  
                    res.redirect('/admin/request_password_reset');
                } else {
                    
                    console.log('adding token to user');
                    user.passwordResetToken = token;
                    user.passwordResetTokenExpiry = Date.now() + 3600000; 
                    user.save(function(err) {
                        sendResetEmail(user, token, function(err) {
                            if (err) {
                                req.flash('err','Email could not be sent. Please try again later'); 
                            } else {
                                req.flash('info','Email sent. Please check your inbox for you password reset link.');
                            }
                            res.redirect('/admin/request_password_reset');
                        });
                    
                    });
   
                }
                
            });
        });
        
                
        var sendResetEmail = function (user, token, callback) {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'webrtcaddress@gmail.com',
                        pass: 'webrtcPassword'
                    }
                });
                transporter.sendMail({
                    from: 'no-reply@' + req.headers.host,
                    to: user.emailAddress,
                    subject: 'MyWebRTC Password Reset',
                    text: 'You are receiving this email because you have requested a password reset from ' + req.headers.host + '/admin/request_password_reset\n\n' +
                    'Click the following link to reset your password:\n\n' + 
                    'http://' + req.headers.host + '/admin/reset_password/' + token
                }, function(err, info) {
                    callback(err);
                });
        }
             
    });
    
    // Listener for when a user request the login page
    app.get('/admin/reset_password/:token', function(req, res) {

        
        console.log('token: ' + req.params.token);
        db.User.findOne({ passwordResetToken: req.params.token, 
                      passwordResetTokenExpiry: { $gt : Date.now() } },
                    function(err, user) {
            if (err) {
                req.flash('err','Something went wrong. Please try again later');
            } else if (!user) {
                req.flash('err','Invalid token');
            } 
            res.render('admin/reset-password', {
                messages: req.flash(),
            });
        });
    });
    
    // Listener for when a user request the login page
    app.post('/admin/reset_password/:token', function(req, res) {

        db.User.findOne({ passwordResetToken: req.params.token, 
                      passwordResetTokenExpiry: { $gt : Date.now() } },
                    function(err, user) {
            if (err) {
                req.flash('err','Something went wrong. Please try again later');
                res.redirect('/admin/reset_password');
            } else if (!user) {
                req.flash('err','Invalid token');
                res.redirect('/admin/reset_password');
            } else {
                user.password = req.body.password;
                user.passwordResetToken = null;
                user.passwordResetTokenExpiry = null;
                user.save(function(err) {
                    if (err) {
                        req.flash('err','Something went wrong. Please try again later');
                    } else {
                        req.flash('info','Password updated. Please log in.');   
                    }
                    res.redirect('/admin/login');  
                })
            }
            
        });
    });

    
    // When a logs out
    app.post('/admin/logout', function logoutPost(req, res) {
        // Destroy the session
        //req.session.destroy();
        // and log the user out
        req.logout();
        // The redirect to the login page
        res.redirect('/admin/login');
    });

    // On HTTP Get for admin page
    app.get('/admin', checkAuthenticated, function(req, res) {
        // Render the dashboard
        res.render('admin/dashboard', {
            user: req.user          
        }); 
    });
    
    // On get request for rooms list
    app.get('/admin/account', checkAuthenticated, function(req, res) {
        res.render('admin/account', {
            user: req.user,
            scripts: [  '/scripts/jquery.min.js', '/scripts/admin/account-settings.js' ]
        }); 
    });
    
    // Change password
    app.post('/admin/account/change-password', checkAuthenticated, function(req, res) {
        
        db.User.findOne({ username: req.user.username, password: req.body.oldPassword }, 
            function(err, user){
                
                if (user) {
                    user.password = req.body.newPassword ;
                    user.save(function(err) {
                        if (!err) {
                            req.flash('info', 'Password updated.');
                        } else {
                            req.flash('err','Update failed');   
                        }
                        res.redirect('/admin/account');
                    });
                } else {
                    if (err) {
                        req.flash('err','Update failed');
                    } else {
                        req.flash('err','Username or password incorrect');
                    }
                    res.redirect('/admin/account');
                }
            
            }
        );

    });
    
    // Change password
    app.post('/admin/account/change_email_address', checkAuthenticated, function(req, res) {
        
        db.User.findOne({ username: req.user.username }, 
            function(err, user){
                
                if (user) {
                    user.emailAddress = req.body.emailAddress ;
                    user.save(function(err) {
                        req.flash('info', 'Email address updated.')
                    });
                } else if (err) {
                    req.flash('err', 'Update failed')
                } 
                res.redirect('/admin/account');
            }
        );

    });

    // On get request for rooms list
    app.get('/admin/rooms', checkAuthenticated, function(req, res) {

        db.Room.find(function(err, rooms) {
            res.render('admin/room-list', {
                user: req.user,
                rooms: rooms,
                scripts: [  '/scripts/jquery.min.js', '/scripts/admin/room-list.js' ]
            }); 
        });
    });


    // On client room delete request with the id of the room to be deleted.
    app.delete('/admin/rooms/:roomId', checkAuthenticated, function(req, res) {

        // Get the roomId from the end of the request URL
        var roomId = req.params.roomId;

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
    app.get('/admin/sessions', checkAuthenticated, function(req, res) {

        // Search teh db for all sessions
        db.Session.find(function sessionResultsCallback(err, sessions) {
            // Render the sessions list, and pass in the session data
            res.render('admin/session-list', {
                user: req.user,
                sessions: sessions,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/session-list.js' ]
            }); 
        });
    });

    // On client session delete request with the id of the room to be deleted.
    app.delete('/admin/sessions/:sessionId', checkAuthenticated, function(req, res) {

        // Get the sessionId from the end of the request URL
        var sessionId = req.params.sessionId;

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
    
    // On client get request for the theme list
    app.get('/admin/themes', checkAuthenticated, function(req, res) {

        // Search teh db for all sessions
        db.Theme.find(function themeResultsCallback(err, themes) {
            // Render the theme list, and pass in the theme data
            res.render('admin/theme-list', {
                user: req.user,
                themes: themes,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/theme-list.js' ]
            }); 
        });
    });


    // On client get request for the add session page
    app.get('/admin/add_session', checkAuthenticated, function(req, res) {

        db.Room.find(function sessionResultsCallback(err, rooms) {

            res.render('admin/add-session', {
                user: req.user,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/session-add.js' ],
                rooms: rooms
            }); 
        });

    });

    // On client post to the add session page
    app.post('/admin/add_session', checkAuthenticated, function (req, res) {

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

    app.get('/admin/edit_session/:sessionId', checkAuthenticated, function(req, res) {

        // Get the session id from the requested url
        var sessionId = req.params.sessionId;

        // Find the room in the DB and show the edit page for that room
        db.Session.findOne({
            sessionId: sessionId
        }, function(err, session) {
            // If the sessions is found, display it
            if (session) {
                // Search the db for all rooms
                db.Room.find(function sessionResultsCallback(err, rooms) {
                    res.render('admin/edit-session', {
                        user: req.user,
                        session: session,
                        rooms: rooms,
                        baseURL: req.headers.host,
                        scripts: [ '/scripts/jquery.min.js', '/scripts/admin/session-add.js' , '/scripts/admin/session-edit.js' ]
                    }); 
                });
            } else {
                // else redirect the user to the room list
                res.redirect(302, '/admin'); 
            }

        });

    });

    app.post('/admin/edit_session/:sessionId', checkAuthenticated,
        function (req, res) {
            // Get the session id from the requested url
            var sessionId = req.params.sessionId;

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


    app.get('/admin/settings', checkAuthenticated, function(req, res) {

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
                    user: req.user,
                    stunServers: stunServers,
                    turnServers: turnServers,
                    scripts: [  '/scripts/jquery.min.js', '/scripts/ect.min.js' ,'/scripts/admin/settings.js' ]
                });    
            }
        }

    });

    // On post of ice server from client
    app.post('/admin/ice-servers', checkAuthenticated,
        function (req, res) {

            // Create a new room with the data from the add_room form
            var newServer = new db.IceServer({ 
                serverUrl: req.body.url,
                type: req.body.type
            });
            newServer.save(function() {
                // Send the success status back to the user
                res.send({status:"ok", message:"URL " + req.body.url + " added to database"});
            });
        }
    );

    // On post of ice server from client
    app.delete('/admin/ice-servers', checkAuthenticated,
        function (req, res) {

            // Search for the room based on the URL
            db.IceServer.findOne({ serverUrl: req.body.url },function(err, server) {
                // If the server is found
                if (server) {
                    // Delete it
                    server.remove();
                    // Send a success message
                    res.send({status:"ok", message:"Server " + server.serverUrl + " deleted."});
                } else {
                    // If the server was not found return a failure message
                    res.send({status:"nok", message:"Server could not be deleted"}); 
                }
            });
        }
    );
    
    
    
    
    
    app.get('/admin/add_theme', checkAuthenticated, function(req, res) {

        res.render('admin/edit-theme', {
            mode: 'add',
            user: req.user,
            scripts: [ '/scripts/jquery.min.js', '/scripts/admin/theme-edit.js' ]
        }); 

    });

    
    // TODO: check if theme name already exists before creating:
    
    app.post('/admin/add_theme', checkAuthenticated,
        function (req, res) {
            console.log('Adding theme: ' + req.body.themeName);
        
            var hasCustomCss = false;
            if (req.body.hasCustomCss && req.body.customCss != '') {
                hasCustomCss = true;

                var cssUrl = app.get('root') + '/public/styles/themes/' + encodeURIComponent(req.body.themeName) + '.css'
            
                fs.writeFile(cssUrl, req.body.customCss, function(err) {
                    if (err) {
                        console.log(err.message);   
                    }
                });
                
            }
        
            // Create a new room with the data from the add_room form
            var newTheme = new db.Theme({ 
                themeName: req.body.themeName,
                layoutName: req.body.layoutName,
                hasCustomCss : hasCustomCss
            });
        
            newTheme.save(function(err) {
                // Take the user to the dashboard
                res.redirect(302, '/admin/themes'); 
            });
        
            
        }
    );
    
    app.get('/admin/edit_theme/:themeName', checkAuthenticated, function(req, res) {
        
        // Get the theme name from the requested url
        var themeName = req.params.themeName;
        

        
        db.Theme.findOne({ themeName: themeName },function(err, theme) {
            
            var customCss = '';
            
            // Method to render the theme, defined as it will be called from different 
            // places depending on whether the page has custom css
            var renderEditTheme = function() {
                res.render('admin/edit-theme', {
                    mode: 'edit',
                    user: req.user,
                    theme: theme,
                    customCss : customCss,
                    scripts: [ '/scripts/jquery.min.js', '/scripts/admin/theme-edit.js' ]
                }); 
            }
            
            if (theme.hasCustomCss) {
            
                var cssUrl = app.get('root') + '/public/styles/themes/' + encodeURIComponent(theme.themeName) + '.css'
                console.log('reading: ' + cssUrl);
                fs.readFile(cssUrl, function(err, data) {
                    if (!err && data) {
                        customCss = data.toString();
                    } else if (err) {
                        console.log(err);   
                    }
                                    
                    console.log('read: ' + customCss);
                    
                    renderEditTheme();
                });   
            } else {
                renderEditTheme();   
            }
            

            

        });

    });
    

    
    app.post('/admin/edit_theme/:themeName', checkAuthenticated, function (req, res) {
            // Get the theme name from the requested url
            var themeName = req.params.themeName;

            var conditions = { themeName: themeName };
            // Create a object to hold the new values
            var updatedValues = { 
                themeName: req.body.themeName,
                layoutName: req.body.layoutName
            };

            // Call update on the theme model, passing in the
            // conditions that identify the theme to update and the 
            // values to update. On complete redirect to the themes list
            db.Theme.update(conditions, updatedValues, {}, function() {
                // Take the user to the dashboard
                res.redirect(302, '/admin/themes'); 
            });
        }
    );

    
    
    
    
    
    
    app.get('/admin/add_room', checkAuthenticated, function(req, res) {

        res.render('admin/add-room', {
            user: req.user,
            scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ]
        }); 

    });

    app.post('/admin/add_room', checkAuthenticated,
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
                fullscreenEnabled: req.body.fullscreenEnabled,
                popoutEnabled: req.body.popoutEnabled
            });
        
            newRoom.save(function(err) {
   
                // Take the user to the dashboard
                res.redirect(302, '/admin/rooms'); 

                
                if (req.body.hasFilesharing) {
                    console.log('newroom:' + newRoom.roomId);
                    var newFileOptions = new db.FileOptions({
                        roomId: newRoom.roomId,
                        maxFileSize: req.body.maxFileSize,
                        acceptedFileTypes: req.body.acceptedFileTypes.split(',')
                    });
                    newFileOptions.save();
                }
            });
        
            
        }
    );

    app.post('/admin/edit_room/:roomId', checkAuthenticated,
        function (req, res) {
            // Get the room number from the requested url
            var roomId = req.params.roomId;

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
                fullscreenEnabled: req.body.fullscreenEnabled,
                popoutEnabled: req.body.popoutEnabled
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

    app.get('/admin/edit_room/:roomId', checkAuthenticated, function(req, res) {

        // Get the room number from the requested url
        var room = req.params.roomId;

        // Find the room in the DB and show the edit page for that room
        db.Room.findOne({
            roomId: room
        }, function(err, room) {
            // If the room is found, display it
            if (room) {
                
                if (room.hasFilesharing) {
                    db.FileOptions.findOne({ roomId : room.roomId }, function(err, fileOptions) {
                        if (fileOptions && !err) {
                            res.render('admin/edit-room', {
                                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ],
                                room: room,
                                fileOptions : fileOptions
                            });  
                        } else {
                            // else redirect the user to the room list
                            res.redirect(302, '/admin'); 
                        }
                    });
                } else {
                    res.render('admin/edit-room', {
                        user: req.user,
                        scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ],
                        room: room
                    });  
                }
            } else {
                // else redirect the user to the room list
                res.redirect(302, '/admin'); 
            }

        });
    });
    
    app.get('/admin/logs/', checkAuthenticated, function(req, res) {
        
        db.Message.distinct('sessionId', function(err, sessionIds){
            
            db.Session.find({ sessionId : {$in:sessionIds} }, function(err, sessions) {
                            
                res.render('admin/logs', {
                    user: req.user,
                    sessions: sessions,
                    scripts: [ '/scripts/jquery.min.js', '/scripts/ect.min.js' ,'/scripts/admin/settings.js' ]
                });              
            }); // end find sessions based on unique ids
        }); // end find unique session ids in message
    }); // end get /admin/logs
    
    
    app.get('/admin/logs/:sessionId', checkAuthenticated, function(req, res) {
        
        // Get the sessionId from the requested url
        var sessionId = req.params.sessionId;
        
        db.Message.find({ sessionId : sessionId } ,function(err, messages) {

            res.render('admin/session-log', {
                user: req.user,
                messages: messages,
                sessionId : sessionId,
                scripts: [  '/scripts/jquery.min.js', '/scripts/ect.min.js' ,'/scripts/admin/logs.js' ]
            });              
        }); // end find sessions based on unique ids

    });
    
        app.get('/admin/logs/:sessionId', checkAuthenticated, function(req, res) {
        
        // Get the sessionId from the requested url
        var sessionId = req.params.sessionId;
        
        db.Message.find({ sessionId : sessionId } ,function(err, messages) {

            res.render('admin/session-log', {
                user: req.user,
                messages: messages,
                scripts: [  '/scripts/jquery.min.js', '/scripts/ect.min.js' ,'/scripts/admin/settings.js' ]
            });              
        }); // end find sessions based on unique ids

    });
    
    // On client log delete request with the sessionId of the logs to be deleted.
    app.delete('/admin/logs/:sessionId', checkAuthenticated, function(req, res) {

        // Get the sessionId from the end of the request URL
        var sessionId = req.params.sessionId;

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
    
    function getMultiDataAsyncManager(callback) {
        var multiArgs = arguments;
        
        return function() { 
            if (multiArgs.length == 1) {
                callback();   
            } else {
                var dataAvailable = true;
                for (var loop = 0; loop < multiArgs.length; loop++) {
                    if (multiArgs[loop] == undefined || multiArgs[loop] == null) {
                        dataAvailable = false;
                    }
                    if (dataAvailable) {

                    }
                }
            }
        }
    }
