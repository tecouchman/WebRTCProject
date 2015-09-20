module.exports = function(app, db, accountManager) {

    
    var config = require(app.get('root') + '/config');
    var exports = {};
    
    
    // Middleware to check if installation has already been completed
    exports.checkInstallationComplete = function checkInstallationComplete(req, res, next) {
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
    
    exports.renderInstallation = function renderInstallation(req, res) {
        res.redirect(302, '/install/database'); 
    };
            
    exports.renderDatabaseSetup = function renderDatabaseSetup(req, res) {
    
        res.render('admin/install-database', {
            scripts: [ '/scripts/jquery.min.js','/scripts/Install/install.js' ]
        }); 

    };
    
    exports.setupDatabase = function setupDatabase(req, res) {
        // Initialise the database with the data from the user
        db.init(req.body.url,req.body.username,req.body.email, req.body.tableprefix);

        // Initialise the database with some data
        setUpDBData();
        
        // Store the database details to the config file so they can be loaded later.
        config.add('dbURL', req.body.url);
        config.add('dbUser', req.body.username);
        config.add('dbPassword', req.body.password);
        config.add('dbTablePrefix', req.body.tableprefix);

        // Take the user to the registration page
        res.redirect(302, '/install/register'); 
    };

    exports.renderAccountSetup = function renderAccountSetup(req, res) {

        res.render('admin/install-register', {
            scripts: [ '/scripts/jquery.min.js','/scripts/Install/install.js' ]
        }); 
    };
    
    exports.register = function register(req, res) {

        var adminAccount = new db.User({ 
            username: req.body.username, 
            password: req.body.password,
            emailAddress : req.body.email });
        
        adminAccount.save(function(err) {
            // If it failed
            if (err) {
                // TODO: what to do here?
            } else {
                res.redirect(302, '/admin'); 
            }
        });

    };
    
    /*  
        Creates default data that will be useful to new users. Such as a selection of
        stun servers a default theme
    */
    var setUpDBData = function setUpDBData() {
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
        
        var defaultStun = [ 'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302' ];
        
        for(var i = 0; i < defaultStun.length; i++) {
            var stunServer = new db.IceServer({
                serverUrl: defaultStun[i],
                type: 'STUN'
            });
            stunServer.save();
        }
    }
    
    
    
    return exports;
    
};