/*
 * MyWebRTC Core
 * Tom Couchman 2015
 */
(function (global) {
    'use strict';
    
    // Private variables
    var version = '0.1.2',        // Current version of the library
        localPeerId = Math.random(), // TODO: Make real Peer Ids
        peers = {},     // A map of PeerConnection objects that allow for WebRTC based communication
                        // between the client and other peers.
        localStream,    // The clients webcam/audio stream.
        dataChannelOpen = false,    // Whether or not data can be sent to other peers :-
                                    // Setting is enabled and peers are present
        options,
        iceServers = [];
        
    var PeerConnection, IceCandidate, SessionDescription;
    
    // Default options values, which are used for any of the options
    // that are not set explicitly by the user.
    var defaultOptions = {
        shareLocalVideo: true,
        shareLocalAudio: true,
        remoteVideo: true,
        iceServers: []
    }
    
    // init function, does the initial set up to allow for WebRTC communication
    var init = function (opts) {
        
        options = {};
        
        // Merge the users options with default options to create a full list of options
        $.extend(options, defaultOptions, opts)
        
        // Loop through the iceServers passed in to create a list with the
        // required format for PeerConncetion
        $(options.iceServers).each(function(key, value) {
            iceServers.push({url: value});
        });
        
        // Create global variables for the various WebRTC Methods/Classes, and assign the unprefixed/vendor prefixed method/class available in the current browser.
        // This means that vendor prefixes will not need to be use from this point on as the global variables can be used.
        // TODO: Global or local?
        this.PeerConnection = global.RTCPeerConnection || global.webkitRTCPeerConnection || global.mozRTCPeerConnection || global.msRTCPeerConnection;
        this.PeerConnection.bind(global);
        
        this.IceCandidate = global.RTCIceCandidate || global.mozRTCIceCandidate || global.webkitIceCandidate;
        this.IceCandidate.bind(global);
        
        this.SessionDescription = global.RTCSessionDescription || global.mozRTCSessionDescription || global.webkitRTCSessionDescription || global.msRTCSessionDescription;
        this.SessionDescription.bind(global);
        
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
   
        // Only request local media if either local video or audio are being shared
        // else will error.
        if (options.shareLocalVideo || options.shareLocalAudio) {
            // Options for the user media stream
            var options = {
                video: options.shareLocalVideo,
                audio: options.shareLocalAudio
            };

            // Get the user media stream
            navigator.getUserMedia(options,
                // On stream recieved.
                function (stream) {
                    console.log('Got local media stream');

                    // Store a reference to the local stream
                    localStream = stream;

                    // Trigger the event so subscribers are updated.
                    $(MyWebRTC).trigger('GetLocalStream', [ stream ]);
                    $(MyWebRTC).trigger('ReadyForCommunication');

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
    
    // Recieve ice candidates from the remote peers.
    var addRemoteIceCandidate = function (remotePeerId, iceCandidate) {
        peers[remotePeerId].peerConnection.addIceCandidate(iceCandidate);
    };
    
    // Method to set up a peer connection to remote peer
    var connectToPeer = function(remotePeerId) {
        console.log('Initiating connection to peer: ' + remotePeerId);
        
        // Create a new Peer object, pass in a new PeerConnecion
        // and store in the peers map.
        peers[remotePeerId] = PeerConnectionFactory.getPeerConnection(remotePeerId);
        
        setupDataChannel(peers[remotePeerId].peerConnection);
        
        console.log('creating offer');
        peers[remotePeerId].peerConnection.createOffer(function(offer){

            console.log('offer created');
            
            // Trigger the CreateOffer event so subscribers are updated.
            $(MyWebRTC).trigger("CreateOffer", [ remotePeerId, offer ]);
            
            peers[remotePeerId].peerConnection.setLocalDescription(offer);
        }, function(err) { console.log(err); }, null);
    }
    
    // Method to remove peers
    var removePeer = function (remotePeerId) {
        // Remove the selected peer from the peers map
        delete peers[remotePeerId];
        
        // Publish an event so subscribers are notified of the users departure
        $(MyWebRTC).trigger('PeerDisconnected', [ remotePeerId ]);
    }    
    
    
    // Method by which remote offers can be passed to the local MyWebRTC object
    var addOffer =  function(remotePeerId, offer) {
        // Generate a Peer object, pass in a peer connection.
        // Store peer in the peers map.
        peers[remotePeerId] = PeerConnectionFactory.getPeerConnection(remotePeerId);

        peers[remotePeerId].peerConnection.onaddstream = function(e) {
            console.log('Got remote stream');
            
            peers[remotePeerId].stream = e.stream;

            // Trigger the GetRemoteStream event so subscribers are updated.
            $(MyWebRTC).trigger("GetRemoteStream", [ remotePeerId,  e.stream ]);
        } 
        
        peers[remotePeerId].peerConnection.setRemoteDescription(offer, function(){
            // Object to hold the constraints on the connection
            // with the remote peer.
            var answerConstraints = {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            }    
            
            peers[remotePeerId].peerConnection.createAnswer(
                function(answer) {
                    // Set the local description fo the peer connection
                    // to the answer that was generated
                    peers[remotePeerId].peerConnection.setLocalDescription(answer);
                    
                    // Trigger the CreateAnswer event so subscribers are updated.
                    $(MyWebRTC).trigger("CreateAnswer", [ remotePeerId, answer ]);
                    
                    $(MyWebRTC).trigger("PeerConnected", [ remotePeerId ]);
                }, 
                function(err){
                    // TODO: Error handling
                    console.log(err);
                },
                answerConstraints
            );
        }, function(err) { console.log(err) });

    };

    // Method by which remote answers can be passed to the local MyWebRTC object
    var addAnswer = function(remotePeerId, answer) {
        
        // TODO: This function exists twice.
        peers[remotePeerId].peerConnection.onaddstream = function(e) {
            console.log('Got remote stream');
            
            peers[remotePeerId].stream = e.stream;
            
            $(MyWebRTC).trigger("GetRemoteStream", [ remotePeerId,  e.stream ]);
        } 
        
        peers[remotePeerId].peerConnection.setRemoteDescription(answer);
        
        $(MyWebRTC).trigger("PeerConnected", [ remotePeerId ]);
    }
    
    var sendMessage = function(message){
        // If the message is empty, do not send it
        if (message.length == 0)
            return;
        
        // Sanitize the message to ensure no html is being sent
        var sanitizedMessage = sanitizeString(message);
        
        console.log('Sending a message to all');
        
        $(MyWebRTC).trigger("MessageSent", [ sanitizedMessage ]);
        
        // Loop through each of the peers
        $.map(peers, function(obj, key) {
            console.log('Sending a message to a peer');
            // If their send data channel is open:
            if (obj.peerConnection.sendDataChannel.readyState === 'open') {
                // Send the data to the peer connection, with the type 'message'
                obj.peerConnection.sendDataChannel.send(JSON.stringify({ type : "message", data : sanitizedMessage }));
            }
        });
    };
    
    
    // Method to send file to connected peers
    var sendFile = function(file){
        // If there is no file, do not continue
        if (file == null)
            return;
        
        // User the file submodile to read the file as a data URL, then
        // Send the file once the onLoad callback is called.
        MyWebRTC.File.readFileAsDataURL(file, function(event){
            sendFileString(event.target.result, file.name, event.target.result.length);
        });
        

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
    
    // Method to setup a data channel
    var setupDataChannel = function(peerConnection) {
                // Create the data channel through which data can be sent between peers.
        // TODO: research the beneffits of reliable vs unrealiable.
        var sendDataChannel = peerConnection.createDataChannel('DataChannel', { relaiable : false });

        peerConnection.sendDataChannel = sendDataChannel;

        // When the send data channel is open (ready for ending data);
        sendDataChannel.onopen = function() {
            console.log('Data channel open');
            
            // If no data channels were previously opened:
            if (!dataChannelOpen) {
                // Set dataChannelOpen to true to indicate messages can be sent
                dataChannelOpen = true;
                // Trigger the DataChannelOpen event so subscribers know
                // messages can be sent
                $(MyWebRTC).trigger("DataChannelOpen");
            }
        };
        
        // When the send data channel is open (ready for ending data);
        sendDataChannel.onclose = function() {
            console.log('Data channel closed');

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
        
        peerConnection.sendDataChannel.onmessage = onMessageHandler;
        
    };
    
    var onMessageHandler = function(event) {
        
        var receivedObj = JSON.parse(event.data);

        console.log('DATACHANNEL MESSAGE RECEIEVED: ' + receivedObj.type);

        if (receivedObj.type === 'message') {
            $(MyWebRTC).trigger("MessageReceived", [ receivedObj.data ]);
        } else {
            downloadManager.updateDownload(receivedObj.data);
        }
    }
    

    // Factory that generates Creates PeerConnections
    var PeerConnectionFactory = {
        
        // The Stun/Turn servers to use
        configuration : {
            iceServers: iceServers
        },
        // The options for the connection type.
        // DtlsSrtpKeyAgreement allows chrome and firefox to interoperate
        // RtpDataChannels needed to use DataChannels API on firefox
        options : {
                 mandatory: {
                    width: { min: 640 },
                    height: { min: 480 }
                  },
                optional: [
                    {DtlsSrtpKeyAgreement: true},
                    {RtpDataChannels: true}
                ]
        },
        getPeerConnection : function(remotePeerId) {
            // PeerConnection object for creating a connection with a peer
            // Takes in the ice server urls, and options for the conncetions type.
            var peer = {};
            var peerCon = new MyWebRTC.PeerConnection(this.configuration, this.options);

            if (localStream) {
                peerCon.addStream(localStream);
            } else {
                console.error('Stream not ready for peer connection');   
            }
            
            peerCon.onicecandidate = function (e) {
                if (e.candidate) {
                    // Trigger the GetIceCandidate event so subscribers are updated.
                    $(MyWebRTC).trigger("GetIceCandidate", [ remotePeerId, e.candidate ]);
                }
            };
            
            peerCon.ondatachannel = function(e) {

                peerCon.sendDataChannel = e.channel;
                
                $(MyWebRTC).trigger("DataChannelOpen");
                
                peerCon.sendDataChannel.onmessage = onMessageHandler;
            };
            
            peer.peerConnection = peerCon;
            
            return peer;
        }

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
        'version': version,           // Rreturns the current version of the library
        'init' : init,
        'peers' : peers,
        'localPeerId': localPeerId,
        'localStream': localStream, // Returns the clients webcam stream
        'connectToPeer': connectToPeer,
        'removePeer': removePeer,
        'addOffer': addOffer,
        'addAnswer': addAnswer,
        'addRemoteIceCandidate': addRemoteIceCandidate,
        'sendMessage': sendMessage,
        'sendFile': sendFile,
        PeerConnection: PeerConnection,
        IceCandidate: IceCandidate,
        SessionDescription : SessionDescription
    };
    
    if (global.MyWebRTC) {
        throw new Error('MyWebRTC Already Defined');
    } else {
        global.MyWebRTC = MyWebRTC;
    }

}(window));
