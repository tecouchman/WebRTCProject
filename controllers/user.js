module.exports = function(app, passport) {
      
    
    var db = app.get('db');
    
    exports = {};
    
    var renderRoom = function(req, res) {

        // Find the session in the database based on the sessionId passed by the user
        db.Session.findOne({ url : req.params.sessionId }, function(err, session) {
            
            // If err or session not found, render relevant error pages
            if (err) {
                renderError(res, 'An Error Ocurred','Please check the address and try again.');
            } else if (!session) {
                renderError(res, 'Chat session not found', 'Please check the address and try again.');
            } else {
            
                // Find the room for the requested session
                db.Room.findOne({ roomId: session.roomId }, function(err, room){

                    // If err or room not found render relevant error messages
                    if (err) {
                        renderError(res, 'An Error Ocurred','Please check the address and try again.');
                    } else if (!room) {
                        renderError(res, 'Chat session not found', 'Please check the url and try again.');
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
                            standalone: true,
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
                        });

                    });

                });
            }

        });
    };
    
    exports.renderRoom = renderRoom;
    
    // Method to render the error page, with custom messages
    var renderError = function renderInfo(res, title, message) {
        res.render('info', {
            title: title,
            message: message
        });
    };
    
    return exports;
    

    
}