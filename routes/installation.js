/*
    Module for setting up routes. Maps HTTP requests to the installation controller
    
    @author Tom Couchman
*/

module.exports = function(app, installation) {
    
    // Requests for the installation
    app.get('/install', installation.checkInstallationComplete, installation.renderInstallation);
    
    // Requests for the installation
    app.get('/install/database', installation.checkInstallationComplete, installation.renderDatabaseSetup);
    
    app.post('/install/database', installation.checkInstallationComplete, installation.setupDatabase);
    
    // Requests for the installation
    app.get('/install/register', installation.checkInstallationComplete, installation.renderAccountSetup);
    
    app.post('/install/register', installation.checkInstallationComplete, installation.register);
}