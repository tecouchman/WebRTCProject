/*
 * MyWebRTC Communication sub-module
 * Tom Couchman 2015
 */
// TODO: look at the engines used in voxel.js - how is one selected?
MyWebRTC.Com = (function (MyWebRTC) {
    'use strict';
    
    var iceCandidates = [];
    var responseSent = false;
    var responseReceieved = false;
    var com;
    
    // Set up socket.io, to create a socket through to
    // the server.
    var socket; 
    
    $(MyWebRTC).on("GetLocalStream", function (stream) {

        socket = window.io();

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

        // When the server has generated a peerID
        socket.on('IdGenerated', function(localPeerId){
            console.log('My Id:' + localPeerId);
            // Store it in the MyWebRTC object.
            MyWebRTC.localPeerId = localPeerId;
        })

        socket.on('Offer', function(data) {
            console.log('Offer recieved via socket. Offer: ' + data.offer); 
            MyWebRTC.addOffer(data.peerId, new SessionDescription(data.offer));
        });

        socket.on('Answer', function(data) {
            console.log('Answer recieved via socket. Answer: ' + data.answer); 
            MyWebRTC.addAnswer(data.peerId, new SessionDescription(data.answer));
            
                    
        
            responseReceieved = true;
            for (var candidate in iceCandidates) {
                MyWebRTC.addRemoteIceCandidate(candidate.peerId, new RTCIceCandidate(candidate.iceCandidate));
            }
        });

        socket.on('IceCandidate', function(data) {
            if (!responseSent && !responseReceieved) {
                iceCandidates.push({ peerId: data.peerId, iceCandidate: data.iceCandidate });
            } else {
                // Send the IceCandidate to the server so it can be passed to the remote peer
                MyWebRTC.addRemoteIceCandidate(data.peerId, new IceCandidate(data.iceCandidate));
            }
        });
        
    });
    

    
    $(MyWebRTC).on("GetIceCandidate", function (evt, remotePeerId, iceCandidate) {
        // Send ice candidates to the server so they can be forwarded to the remote client
        socket.emit('IceCandidate', { peerId: remotePeerId, iceCandidate: iceCandidate });
    });
    
    $(MyWebRTC).on("CreateOffer", function (evt, remotePeerId, offer) {
        // TODO: Send offer to remote peer
        console.log('Offer sent: ' + offer);
        
        socket.emit('Offer', { peerId: remotePeerId, offer: offer });
    });
    
    
    $(MyWebRTC).on("CreateAnswer", function (evt, remotePeerId, answer) {
        // TODO: Send offer to remote peer
        console.log('Answer sent');
        
        socket.emit('Answer', { peerId: remotePeerId, answer: answer });
        
        responseSent = true;
        for (var candidate in iceCandidates) {
            MyWebRTC.addRemoteIceCandidate(candidate.peerId, new IceCandidate(candidate.iceCandidate));
        }
        
    });

    // Public methods/fields
    com = {
        
    };
    
    return com;
}(MyWebRTC));