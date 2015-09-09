/*
 * MyWebRTC Communication sub-module
 * Tom Couchman 2015
 */
// TODO: look at the engines used in voxel.js - how is one selected?
MyWebRTC.Com = (function (MyWebRTC) {
    'use strict';

    var com;
    
    // Set up socket.io, to create a socket through to
    // the server.
    var socket, options; 

    var init = function(opts) {
        
        options = opts;
        
        // If message loggin is on then listen for the message sent
        // event, to pass messages on to the server.
        if (options.logMessages) {
            // Listen for messageSent events
            $(MyWebRTC).on("MessageSent", function(evt, message){
                socket.emit('MessageSent', { username: 'Some username', message: message });
            });   
        }
    }
    
    $(MyWebRTC).on("ReadyForCommunication", function () {

        socket = window.io();
        
        // When a client is added to the room
        socket.on('PeerAdded', function(clientId){
            // Write log in console
            console.log('A new client has arrived.');

            MyWebRTC.connect(clientId);
        })
        
        // When a client is added to the room
        socket.on('PeerRemoved', function(clientId){
            // Write log in console
            console.log('A new client has been removed.');

            // Remove the connection to the peer
            MyWebRTC.removePeer(clientId);
        })

        socket.on('Offer', function(data) {
            console.log('Offer recieved via socket. Offer: ' + data.offer); 
            MyWebRTC.addOffer(data.peerId, data.displayName, data.peerType, new RTCSessionDescription(data.offer));
        });

        socket.on('Answer', function(data) {
            console.log('Answer recieved via socket. Answer: ' + data.answer); 
            MyWebRTC.addAnswer(data.peerId, data.displayName, data.peerType, new RTCSessionDescription(data.answer));
        });

        socket.on('IceCandidate', function(data) {

            // Send the IceCandidate to the server so it can be passed to the remote peer
            MyWebRTC.addRemoteIceCandidate(data.peerId, new RTCIceCandidate(data.iceCandidate));

        });
        
        socket.on("PasswordCorrect", function (data) {
            console.log('password correct');
            $(MyWebRTC).trigger("PasswordCorrect");
        });

        socket.on("PasswordIncorrect", function (data) {
            console.log('password incorrect');
            $(MyWebRTC).trigger("PasswordIncorrect");
        });
        
        socket.on("DisplayNameChanged", function (data) {
            MyWebRTC.setPeerDisplayName(data.remotePeerId, data.displayName);
        })
        
        socket.on("VideoTrackToggled", function (data) {
            console.log('on VideoTrackToggled')
            $(MyWebRTC).trigger("RemoteVideoTrackToggled", [ data.remotePeerId, data.enabled ]);
        })
        
        
        
        // Request an Id so the user can join the chat
        socket.emit('Join');
        
    });
    

    
    $(MyWebRTC).on("GetIceCandidate", function (evt, remotePeerId, iceCandidate) {
        // Send ice candidates to the server so they can be forwarded to the remote client
        socket.emit('IceCandidate', { peerId: remotePeerId, iceCandidate: iceCandidate });
    });
    
    $(MyWebRTC).on("CreateOffer", function (evt, remotePeerId, displayName, offer) {
        console.log('Offer sent: ' + offer);
        
        socket.emit('Offer', { peerId: remotePeerId, displayName: displayName, peerType: 'client', offer: offer });
    });
    
    $(MyWebRTC).on("DisplayNameChanged", function (evt, displayName) {
        socket.emit('DisplayNameChanged', { displayName: displayName });
    });
    
    $(MyWebRTC).on("CreateAnswer", function (evt, remotePeerId, displayName, answer) {
        // TODO: Send offer to remote peer
        console.log('Answer sent');
        
        socket.emit('Answer', { peerId: remotePeerId, displayName: displayName, peerType: 'client' ,answer: answer });
        
    });
    
    $(MyWebRTC).on('Disconnected', function (evt, remotePeerId, displayName, answer) {
        socket.close();
    });
    
        
    $(MyWebRTC).on('LocalVideoTrackToggled', function (evt, enabled) {
        console.log('on LocalVideoTrackToggled')
        socket.emit('VideoTrackToggled', { enabled : enabled });
    });
    
    var submitPassword = function(password) {
        console.log('Password submitted: ' + password);
        socket.emit('SubmitPassword', { password : password });
    }
    
    



    // Public methods/fields
    com = {
        'init' : init,
        'submitPassword' : submitPassword
    };
    
    return com;
}(MyWebRTC));