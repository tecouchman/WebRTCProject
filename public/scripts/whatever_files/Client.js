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
        
        console.log('shareLocalVideo'+RTCOptions.shareLocalVideo);
        console.log('shareLocalAudio'+RTCOptions.shareLocalAudio);
        console.log('remoteVideo'+RTCOptions.remoteVideo);
        console.log('textChat'+RTCOptions.textChat);
        console.log('fileSharing'+RTCOptions.fileSharing);
        console.log('shareLocalVideo'+RTCOptions.shareLocalVideo);
        console.log('iceServers'+RTCOptions.iceServers);
        
        // Init the libraries with the options
        MyWebRTC.UI.init(RTCUIOptions);
        MyWebRTC.Com.init();
        MyWebRTC.init(RTCOptions);
        
    });

});

