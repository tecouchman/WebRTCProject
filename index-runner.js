var express = require('express'),
    app = express(),
    http = require('http').Server(app);
    //ect = require('ect');


//var renderer = ect({ watch: true, root: app.get('root') + '/views', ext : '.ect' });

    // Set ECT as the view engine.
    // So that ECT templates and layouts can be used to
    // build the html to be sent to clients.
   /* app.set('view engine' ,'ect');
    app.engine('ect', renderer.render);
    app.use(renderer.compiler({ root : '/views', gzip: true }));*/


var MyWebRTC = require('./index.js');
//MyWebRTC.database('localhost/MyDatabase','','');
MyWebRTC.server(null, app, http);



app.get('/testing', function(req, res) {

    MyWebRTC.renderRoom('qwee', 'bobby', req, res);
    
    /*
        MyWebRTC.render('qwee', {
            standalone: false,
            username: username,
        }, function(page) {

            res.render('test', {
                title: "This is a dynamic test lol",
                test: "Content",
                rtc: page
            });

        })

    */    

    //res.send('lol');
});

/*
var options = {
    name : "Bobby's Chat 2",
    url : "bobby2",
    roomName : "ANewTypeTest"
};

MyWebRTC.createSession(options, function(err, session) {
    
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
http.listen(3000, function(){
    // Indicate the the port is listening
    console.log('Listening on port ' + 3000);
});
    

