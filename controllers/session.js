module.exports = function(app, db) {
    
    var exports = {};
    
    // On client get request for the sessions list
    exports.renderSessions = function renderSessions(req, res) {

        // Search teh db for all sessions
        db.Session.find(function sessionResultsCallback(err, sessions) {
            // Render the sessions list, and pass in the session data
            res.render('admin/session-list', {
                user: req.user,
                sessions: sessions,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/session-list.js' ]
            }); 
        });
    };

    // On client session delete request with the id of the room to be deleted.
    exports.deleteSession = function deleteSession(req, res) {

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
    };
    


    // On client get request for the add session page
    exports.renderAddSession = function renderAddSession(req, res) {

        db.Room.find(function sessionResultsCallback(err, rooms) {

            res.render('admin/add-session', {
                user: req.user,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/session-add.js' ],
                rooms: rooms,
                wizard: req.query.wizard,
                selectedRoom: req.query.room
            }); 
        });

    };

    // On client post to the add session page
    exports.addSession = function addSession(req, res) {

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
                            
                            // If the user is completing the wizard:
                            if (req.query.wizard) {
                                //redirect to next step
                                res.redirect(302, '/admin/wizard_complete?session=' + encodeURIComponent(req.body.name)); 
                            } else {
                                // Else the user to the session list
                                res.redirect(302, '/admin/sessions');
                            }
                            
                        });
                } else {
                    // If the user is completing the wizard:
                    if (req.query.wizard) {
                        //redirect to next step
                        res.redirect(302, '/admin/wizard_complete?session=' + encodeURIComponent(req.body.name)); 
                    } else {
                        // Else the user to the session list
                        res.redirect(302, '/admin/sessions');
                    }
                }
            });
    };
    
    function addCredentials(sessionId, password, callback) {
        var newPassword = new db.SessionCredentials({
            sessionId: sessionId,
            password: password
        });
        newPassword.save(callback);
    }

    exports.renderEditSession = function renderEditSession(req, res) {

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

    };

    exports.saveSession = function saveSession(req, res) {
            // Get the session id from the requested url
            var sessionId = req.params.sessionId;

            var conditions = { sessionId: sessionId };
            // Create a object to hold the new values
            var updatedValues = { 
                name: req.body.name,
                url: req.body.url,
                embeddable: req.body.embeddable,
                roomId: req.body.roomId,
                passwordProtected : req.body.passwordProtected && (!req.body.passwordChanged || req.body.password != '')
            };
        
        console.log(req.body.passwordChanged);

            // Call update on the Sessions model, passing in the
            // conditions that identify the session to update and the 
            // values to update. On complete redirect to the sessions list
            db.Session.update(conditions, updatedValues, {}, function() {
                
                db.SessionCredentials.findOne({ sessionId : sessionId }, function(err, sessionCredential) {
                    
                    var redirectCallback = function() { res.redirect(302, '/admin/sessions') }; 
                    
                    if (sessionCredential) {
                        if (req.body.passwordProtected) {
                            if (req.body.password != '') {
                                sessionCredential.password = req.body.password;
                                sessionCredential.save(redirectCallback);   
                            } else if (req.body.passwordChanged) {
                                sessionCredential.remove();
                            } else {
                                redirectCallback();
                            }
                        } else {
                            sessionCredential.remove();
                        }
                       
                    } else {
                        if (req.body.passwordProtected && req.body.password != '') {
                            addCredentials(sessionId, req.body.password, redirectCallback);   
                        } else {
                            redirectCallback();
                        }
                    }
                    
                });
            });
    };
    
    return exports;
    
}