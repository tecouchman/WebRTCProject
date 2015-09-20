/*
    Module that defines the API that is made accessible to developers
    
    @author Tom Couchman
*/

/*  Set up method
    Takes in the variables required to set up the API methods
*/
module.exports = function(app, renderer, userController) {
    
    // Get access to the db via app
    var db = app.get('db'),
        exports = {};

    exports.renderRoom = function(req, res, sessionName, userId, userDisplayName, userRole) {
    
        db.Session.findOne({
            name : sessionName
        }, function(err, session){
           
            console.log('api session:'+ session.sessionId);
            
            // Add the passed in user info to the session, 
            // ready for when the page is rendered/
            req.session.rtc_session = session.sessionId;
            req.session.rtc_userId = userId;
            req.session.rtc_userDisplayName = userDisplayName;
            req.session.rtc_userRole = userRole;

            // Render the room using the renderRoom method on the 
            // User controller
            userController.renderRoomFromSession(req, res);
        });
    }

    exports.render = function(userSession, sessionName, options, callback) {
        
        options = options || {};
        
        // Find the session in the database based on the sessionId passed by the user
        db.Session.findOne({ name : sessionName }, function(err, session) {
            
            // If err or session not found, render relevant error pages
            if (err) {
                callback(renderError(renderer, 'An Error Ocurred','Please check the url and try again.'));
            } else if (!session) {
                callback(renderError(renderer, 'Chat session not found', 'Please check the url and try again.'));
            } else {
            
                // Add the passed in user info to the session, 
                // ready for when the page is rendered/
                userSession.rtc_session = session.sessionId;
                userSession.rtc_userId = options.userId;
                console.log(options.userId);
                userSession.rtc_userDisplayName = options.userDisplayName;
                userSession.rtc_userRole = options.userRole || 'client';
                
                // Find the room for the requested session
                db.Room.findOne({ roomId: session.roomId }, function(err, room){

                    // If err or room not found render relevant error messages
                    if (err) {
                        callback(renderError(renderer, 'An Error Ocurred','Please check the address and try again.'));
                    } else if (!room) {
                        callback(renderError(renderer, 'Chat session not found', 'Please check the address and try again.'));
                    }

                    // Find the them for the current room
                    db.Theme.findOne({ _id: room.theme }, function(err, theme) {

                        var cssUrl = '';
                        // if the theme is found and it has custom css then generate the url to the css class
                        if (theme && theme.hasCustomCss) {
                            cssUrl = 'themes/' + encodeURIComponent(theme.themeName) + '.css'
                        } else {
                            cssUrl = 'default.css';   
                        }

                        // Render the sessions
                        callback(renderer.render('session', {
                            layout: theme.layoutName,
                            mobile: theme.includeMobileLayout,
                            hasVideo: room.hasVideo || room.hasAudio,
                            hasMessaging: room.hasMessaging,
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
                            styles: [  '/styles/base.css',
                                        '/styles/' + cssUrl, 
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
    var renderError = function renderInfo(renderer, title, message) {
        renderer.render('info', {
            title: title,
            message: message
        });
    };
    

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
    exports.createSession = function(options, callback) {

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

                var newCredential = new db.SessionCredentials({
                    sessionId: session.sessionId,
                    password: password
                });
                newCredential.save(function(err, credentials, numberAffected) {
                    console.log('credentials saved: ' + credentials);
                    callback(null, session);
                });

            } else {
                callback(null, session);
            }
        });
    }
    
    return exports;
 
    
}