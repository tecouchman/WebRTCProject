module.exports = function(app, installation) {
    
    var db = app.get('db');
            
    // Middleware to check if installation has already been completed
    var checkInstallationComplete = function(req, res, next) {
        if (!db.connected()) {
            return next();
        } else {
            // A user in the db means that 
            //installation has already been completed
            db.User.findOne({}, function(err, user) {

                if (user) {
                    res.render('admin/install-complete');    
                } else {
                    if (req.originalUrl == "/install/register") {
                        return next();
                    } else {
                        res.redirect("/install/register");
                    }
                }

            });
        }
    }
    
    
    // Requests for the installation
    app.get('/install', checkInstallationComplete, installation.renderInstallation);
    
    // Requests for the installation
    app.get('/install/database', checkInstallationComplete, installation.renderDatabaseSetup);
    
    
    app.post('/install/database', checkInstallationComplete, installation.setupDatabase);
    
    // Requests for the installation
    app.get('/install/register', checkInstallationComplete, installation.renderAccountSetup);

    
}