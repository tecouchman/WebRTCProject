/*
    Admin Controller.
    Handles requests for the admin section
    
    @author Tom Couchman
*/


module.exports = function(app, db) {
        
    var url = require('url'),
        async = require('async'),
        crypto = require('crypto'),
        emailer = require(app.get('root') + '/emailer')(app.get('sendEmailAddress'),app.get('sendEmailPassword'));
    
    
    // Object to be returned to the caller,
    // will provide access to various published methods.
    var exports = {};
    
    // Listener for when a user request the login page
    exports.renderLogin = function renderLogin(req, res) {

        res.locals.showTests = true;
        
        // Render the page using ECT middleware.
        // Pass in the req.flash message if there is one 
        // (will be when a failed login attempt has been made)
        res.render('admin/login', {
            scripts: [ '/scripts/jquery.min.js','scripts/admin/login.js' ],
            messages: req.flash()
        }); 

    };

    // When a user posts their account details from the the login page
    exports.login = app.get('passport').authenticate('login', {
                                successRedirect : '/admin',
                                failureRedirect : '/admin/login',
                                failureFlash : true
                              });
    
    // Listener for when a user request the login page
    exports.renderPasswordResetRequest = function renderPasswordResetRequest(req, res) {

        // Render the page using ECT middleware.
        // Pass in the req.flash message if there is one 
        // (will be when reset password button has been pressed)
        res.render('admin/request-password-reset', {
            messages: req.flash()
        });

    };

    // When a user posts their account details from the the login page
    exports.requestPasswordReset = function requestPasswordReset(req, res) {

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
                    
                    console.log('adding token to user: '+ user.id);
                    
                    db.PasswordReset.findOne({ userId: user.id }, function(err, passwordReset) {
                    
                        // if a reset was not found for this user, create a new one
                        if (!passwordReset) {
                            passwordReset = new db.PasswordReset({
                                userId: user.id,
                                resetToken: token,
                                resetTokenExpiry: Date.now() + 7200000
                            });   
                        } else {
                            // if already exists, just update.
                            passwordReset.resetToken = token;
                            passwordReset.resetTokenExpiry = Date.now() + 7200000;
                        }

                        passwordReset.save(function(err) {

                            
                        var subject = 'MyWebRTC Password Reset';
                        var body = 'To reset your password click the following link:\n' + 
            'http://' + req.headers.host + '/admin/reset_password/' + token +
            '\n\nIf you did not request a password reset, please ignore this email.';
                            
                        emailer.send(user.emailAddress, subject, body, function(err) {
                                if (err) {
                                    req.flash('err','Email could not be sent. Please try again later'); 
                                } else {
                                    req.flash('info','Email sent. Please check your inbox for you password reset link.');
                                }
                                res.redirect('/admin/request_password_reset');
                            });

                        });
                    });
                }
                
            });
        });
        
                

             
    };
    
    // Listener for when a user request the login page
    exports.renderPasswordReset = function renderPasswordReset(req, res) {

        db.PasswordReset.find({}, function(err, results) {
            console.log('results: ' + results);
        });
        
        console.log('req token: ' + req.params.token);
        
        db.PasswordReset.findOne({ resetToken: req.params.token, 
                      resetTokenExpiry: { $gt : Date.now() } },
                    function(err, passwordReset) {
            if (err) {
                req.flash('err','Something went wrong. Please try again later');
            } else if (!passwordReset) {
                req.flash('err','Invalid token');
            } 
            res.render('admin/reset-password', {
                messages: req.flash(),
                token: req.params.token
            });
        });
    };
    
    // Listener for when a user request the login page
    exports.resetPassword = function resetPassword(req, res) {
        console.log('my token: ' + req.params.token);
        db.PasswordReset.findOne({ resetToken: req.params.token, 
                      resetTokenExpiry: { $gt : Date.now() } },
                    function(err, passwordReset) {
            if (err) {
                req.flash('err','Something went wrong. Please try again later');
                res.redirect('/admin/reset_password');
            } else if (!passwordReset) {
                req.flash('err','Invalid token');
                res.redirect('/admin/reset_password');
            } else {
                passwordReset.remove();
                
                db.User.findOne({ _id: passwordReset.userId }, function(err, user) {
                    user.password = req.body.password;
                    user.save(function(err) {
                        if (err) {
                            req.flash('err','Something went wrong. Please try again later');
                        } else {
                            req.flash('info','Password updated. Please log in.');   
                        }
                        res.redirect('/admin/login');  
                    })
                
                });
            }
            
        });
    };

    
    // When a logs out
    exports.logout = function logout(req, res) {
        // Destroy the session
        //req.session.destroy();
        // and log the user out
        req.logout();
        // The redirect to the login page
        res.redirect('/admin/login');
    };

    // On HTTP Get for admin page
    exports.renderAdmin = function(req, res) {
        // Render the dashboard
        res.render('admin/dashboard', {
            user: req.user          
        }); 
    };
    
    // On get request for rooms list
    exports.renderAccount = function(req, res) {
        res.render('admin/account', {
            user: req.user,
            scripts: [  '/scripts/jquery.min.js', '/scripts/admin/account-settings.js' ]
        }); 
    };
    
    // Change password
    exports.changePassword = function changePassword(req, res) {
        
        
            db.User.authenticate(req.user.username, req.body.oldPassword, function(err, user) {
                
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
                        req.flash('err','Password incorrect');
                    }
                    res.redirect('/admin/account');
                }
            
            });

    };
    
    // Change password
    exports.changeEmailAddress = function changeEmailAddress(req, res) {
        
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

    };

    // On get request for rooms list
    exports.renderRooms = function renderRooms(req, res) {

        db.Room.find(function(err, rooms) {
            res.render('admin/room-list', {
                user: req.user,
                rooms: rooms,
                scripts: [  '/scripts/jquery.min.js', '/scripts/admin/room-list.js' ]
            }); 
        });
    };


    // On client room delete request with the id of the room to be deleted.
    exports.deleteRoom = function deleteRoom(req, res) {

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
    };

    exports.renderSettings = function renderSettings(req, res) {

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

    };

    // On post of ice server from client
    exports.addIceServer = function addIceServer(req, res) {

            // Create a new room with the data from the add_room form
            var newServer = new db.IceServer({ 
                serverUrl: req.body.url,
                type: req.body.type
            });
            newServer.save(function() {
                // Send the success status back to the user
                res.send({status:"ok", message:"URL " + req.body.url + " added to database"});
            });
    };

    // On post of ice server from client
    exports.deleteIceServer = function deleteIceServer(req, res) {

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
    };
    

    exports.renderAddRoom = function renderAddRoom(req, res) {

        db.Theme.find({}, function(err, themes) {
            res.render('admin/add-room', {
                user: req.user,
                themes: themes,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ],
                wizard: req.query.wizard,
                theme: req.query.theme
            }); 
        });

    };

    exports.addRoom = function addRoom(req, res) {
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
   
                // If the user is completing the wizard:
                if (req.query.wizard) {
                    //redirect to next step
                    res.redirect(302, '/admin/add_session?wizard=3&room=' + encodeURIComponent(req.body.name)); 
                } else {
                    // Else the user to the dashboard
                    res.redirect(302, '/admin/rooms'); 
                }
                
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
        
            
    };

    exports.saveRoom = function saveRoom(req, res) {
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
    };

    exports.renderEditRoom = function renderEditRoom(req, res) {

        // Get the room number from the requested url
        var room = req.params.roomId;

        // Find the room in the DB and show the edit page for that room
        db.Room.findOne({
            roomId: room
        }, function(err, room) {
            // If the room is found, display it
            if (room) {
                
                db.Theme.find({}, function(err, themes) {
                    if (room.hasFilesharing) {
                        db.FileOptions.findOne({ roomId : room.roomId }, function(err, fileOptions) {
                            if (fileOptions && !err) {
                                res.render('admin/edit-room', {
                                    scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ],
                                    room: room,
                                    themes: themes,
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
                            room: room,
                            themes: themes
                        });  
                    }
                });
            } else {
                // else redirect the user to the room list
                res.redirect(302, '/admin'); 
            }

        });
    };
    
    exports.renderLogs = function renderLogs(req, res) {
        
        db.Message.distinct('sessionId', function(err, sessionIds){
            
            db.Session.find({ sessionId : {$in:sessionIds} }, function(err, sessions) {
                            
                res.render('admin/logs', {
                    user: req.user,
                    sessions: sessions,
                    scripts: [ '/scripts/jquery.min.js', '/scripts/ect.min.js' ,'/scripts/admin/settings.js' ]
                });              
            }); // end find sessions based on unique ids
        }); // end find unique session ids in message
    }; // end get /admin/logs
    
    
    exports.renderLog = function renderLog(req, res) {
        
        // Get the sessionId from the requested url
        var sessionId = req.params.sessionId;
        
        db.Message.find({ sessionId : sessionId } ,function(err, messages) {

            res.render('admin/session-log', {
                user: req.user,
                messages: messages,
                sessionId : sessionId,
                styles:  [ '//cdn.jsdelivr.net/emojione/1.5.0/assets/css/emojione.min.css' ],
                scripts: [ '//cdn.jsdelivr.net/emojione/1.5.0/lib/js/emojione.min.js' , '/scripts/jquery.min.js', '/scripts/ect.min.js' ,'/scripts/admin/logs.js']
            });              
        }); // end find sessions based on unique ids

    };

    
    // On client log delete request with the sessionId of the logs to be deleted.
    exports.deleteLog = function deleteLog(req, res) {

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
    };
    

    exports.renderWizardComplete = function renderWizardComplete(req, res) {
        
        
        db.Session.findOne({ name : req.query.session }, function(err, session){
            db.Room.findOne({ roomId: session.roomId }, function(err, room){
                db.Theme.findOne({ _id: room.theme }, function(err, theme) {
                    res.render('admin/wizard-complete', {
                        user: req.user,
                        session: session,
                        room: room,
                        theme: theme
                    });
                });
            });
        });
    };
    
    
    // Return the exported methods to the caller
    return exports;
    
}