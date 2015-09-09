module.exports.set = function(app, passport, db) {

    // Set up routing for get requests made to the base URL.
    // Sends index.html to the client.
    app.get('/room/:sessionId', function(req, res) {

        //[a-zA-Z0-9]{1,9}
        db.Session.findOne({ url : req.params.sessionId }, function(err, session) {
            if (err) {
                res.render('info', {
                    title: 'An Error Ocurred',
                    message: 'Please check the url and try again.'
                });
            } else if (!session) {
                res.render('info', {
                    title: 'Chat room not found',
                    message: 'Please check the url and try again.'
                });
            } else { 
                res.sendFile(app.get('root') + '/index.html'); 
            } 
        })
    });
    
}