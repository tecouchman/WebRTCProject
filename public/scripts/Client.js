$(document).ready(function() {
    
    socket = window.io();

    // Request the options from the server
    socket.emit('GetOptions');
    
    var localID;
    
    // When the server has generated a peerID
    socket.on('IdGenerated', function(localPeerId){
        // Store it in the MyWebRTC object.
        localID = localPeerId;
    })
    
    socket.on("RoomFull", function (evt) {
            $(MyWebRTC).trigger("RoomFull");
    });
    
    // When the options are recieved frmo the server, the chat can be initialised.
    socket.on('GotOptions', function(RTCOptions, RTCComOptions, RTCUIOptions){ 
        
        if (RTCOptions.embeddable || (window.top == window.self)) {
            // Init the libraries with the options
            MyWebRTC.UI.init(RTCUIOptions);
            MyWebRTC.Com.init(RTCComOptions);
            MyWebRTC.init(localID, RTCOptions);
        } else {
            var renderer = ECT({ root : '/views', ext : '.ect' });
            var popupData = { 
                id : 'notEmbeddable',
                title : 'This chat room cannot be embedded',
                message : 'Please open in a new browser window'
            };
            // Use ECT to render the popup
            var popup = renderer.render('partials/popup', popupData);
            $('#rtc-popup-area').append(popup);
        }
        
    });

});

