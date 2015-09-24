var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    port = 3000;
    //ect = require('ect');


//var renderer = ect({ watch: true, root: app.get('root') + '/views', ext : '.ect' });

    // Set ECT as the view engine.
    // So that ECT templates and layouts can be used to
    // build the html to be sent to clients.
   /* app.set('view engine' ,'ect');
    app.engine('ect', renderer.render);
    app.use(renderer.compiler({ root : '/views', gzip: true }));*/


var InstantRTC = require('./index.js');

// basic setup:
// var rtc = InstantRTC.init(port);

// advanced setup:
var rtc = InstantRTC.initShared(app, http);

// Rendering an advanced chat room i.e. with user names
app.get('/test1', function(req, res) {

    rtc.serveRoom(req, res, 'Session', 'bobby', 'samuel', 'presenter');

});

// Rendering an advanced chat room i.e. with user names
app.get('/test2', function(req, res) {

    rtc.render(req.session, 'dWD', {
        standalone: false,
        userId: 'sam',
        userDisplayName: 'james',
        userRole : 'client'
        
    }, function(chatRoom) {

        res.render('test', {
            title: "This is a dynamic test lol",
            text: "Content",
            rtc: chatRoom
        });

    })

});

/*
var options = {
    name : "Bobby's Chat 2",
    url : "bobby2",
    roomName : "ANewTypeTest"
};

InstantRTC.createSession(options, function(err, session) {
    
    if (err) {
        console.log(err.message);
    } else if (!session) {
        console.log('Sessions not created');
    } else {
        console.log('Success');
    }
    
});*/


// Listen for http requests on the port
// indicated in 'port' variable.
http.listen(port, function(){
    // Indicate the the port is listening
    console.log('Listening on port ' + port);
});
    

