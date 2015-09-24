$(document).ready(function() {
    
	// Initialise the socket communication to recieve the data 
	// required to set up the room
    socket = window.io();

    // Request the options from the server
    socket.emit('GetOptions');
    
    var localID,
		// Create instance of InstantRTC	
		instantRTC = InstantRTC(),
		renderer = ECT({ root : '/views', ext : '.ect' }),
		popupArea = $('#rtc-popup-area');
    
    // When the server has generated a peerID
    socket.on('IdGenerated', function(localPeerId){
        // Store the id
        localID = localPeerId;
    })
    
    socket.on("RoomFull", function (evt) {
		var data = { id : 'roomFull' , 
			title : 'Room is Full',
			message : 'Please try again later.'
		};
        var popup = renderer.render('partials/popup', data);
        popupArea.append(popup);
    });
    
    // When the options are recieved from the server, the chat can be initialised.
    socket.on('GotOptions', function(RTCOptions, RTCComOptions, RTCUIOptions){ 
		// if the room is embeddable or is not embededded, then display it
        if (RTCOptions.embeddable || (window.top == window.self)) {
			
			var container = $('#rtc-container') || document.body;
			
			// Create the objects required for the WebRTC chat
			var signaller = InstantRTC.Signaller(instantRTC, RTCComOptions);
			var controller = InstantRTC.UIController(instantRTC, RTCUIOptions, container, signaller);
			
			// Initialise the instanstRTC core
            instantRTC.init(localID, RTCOptions);
			
        } else { // Else if the room is embedded and but emebeddable is set to false:
            var popupData = { 
                id : 'notEmbeddable',
                title : 'This chat room cannot be embedded',
                message : 'Please open in a new browser window'
            };
            // Use ECT to render the popup
            var popup = renderer.render('partials/popup', popupData);
			
			// append the message to the popup area.
            popupArea.append(popup);
        }
        
    });

});

