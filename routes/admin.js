
/**
    Admin Routes
*/
module.exports = function(app, admin, session, theme) {

    // Middleware for checking whether a user is authenticated.
    // Easily added to route code by placing the middleware method
    // name before the callback. Then called by express when a
    // request is made.
    var checkAuthenticated = function(req, res, next) {
        console.log(req.isAuthenticated());
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
    app.get('/admin/login', admin.renderLogin);

    // When a user posts their account details from the the login page
    app.post('/admin/login', admin.login);
    
    // Listener for when a user request the login page
    app.get('/admin/request_password_reset', admin.renderPasswordResetRequest);

    // When a user posts their account details from the the login page
    app.post('/admin/request_password_reset', admin.requestPasswordReset);
    
    // Listener for when a user request the login page
    app.get('/admin/reset_password/:token', admin.renderPasswordReset)
    
    // Listener for when a user request the login page
    app.post('/admin/reset_password/:token', admin.resetPassword)
    
    // When a user logs out
    app.post('/admin/logout', admin.logout);

    // On HTTP Get for admin page
    app.get('/admin', checkAuthenticated, admin.renderAdmin);
    
    // On get request for rooms list
    app.get('/admin/account', checkAuthenticated, admin.renderAccount);
    
    // Change password
    app.post('/admin/account/change_password', checkAuthenticated, admin.changePassword);
    
    // Change password
    app.post('/admin/account/change_email_address', checkAuthenticated, admin.changeEmailAddress);

    // On get request for rooms list
    app.get('/admin/rooms', checkAuthenticated, admin.renderRooms);


    // On client room delete request with the id of the room to be deleted.
    app.delete('/admin/rooms/:roomId', checkAuthenticated, admin.deleteRoom);

    // On client get request for the sessions list
    app.get('/admin/sessions', checkAuthenticated, session.renderSessions);

    // On client session delete request with the id of the room to be deleted.
    app.delete('/admin/sessions/:sessionId', checkAuthenticated, session.deleteSession);


    // On client get request for the add session page
    app.get('/admin/add_session', checkAuthenticated, session.renderAddSession);

    // On client post to the add session page
    app.post('/admin/add_session', checkAuthenticated, session.addSession);

    app.get('/admin/edit_session/:sessionId', checkAuthenticated, session.renderEditSession);

    app.post('/admin/edit_session/:sessionId', checkAuthenticated, session.saveSession);
    

    app.get('/admin/settings', checkAuthenticated, admin.renderSettings);

    // On post of ice server from client
    app.post('/admin/ice-servers', checkAuthenticated, admin.addIceServer);

    // On post of ice server from client
    app.delete('/admin/ice-servers', checkAuthenticated, admin.deleteIceServer);

        
    // On client get request for the theme list
    app.get('/admin/themes', checkAuthenticated, theme.renderThemes);
    
    app.get('/admin/add_theme', checkAuthenticated, theme.renderAddTheme);

    app.post('/admin/add_theme', checkAuthenticated, theme.addTheme);

    app.get('/admin/edit_theme/:themeName', checkAuthenticated, theme.renderEditTheme);
    
    app.post('/admin/edit_theme/:themeName', checkAuthenticated, theme.saveTheme);

    // Route for deleting a theme
    app.delete('/admin/themes/:themeId', checkAuthenticated, theme.deleteTheme);
    
    app.get('/admin/add_room', checkAuthenticated, admin.renderAddRoom);

    app.post('/admin/add_room', checkAuthenticated, admin.addRoom);

    app.post('/admin/edit_room/:roomId', checkAuthenticated, admin.saveRoom);

    app.get('/admin/edit_room/:roomId', checkAuthenticated, admin.renderEditRoom);
    
    app.get('/admin/logs/', checkAuthenticated, admin.renderLogs); // end get /admin/logs
    
    app.get('/admin/logs/:sessionId', checkAuthenticated, admin.renderLog);

    // On client log delete request with the sessionId of the logs to be deleted.
    app.delete('/admin/logs/:sessionId', checkAuthenticated, admin.deleteLog);


}
