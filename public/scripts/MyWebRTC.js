/*
 * MyWebRTC Core
 * Tom Couchman 2015
 */
(function (global) {
    'use strict';
    
    // Private variables
    var version = '0.1.2',        // Current version of the library
        localPeerId, 
        displayName = 'Anonymous',
        peers = {},     // A map of PeerConnection objects that allow for WebRTC based communication
                        // between the client and other peers.
        localStream,    // The clients webcam/audio stream.
        dataChannelOpen = false,    // Whether or not data can be sent to other peers :-
                                    // Setting is enabled and peers are present
        fileOffers = {},  // a list of file offers that have been sent
        // Default option values, which are used for any of the options
        // that are not set explicitly by the user.
        options = {             
            shareLocalVideo: true,
            shareLocalAudio: true,
            remoteVideo: true,
            hasMessaging: true,
            allowScreensharing : true,
            iceServers: [],
            fileSharing : true
        };
 
    
    // The Stun/Turn servers to use
    var peerConfiguration = {
        iceServers: []
    }
    
    // The options for the connection type.
    // DtlsSrtpKeyAgreement allows chrome and firefox to interoperate
    // RtpDataChannels needed to use DataChannels API on firefox
    var peerOptions = {
         mandatory: {
            width: { max: 100 },
            height: { max: 100 }
          },
        optional: [
            {DtlsSrtpKeyAgreement: true}

        ]
    }

    // init function, does the initial set up to allow for WebRTC communication
    var init = function (localId, opts) {
        
        localPeerId = localId;
        if (opts.displayName) {
            displayName = opts.displayName;
        }
        
        // Merge default options with the options passed in.
        $.extend(options, options, opts)
        
   
        
        // Loop through the iceServers passed in to create a list with the
        // required format for PeerConncetion
        $(options.iceServers).each(function(key, value) {
            peerConfiguration.iceServers.push({url: value});
        });
        

        // If any of the necessary components are not available
        // then the browser cannot run the app so trigger a browserNotSupported event
        if (!RTCPeerConnection || 
            !RTCIceCandidate || 
            !RTCSessionDescription ||
            !navigator.getUserMedia) {
            
            $(MyWebRTC).trigger('browserNotSupported'); 
            return;
            
        } 
        
        // Only request local media if either local video or audio are being shared
        // else will error.
        if (options.shareLocalVideo || options.shareLocalAudio) {
            // Options for the user media stream
            var mediaOptions = {
                video: options.shareLocalVideo,
                audio: options.shareLocalAudio
            };

            // Get the user media stream
            navigator.getUserMedia(mediaOptions,
                // On stream recieved.
                function (stream) {
                    // Store a reference to the local stream
                    localStream = stream;

                    // Trigger the event so subscribers are updated.
                    $(MyWebRTC).trigger('GetLocalStream', [ stream ]);
                    
                    setTimeout(function() {
                        $(MyWebRTC).trigger('ReadyForCommunication');
                    }, 1000);

                },
                // On error
                function (err) {
                    // TODO: output error to user.
                    console.error(err);
                }
            );   
        } else {
            $(MyWebRTC).trigger('ReadyForCommunication');
        }
        

    };
    
    // Setter for display name
    var setDisplayName = function(name) {
        displayName = name;   
        $(MyWebRTC).trigger('DisplayNameChanged', [ name ]);
    }
    
    var setAudioEnabled = function(value) {
        if (localStream.getAudioTracks()[0]) {
            localStream.getAudioTracks()[0].enabled = value;
        }
    }
    
    var setVideoEnabled = function(value) {
        if (localStream.getVideoTracks()[0]) {
            localStream.getVideoTracks()[0].enabled = value;
        }
        $(MyWebRTC).trigger("LocalVideoTrackToggled", value);
    }
    
    var close = function() {
        
        if (localStream) {
            localStream.stop();
        }
        
        $.map(peers, function(connection, key) {
            connection.close();
            delete peers[key];
            localStream.stop();
            
        });
        $(MyWebRTC).trigger('Disconnected');
    }
    
    // Recieve ice candidates from the remote peers.
    var addRemoteIceCandidate = function (remotePeerId, iceCandidate) {
        peers[remotePeerId].addIceCandidate(iceCandidate);
    };
    
    // Method to set up a peer connection to remote peer
    var connect = function(remotePeerId) {
        
        // Create a  new Peer object, pass in a new PeerConnecion
        // and store in the peers map.
        peers[remotePeerId] = new MyWebRTC.Connection(remotePeerId, localStream, peerConfiguration, peerOptions, options.hasMessaging);
        attachHandlers(peers[remotePeerId]);
        
        // Create an offer
        peers[remotePeerId].createOffer(function(offer) {
            // Trigger the CreateOffer event so subscribers are updated.
            $(MyWebRTC).trigger("CreateOffer", [ remotePeerId, displayName, offer ]);
        });

    }
    
    var attachHandlers = function(connection) {
        // If text chat set up data channel listeners
        if (options.hasMessaging) {
            $(connection).on('DataChannelClosed', onDataChannelClosed);
            $(connection).on('DataChannelOpen', onDataChannelOpen);
            $(connection).on('MessageReceived', function(event, data) {
				console.log(event);
				console.log('relaying message');
				$(MyWebRTC).trigger("MessageReceived", [ event.target.id, event.target.displayName, data ]);
			});
        }
        if (options.fileSharing) {
            $(connection).on('FileOffer', onFileOffer);
            
            // Relay file updates
            $(connection).on("DownloadStarted", function(event, fileId) {  
                $(MyWebRTC).trigger("DownloadStarted", [ connection.id, fileId ]);                 
            });
            $(connection).on('DownloadComplete', function(event, fileId, file) {  
                $(MyWebRTC).trigger("DownloadComplete", [ connection.id, fileId, file ]);                
            });
            $(connection).on("DownloadProgress", function(event, fileId, progress) {  
                $(MyWebRTC).trigger("DownloadProgress", [ connection.id, fileId, progress ]);            
            });
            $(connection).on("FileSendStarted", function(event, fileId) {  
                $(MyWebRTC).trigger("FileSendStarted", [ connection.id, fileId ]);                 
            });
            $(connection).on('FileSendComplete', function(event, fileId, file) {  
                $(MyWebRTC).trigger("FileSendComplete", [ connection.id, fileId, file ]);                
            });
            $(connection).on("FileSendProgress", function(event, fileId, progress) {  
                console.log('got progress');
                $(MyWebRTC).trigger("FileSendProgress", [ connection.id, fileId, progress ]);            
            });
        }
    }
    
    
    // handler for when a Connection recieves a message
    var onFileOffer = function(event, name, size) {
        // Store the file offer
        fileOffers[name] = {
            sender: event.target.id,
            name: name,
            size: size
        };
        
        // Then trigger a fileOfferRecieved event
        $(MyWebRTC).trigger("FileOfferRecieved", [ event.target.id, event.target.displayName, name, size ]);
    }
     
	
	// TODO: remove?
    // handler for when a Connection recieves a message
    /*var onFileAccept = function(event, name) {
        //$(MyWebRTC).trigger("FileAccept", [ event.target.id, receivedData.name ]);
        fileOfferAccepted(event.target.id, name);
    }*/
    
    var onDataChannelOpen = function() {
        // If no data channels were previously opened:
        if (!dataChannelOpen) {
            // Set dataChannelOpen to true to indicate messages can be sent
            dataChannelOpen = true;
            // Trigger the DataChannelOpen event so subscribers know
            // messages can be sent
            $(MyWebRTC).trigger("DataChannelOpen");
        }
    };
    
    var onDataChannelClosed = function() {
        // Loop through each peer to check if a channel is still open
        var openChannels = $.map(peers, function(obj, key) {
            if (obj.peerConnection.sendDataChannel.readyState === 'open') {
                return obj;
            } 
        });

        // If no more data channels are open:
        if (openChannels.length == 0) {
            // Set dataChannelOpen to false to indicate messages can't be sent
            dataChannelOpen = false;
            // Trigger the DataChannelClosed event so subscribers know
            // messages can't be sent
            $(MyWebRTC).trigger("DataChannelClosed");
        }
    };
    
    // Method to remove peers
    var removePeer = function (remotePeerId) {
        
        // Temporarily store the name of the peer
        var peerName = peers[remotePeerId].displayName;
        
        // Remove the selected peer from the peers map
        delete peers[remotePeerId];
        
        // Publish an event so subscribers are notified of the users departure
        $(MyWebRTC).trigger('PeerDisconnected', [ remotePeerId, peerName ]);
    }    
    
    // When the user accepts a file, relay the request to the relevant connection
    var acceptFile = function(senderId, fileName) {
        peers[senderId].acceptFileOffer(fileName);
    }
        
	
	// TODO : remove?
    /*var fileOfferAccepted = function(target, name) {

    }*/
    
    // Method by which remote offers can be passed to the local MyWebRTC object
    var addOffer =  function(remotePeerId, peerDisplayName, peerType, offer) {
        
        // Generate a Peer object, pass in a peer connection.
        // Store peer in the peers map.
        peers[remotePeerId] = new MyWebRTC.Connection(remotePeerId, localStream, peerConfiguration, peerOptions, options.hasMessaging, peerType, peerDisplayName);
        attachHandlers(peers[remotePeerId]);
        
        peers[remotePeerId].addOffer(offer);
        $(MyWebRTC).trigger("PeerConnected", [ remotePeerId, peerDisplayName ]);

    };

    // Method by which remote answers can be passed to the local MyWebRTC object
    var addAnswer = function(remotePeerId, peerDisplayName, peerType, answer) {
        
        peers[remotePeerId].type = peerType;
        peers[remotePeerId].displayName = peerDisplayName;
        peers[remotePeerId].addAnswer(answer, function(){ });
        
        $(MyWebRTC).trigger("PeerConnected", [ remotePeerId, peerDisplayName ]);
    }
    

    // Broadcast a message to everyone in the room 
    var sendMessage = function(message){
        // If the message is empty, do not send it
        if (message.length == 0)
            return;
        
        // Sanitize the message to ensure no html is being sent
        var sanitizedMessage = sanitizeString(message);

        $(MyWebRTC).trigger("MessageSent", [ sanitizedMessage ]);
        
        // Loop through each of the peers
        $.map(peers, function(connection, key) {
            connection.sendMessage(sanitizedMessage);
        });
    };
    
    
    // Method to send file to connected peers
    var sendFile = function(file){

        // Check filesharing is enabled.
        if (options.fileSharing) {
        
            // If there is no file, do not continue
            if (file == null)
                return;
            
            // Loop through each of the peers
            $.map(peers, function(peer,key) {
                // Send the data to the peer connection, with the type 'message'
                peer.sendFile(file);
            });
        }

    };
    
    
    // Escape all characters that are part of HTML to ensure
    // HTML cannot be passed to remote peers.
    var sanitizeString = function(string){
        return string.replace('&','&amp;')
              .replace('/','&#47;')
              .replace('<','&lt;')
              .replace('>','&gt;')
              .replace('"','&quot;')
              .replace("'",'&#39;');
    }
    
    // Public methods / members:
    var MyWebRTC = {
        version: version,           // Rreturns the current version of the library
        getOptions: function() { return options; },
        init : init,
        close : close,
        getPeers : function() { return peers },
        setDisplayName : setDisplayName,
        getDisplayName: function() { return displayName; },
        connect : connect,
        removePeer : removePeer,
        addOffer : addOffer,
        addAnswer : addAnswer,
        addRemoteIceCandidate : addRemoteIceCandidate,
        sendMessage : sendMessage,
        sendFile : sendFile,
        acceptFile : acceptFile,
        setPeerDisplayName : function(id, displayName) { peers[id].setDisplayName(displayName); },
        getLocalMedia : function() {
			return {
				getStream: function() { return localStream },
				stopVideo: function() { setVideoEnabled(false) },
				startVideo: function() { setVideoEnabled(true) },
				stopAudio: function() { setAudioEnabled(false) },
				startAudio: function() { setAudioEnabled(true) },
			};
        }
    };
    
    if (global.MyWebRTC) {
        throw new Error('MyWebRTC Already Defined');
    } else {
        global.MyWebRTC = MyWebRTC;
    }
    

}(window));
