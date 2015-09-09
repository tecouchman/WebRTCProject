module.exports.set = function(app, passport, db, accountManager) {

    // Requests for the installation
    app.get('/install', function(req, res) {
        res.redirect(302, '/install/database'); 
    });
            
            
    // Requests for the installation
    app.get('/install/database', function(req, res) {
    
        // Check if the installation is complete
        checkInstallationComplete(function(isInstalled) {
            // If already installed show the install completed page.
            if (isInstalled) {
                res.render('admin/install-complete');
            } else {
                res.render('admin/install-database', {
                    scripts: [ '/scripts/jquery.min.js','/scripts/Install/install.js' ]
                }); 
                
                app.post('/install/database',
                    function (req, res) {
                    
                        // Initialise the database with the data from the user
                        db.init(req.body.url,req.body.username,req.body.email);

                        // Take the user to the registration page
                        res.redirect(302, '/install/register'); 
                    }
                );
            }
        });
    });

    // Requests for the installation
    app.get('/install/register', function(req, res) {
    
        // Check if the installation is complete
        checkInstallationComplete(function(isInstalled) {
            // If already installed show the install completed page.
            if (isInstalled) {
                res.render('admin/install-complete');
            } else {
                res.render('admin/install-register', {
                    scripts: [ '/scripts/jquery.min.js','/scripts/Install/install.js' ]
                }); 
                
                app.post('/install/register',
                    function (req, res) {

                        accountManager.addAdminAccount(req.body.username,
                                req.body.password, req.body.email,
                                function(err) {
                                    // If it failed
                                    if (err) {
                                        // TODO: what to do here?
                                    } else {
                                        res.redirect(302, '/admin'); 
                                    }
                                });

                    }
                );
            }
        });
    });

    // Method to 
    function checkInstallationComplete(callback) {
        console.log(db.connected());
        if (!db.connected()) {
            callback(false);   
        } else {
            // A user in the db means that 
            //installation has already been completed
            accountManager.checkAccount(callback);
        }
    }

    
}