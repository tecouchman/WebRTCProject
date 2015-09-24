/*
 * InstantRTC Signaller
 * Tom Couchman 2015
 */
InstantRTC.Signaller = function (instantRTC, options) {
    'use strict';

    var com;
    
    // Set up socket.io, to create a socket through to
    // the server.
    var socket, options; 

	// If message loggin is on then listen for the message sent
	// event, to pass messages on to the server.
	if (options.logMessages) {
		// Listen for messageSent events
		$(instantRTC).on("MessageSent", function(evt, message){
			socket.emit('MessageSent', { username: 'Some username', message: message });
		});   
	}

    $(instantRTC).on("ReadyForCommunication", function () {

        socket = window.io();
        
        // When a client is added to the room
        socket.on('PeerAdded', function(clientId){
            // Write log in console
            console.log('A new client has arrived.');

            instantRTC.connect(clientId);
        })
        
        // When a client is added to the room
        socket.on('PeerRemoved', function(clientId){
            // Write log in console
            console.log('A new client has been removed.');

            // Remove the connection to the peer
            instantRTC.removePeer(clientId);
        })

        socket.on('Offer', function(data) {
            console.log('Offer recieved via socket. Offer: ' + data.offer); 
            instantRTC.addOffer(data.peerId, data.displayName, data.peerType, new RTCSessionDescription(data.offer));
        });

        socket.on('Answer', function(data) {
            console.log('Answer recieved via socket. Answer: ' + data.answer); 
            instantRTC.addAnswer(data.peerId, data.displayName, data.peerType, new RTCSessionDescription(data.answer));
        });

        socket.on('IceCandidate', function(data) {

            // Send the IceCandidate to the server so it can be passed to the remote peer
            instantRTC.addRemoteIceCandidate(data.peerId, new RTCIceCandidate(data.iceCandidate));

        });
        
        socket.on("PasswordCorrect", function (data) {
            console.log('password correct');
            $(instantRTC).trigger("PasswordCorrect");
        });

        socket.on("PasswordIncorrect", function (data) {
            console.log('password incorrect');
            $(instantRTC).trigger("PasswordIncorrect");
        });
        
        socket.on("DisplayNameChanged", function (data) {
            instantRTC.setPeerDisplayName(data.remotePeerId, data.displayName);
        })
        
        socket.on("VideoTrackToggled", function (data) {
            console.log('on VideoTrackToggled')
            $(instantRTC).trigger("RemoteVideoTrackToggled", [ data.remotePeerId, data.enabled ]);
        })
        
        
        
        // Request an Id so the user can join the chat
        socket.emit('Join');
        
    });

    
    $(instantRTC).on("GetIceCandidate", function (evt, remotePeerId, iceCandidate) {
        // Send ice candidates to the server so they can be forwarded to the remote client
        socket.emit('IceCandidate', { peerId: remotePeerId, iceCandidate: iceCandidate });
    });
    
    $(instantRTC).on("CreateOffer", function (evt, remotePeerId, displayName, offer, peerType) {
        console.log('Offer sent: ' + offer);
        
        socket.emit('Offer', { peerId: remotePeerId, displayName: displayName, peerType: peerType, offer: offer });
    });
    
    $(instantRTC).on("DisplayNameChanged", function (evt, displayName) {
        socket.emit('DisplayNameChanged', { displayName: displayName });
    });
    
    $(instantRTC).on("CreateAnswer", function (evt, remotePeerId, displayName, answer, peerType) {
        console.log('Answer sent');
        
        socket.emit('Answer', { peerId: remotePeerId, displayName: displayName, peerType: peerType ,answer: answer });
        
    });
    
    $(instantRTC).on('Disconnected', function (evt, remotePeerId, displayName, answer) {
        socket.close();
    });
    
        
    $(instantRTC).on('LocalVideoTrackToggled', function (evt, enabled) {
        console.log('on LocalVideoTrackToggled')
        socket.emit('VideoTrackToggled', { enabled : enabled });
    });
    
    var submitPassword = function(password) {
        console.log('Password submitted: ' + password);
        socket.emit('SubmitPassword', { password : password });
    }

    // Public methods/fields
    com = {
        'submitPassword' : submitPassword
    };
    
    return com;
};