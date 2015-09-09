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
        // Default option values, which are used for any of the options
        // that are not set explicitly by the user.
        options = {             
            shareLocalVideo: true,
            shareLocalAudio: true,
            remoteVideo: true,
            textChat: true,
            allowScreensharing : true,
            iceServers: [],
            fileSharing : true
        };
        
    var PeerConnection, IceCandidate, SessionDescription;
    
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
        
        // Create global variables for the various WebRTC Methods/Classes, and assign the unprefixed/vendor prefixed method/class available in the current browser.
        // This means that vendor prefixes will not need to be use from this point on as the global variables can be used.
        // TODO: Global or local?
        /*this.PeerConnection = global.RTCPeerConnection || global.webkitRTCPeerConnection || global.mozRTCPeerConnection || global.msRTCPeerConnection;
        this.IceCandidate = global.RTCIceCandidate || global.mozRTCIceCandidate || global.webkitIceCandidate;
        this.SessionDescription = global.RTCSessionDescription || global.mozRTCSessionDescription || global.webkitRTCSessionDescription || global.msRTCSessionDescription;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;*/
        
        // Merge default options with the options passed in.
        $.extend(options, options, opts)
        
   
        
        // Loop through the iceServers passed in to create a list with the
        // required format for PeerConncetion
        $(options.iceServers).each(function(key, value) {
            peerConfiguration.iceServers.push({url: value});
        });
        

        
        // If any of the necessary components are not available
        // then the browser cannot run the app so trigger a browserNotSupported event
        /*if (!this.PeerConnection || 
            !this.IceCandidate || 
            !this.SessionDescription ||
            !navigator.getUserMedia) {
            
            $(MyWebRTC).trigger('browserNotSupported'); 
            return;
            
        } else {
            this.PeerConnection.bind(global);
            this.IceCandidate.bind(global);
            this.SessionDescription.bind(global);
        }*/
        
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
        
        $.each(peers, function(key, connection) {
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

    
    var join = function(sessionId) {
        
    }
    
    // Method to set up a peer connection to remote peer
    var connect = function(remotePeerId) {
        console.log('Initiating connection to peer: ' + remotePeerId);
        
        // Create a  new Peer object, pass in a new PeerConnecion
        // and store in the peers map.
        peers[remotePeerId] = new MyWebRTC.Connection(remotePeerId, localStream, peerConfiguration, peerOptions, options.textChat);
        
        // If text chat set up data channel listeners
        if (options.textChat) {
            $(peers[remotePeerId]).on('DataChannelClosed', onDataChannelClosed);
            $(peers[remotePeerId]).on('DataChannelOpen', onDataChannelOpen);
        }
        
        
        
        // Create an offer
        peers[remotePeerId].createOffer(function(offer) {
            console.log('offer created');
            // Trigger the CreateOffer event so subscribers are updated.
            $(MyWebRTC).trigger("CreateOffer", [ remotePeerId, displayName, offer ]);
        });

    }
    
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
    
    
    // Method by which remote offers can be passed to the local MyWebRTC object
    var addOffer =  function(remotePeerId, peerDisplayName, peerType, offer) {
        
        // Generate a Peer object, pass in a peer connection.
        // Store peer in the peers map.
        peers[remotePeerId] = new MyWebRTC.Connection(remotePeerId, localStream, peerConfiguration, peerOptions, options.textChat, peerType, peerDisplayName);
        
        // If text chat set up data channel listeners
        if (options.textChat) {
            $(peers[remotePeerId]).on('DataChannelClosed', onDataChannelClosed);
            $(peers[remotePeerId]).on('DataChannelOpen', onDataChannelOpen);
        }
        
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
            console.log('Sending a message to a peer');
            connection.sendMessage(sanitizedMessage);
        });
    };
    
    
    // Method to send file to connected peers
    var sendFile = function(file){
        
        if (options.fileSharing) {
        
            // If there is no file, do not continue
            if (file == null)
                return;

            // User the file submodile to read the file as a data URL, then
            // Send the file once the onLoad callback is called.
            MyWebRTC.File.readFileAsDataURL(file, function(event){
                sendFileString(event.target.result, file.name, event.target.result.length);
            });
        }

    };
    
    var sendFileString = function(text, id, size) {
            var chunkLength = 1000;
            var data = {};
        
            data.id = id;
            data.size = size;
            
            if (text.length > chunkLength) {
                data.message = text.slice(0, chunkLength);
                data.last = false;
            } else {
                data.message = text;
                data.last = true;
            }

            // Loop through each of the peers
           $.map(peers, function(obj, key) {
                console.log('Sending a file to a peer');
                // If their send data channel is open:
                if (obj.peerConnection.sendDataChannel.readyState === 'open') {
                    // Send the data to the peer connection, with the type 'message'
                    obj.peerConnection.sendDataChannel.send(JSON.stringify({ type : "file", data : data }));
                }
            });
            
            var remainingDataURL = text.slice(data.message.length);
            if (remainingDataURL.length) {
                setTimeout(function() {
                    sendFileString(remainingDataURL, id, size);
                }, 500);
            }
    }
    
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

    
    var downloadManager = {
        
        // Array of downloads
        downloads: {},
        updateDownload: function (data) {
            
            if (!this.downloads[data.id]) {
                this.downloads[data.id] = [];
                $(MyWebRTC).trigger("DownloadStarted", [ data.id ]);
            }
            this.downloads[data.id].push(data.message);
            

            var progress = this.downloads[data.id].join('').length / data.size * 100;
            $(MyWebRTC).trigger("DownloadProgress", [ data.id, progress ]);

            if (data.last) {
                $(MyWebRTC).trigger("DownloadComplete", [ this.downloads[data.id].join(''), data.id ]);
                delete(this.downloads[data.id]);
            }
        }
        
    }
    
    // Public methods / members:
    var MyWebRTC = {
        version: version,           // Rreturns the current version of the library
        options: function() { return options; },
        init : init,
        close : close,
        getPeers : function() { return peers },
        setDisplayName : setDisplayName,
        connect : connect,
        removePeer : removePeer,
        addOffer : addOffer,
        addAnswer : addAnswer,
        addRemoteIceCandidate : addRemoteIceCandidate,
        sendMessage : sendMessage,
        sendFile : sendFile,
        setPeerDisplayName : function(id, displayName) { console.log('passing on name change:' +displayName); peers[id].setDisplayName(displayName); },
        PeerConnection: PeerConnection,
        IceCandidate: IceCandidate,
        SessionDescription : SessionDescription,
        localMedia : {
            getStream: function() { return localStream },
            stopVideo: function() { setVideoEnabled(false) },
            startVideo: function() { setVideoEnabled(true) },
            stopAudio: function() { setAudioEnabled(false) },
            startAudio: function() { setAudioEnabled(true) },
        }
    };
    
    if (global.MyWebRTC) {
        throw new Error('MyWebRTC Already Defined');
    } else {
        global.MyWebRTC = MyWebRTC;
    }
    

}(window));
