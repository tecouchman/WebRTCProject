MyWebRTC = require('./index.js');

MyWebRTC.server(3000);

MyWebRTC.database('localhost/MyDatabase','','');


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
    
});