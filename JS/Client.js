$(document).ready(function() {
    
    socket = window.io();

    // Request the options from the server
    socket.emit('GetOptions');
    
    socket.on("RoomFull", function (evt) {
            console.log('RoomFull');
            $(MyWebRTC).trigger("RoomFull");
    });
    
    // When the options are recieved frmo the server, the chat can be initialised.
    socket.on('GotOptions', function(RTCOptions, RTCComOptions, RTCUIOptions){ 
        
        console.log('Initialising libraries');
        
        // Init the libraries with the options
        MyWebRTC.UI.init(RTCUIOptions);
        MyWebRTC.Com.init(RTCComOptions);
        MyWebRTC.init(RTCOptions);
        
    });

});

