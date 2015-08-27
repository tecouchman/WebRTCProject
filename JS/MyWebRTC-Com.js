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

        // When the server has generated a peerID
        socket.on('IdGenerated', function(localPeerId){
            console.log('My Id:' + localPeerId);
            // Store it in the MyWebRTC object.
            MyWebRTC.setLocalPeerId(localPeerId);
        })
        
        // When a client is added to the room
        socket.on('PeerAdded', function(clientId){
            // Write log in console
            console.log('A new client has arrived.');

            MyWebRTC.connectToPeer(clientId);
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
            MyWebRTC.addOffer(data.peerId, data.peerType, new MyWebRTC.SessionDescription(data.offer));
        });

        socket.on('Answer', function(data) {
            console.log('Answer recieved via socket. Answer: ' + data.answer); 
            MyWebRTC.addAnswer(data.peerId, data.peerType, new MyWebRTC.SessionDescription(data.answer));
        });

        socket.on('IceCandidate', function(data) {

            // Send the IceCandidate to the server so it can be passed to the remote peer
            MyWebRTC.addRemoteIceCandidate(data.peerId, new MyWebRTC.IceCandidate(data.iceCandidate));

        });
        
        socket.on("PasswordCorrect", function (evt) {
            console.log('password correct');
            $(MyWebRTC).trigger("PasswordCorrect");
        });

        socket.on("PasswordIncorrect", function (evt) {
            console.log('password incorrect');
            $(MyWebRTC).trigger("PasswordIncorrect");
        });
        
        // Request an Id so the user can join the chat
        socket.emit('Join');
        
    });
    

    
    $(MyWebRTC).on("GetIceCandidate", function (evt, remotePeerId, iceCandidate) {
        // Send ice candidates to the server so they can be forwarded to the remote client
        socket.emit('IceCandidate', { peerId: remotePeerId, iceCandidate: iceCandidate });
    });
    
    $(MyWebRTC).on("CreateOffer", function (evt, remotePeerId, offer) {
        console.log('Offer sent: ' + offer);
        
        socket.emit('Offer', { peerId: remotePeerId, peerType: 'presenter', offer: offer });
    });
    
    
    $(MyWebRTC).on("CreateAnswer", function (evt, remotePeerId, answer) {
        // TODO: Send offer to remote peer
        console.log('Answer sent');
        
        socket.emit('Answer', { peerId: remotePeerId, peerType: 'client' ,answer: answer });
        
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