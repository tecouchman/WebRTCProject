module.exports = function(app, db, accountManager) {

    var exports = {};
    
    
    exports.renderInstallation = function(req, res) {
        res.redirect(302, '/install/database'); 
    };

            
    exports.renderDatabaseSetup = function(req, res) {
    
        res.render('admin/install-database', {
            scripts: [ '/scripts/jquery.min.js','/scripts/Install/install.js' ]
        }); 

    };
    
     exports.setupDatabase = function (req, res) {
        // Initialise the database with the data from the user
        db.init(req.body.url,req.body.username,req.body.email, req.body.tableprefix);

        // Create the default theme
        var defaultTheme = new db.Theme({
            themeName: 'Default',
            layoutName: 'message-right',
            includeMobileLayout : true,
            hasCustomCss : false,
            showDisplayName : false,
            showAvatar : true
        });
        defaultTheme.save();

        // Take the user to the registration page
        res.redirect(302, '/install/register'); 
    };

    exports.renderAccountSetup = function(req, res) {

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

    };
    
    return exports;
    
};