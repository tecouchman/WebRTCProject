module.exports = function(app, passport) {
      
    
    var db = app.get('db');
    
    exports = {};
    
    exports.renderRoomFromToken = function(req, res) {
        
		// Reset any session data
		req.session.rtc_userId = '';
		req.session.rtc_userDisplayName = '';
		req.session.rtc_userRole = '';
		
        // Find the session in the database based on the sessionId passed by the user
        db.Session.findOne({ url : req.params.sessionURL }, function(err, session) {
            // If err or session not found, render relevant error pages
            if (err) {
                renderError(res, 'An Error Ocurred','Please check the address and try again.');
            } else if (!session) {
                renderError(res, 'Chat session not found', 'Please check the address and try again.');
            } else {

                req.session.rtc_session = session.sessionId;
                renderRoom(req, res, session);
            }
        });
        
    }
    
    exports.renderRoomFromSession = function(req, res) {
        
        console.log(req.session.rtc_session);
        
        db.Session.findOne({ sessionId : req.session.rtc_session }, function(err, session) {
            // If err or session not found, render relevant error pages
            if (err) {
                renderError(res, 'An Error Ocurred','Please check the address and try again.');
            } else if (!session) {
                renderError(res, 'Chat session not found', 'Please check the address and try again.');
            } else {
                renderRoom(req, res, session);
            }
        });
        
    }
    
    var renderRoom = function(req, res, session) {
            

            // Find the room for the requested session
            db.Room.findOne({ roomId: session.roomId }, function(err, room){

                // If err or room not found render relevant error messages
                if (err) {
                    renderError(res, 'An Error Ocurred','Please check the address and try again.');
                	return;
				} else if (!room) {
                    renderError(res, 'Chat session not found', 'Please check the url and try again.');
                	return;
				}

                // Find the theme for the current room
                db.Theme.findOne({ _id: room.theme }, function(err, theme) {

                    var cssUrl = '';
                    // if the theme is found and it has custom css then generate the url to the css class
                    if (theme && theme.hasCustomCss) {
                        cssUrl = 'themes/' + encodeURIComponent(theme.themeName) + '.css'
                    } else {
                        cssUrl = 'default.css';   
                    }


                    // Render the sessions
                    res.render('session', {
                        layout: theme.layoutName,
                        mobile: theme.includeMobileLayout,
                        hasVideo: room.hasVideo || room.hasAudio,
                        hasMessaging: room.hasMessaging,
                        standalone: true,
                        scripts: [  '/socket.io/socket.io.js',
                                    '/scripts/jquery.min.js',
                                    '/scripts/ect.min.js',
                                    '/scripts/adapter.js',
                                    '/scripts/InstantRTC-Core.js',
                                    '/scripts/InstantRTC-Connection.js',
                                    '/scripts/InstantRTC-UIController.js',
                                    '/scripts/InstantRTC-Signaller.js',
                                    '/scripts/InstantRTC-Utils.js',
                                    '/scripts/Client.js',
                                    '//cdn.jsdelivr.net/emojione/1.5.0/lib/js/emojione.min.js'
                                 ],
                        styles: [  '/styles/base.css',
                                    '/styles/' + cssUrl, 
                                    '/styles/mobile.css',
                                    '//cdn.jsdelivr.net/emojione/1.5.0/assets/css/emojione.min.css'
                             ]
                    });

                });

            });
        
    };
    
    // Method to render the error page, with custom messages
    var renderError = function renderInfo(res, title, message) {
        res.render('info', {
            title: title,
            message: message
        });
    };
    
    return exports;
    

    
}