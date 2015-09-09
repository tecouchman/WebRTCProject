module.exports.set = function(app, passport, db, signaller, accountManager) {

    var ect = require('ect');
    var renderer = ect({ watch: true, root: app.get('root') + '/views', ext : '.ect' });
    
    // Set ECT as the view engine.
    // So that ECT templates and layouts can be used to
    // build the html to be sent to clients.
    app.set('view engine' ,'ect');
    app.engine('ect', renderer.render);
    app.use(renderer.compiler({ root : '/views', gzip: true }));
    
    var test = renderer.render('test', {
                text: 'this is some text mate.'
            });    
    
    app.get('/test', function(req, res) {
        res.send(test); 
    });
    
    app.get('/test-supreme', function(req, res) {
        res.render('test-supreme', {
            body: test,
            numUsers: signaller.getUserCount()
        });
    });
    
    var adminController = require('./admin.js'),
        installationController = require('./installation.js'),
        userController = require('./user.js');

    adminController.set(app, passport, db);
    installationController.set(app, passport, db, accountManager);
    userController.set(app, passport, db);
}