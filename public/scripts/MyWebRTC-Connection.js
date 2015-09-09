// Connection constructor function.
MyWebRTC.Connection = function(remotePeerId, localStream, configuration, options, dataConnection, type, displayName) {
        
    var localPeer = this;

    this.id = remotePeerId;
    this.stream  = null;
    console.log('udefined here?:' + displayName);
    this.displayName = displayName;
    this.type = type;

    // PeerConnection object for creating a connection with a peer
    // Takes in the ice server urls, and options for the conncetions type.
    this.peerConnection = new RTCPeerConnection(configuration, options);

    this.peerConnection.addStream(localStream);
    
    
    var onMessageHandler = function(event) {
        
        // Parse the receieved JSON
        var receivedData = JSON.parse(event.data);

        // Recieved data can be either a message or a file.
        // Check the 'type' property to check which it is 
        
        // If a message was recieved
        if (receivedData.type === 'message') {
            console.log('got a message:' + receivedData.data);
            // Trigger a 'MessageReceived' event
            $(localPeer).trigger("MessageReceived", [ receivedData.data ]);
            
        } else if (receivedData.type === 'fileOffer') { // Else if a file has been offered
            alert(receivedData.data.name + '   ' + receivedData.data.size)
            // Trigger a 'MessageReceived' event
            $(localPeer).trigger("FileOffer", [ receivedData.data.name, receivedData.data.size ]);
            
        } else if (receivedData.type === 'fileAccept') { // Else if a file has been offered
            
            // Trigger a 'MessageReceived' event
            $(localPeer).trigger("FileAccept", [ receivedData.data.name ]);
            
        }else { // Else the data is a file:
            
            // If filesharing is disabled then ignore any recieved file data
            if (options.fileSharing) {
                // Else hand them to the down load manager
                downloadManager.updateDownload(receivedData.data);
            }
        }
    }
        
        
        
    localPeer.peerConnection.ondatachannel = function(e) {

        console.log('recieved a channel yo');
        localPeer.peerConnection.sendDataChannel = e.channel;

        $(MyWebRTC).trigger("DataChannelOpen");

        localPeer.peerConnection.sendDataChannel.onmessage = onMessageHandler;
        
        // When the send data channel is open (ready for ending data);
        localPeer.peerConnection.sendDataChannel.onopen = function() {
            console.log('Data channel open');
            $(localPeer).trigger("DataChannelOpen");
        };
        
        // When the send data channel is open (ready for ending data);
        localPeer.peerConnection.sendDataChannel.onclose = function() {
            console.log('Data channel closed');
            $(localPeer).trigger("DataChannelClosed");
            
            createDataChannel();
        };
        
    };

        
    
    // Method to setup a data channel
    var createDataChannel = function() {
        
        console.log('creating data channel');
        
        // Create the data channel through which data can be sent between peers.
        // TODO: research the beneffits of reliable vs unrealiable.
        var sendDataChannel = localPeer.peerConnection.createDataChannel('DataChannel', { relaiable : false });

        sendDataChannel.onmessage = onMessageHandler;
        
        // When the send data channel is open (ready for ending data);
        sendDataChannel.onopen = function() {
            console.log('Data channel open');
            $(localPeer).trigger("DataChannelOpen");
        };
        
        // When the send data channel is open (ready for ending data);
        sendDataChannel.onclose = function() {
            console.log('Data channel closed');
            $(localPeer).trigger("DataChannelClosed");
        };
        
   

        localPeer.peerConnection.sendDataChannel = sendDataChannel;
    
    };
    
    
    if (dataConnection) {
        createDataChannel();   
    }

    this.peerConnection.onicecandidate = function (e) {
        if (e.candidate) {
            // Trigger the GetIceCandidate event so subscribers are updated.
            $(MyWebRTC).trigger("GetIceCandidate", [ remotePeerId, e.candidate ]);
        }
    };



    localPeer.peerConnection.onaddstream = function(e) {

        // Store a reference to the stream in the connection object.
        localPeer.stream = e.stream;

        // Trigger the GetRemoteStream event so subscribers are updated.
        $(MyWebRTC).trigger("GetRemoteStream", [ localPeer.id, localPeer.peerType, e.stream ]);
    } 


    this.addOffer = function(offer) {
        this.peerConnection.setRemoteDescription(offer, function(){


            
            // Object to hold the constraints on the connection
            // with the remote peer.
            var answerConstraints = {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            }    

            localPeer.peerConnection.createAnswer(
                function(answer) {
                    // Set the local description fo the peer connection
                    // to the answer that was generated
                    localPeer.peerConnection.setLocalDescription(answer);

                    // Trigger the CreateAnswer event so subscribers are updated.
                    $(MyWebRTC).trigger("CreateAnswer", [ localPeer.id, localPeer.displayName, answer ]);
                }, 
                function(err){
                    // TODO: Error handling
                    console.log(err);
                },
                answerConstraints
            );

        }, function(err) { console.log(err) });
    }


    
    this.addAnswer = function(answer, callback) {

        localPeer.peerConnection.setRemoteDescription(answer, function() {}, function(err) {}); 


        
    }
    
    
    
    this.createOffer = function(callback) {
        
        this.peerConnection.createOffer(function(offer){

            localPeer.peerConnection.setLocalDescription(offer);
            
            callback(offer);

        }, function(err) { console.log(err); }, null);   
        
    }

    this.addIceCandidate = function(iceCandidate) {
        localPeer.peerConnection.addIceCandidate(iceCandidate);
    }
    
    this.sendMessage = function(message) {
        // If their send data channel is open:
        if (localPeer.peerConnection.sendDataChannel.readyState === 'open') {
            
            console.log('im sending a message');
            
            // Send the data to the peer connection, with the type 'message'
            localPeer.peerConnection.sendDataChannel.send(JSON.stringify({ type : "message", data : message }));
        }
    }
    
    this.send = function(data) {
        // If their send data channel is open:
        if (localPeer.peerConnection.sendDataChannel.readyState === 'open') {
            // Send the data to the peer connection, with the type 'message'
            localPeer.peerConnection.sendDataChannel.send(JSON.stringify(data));
        }
    }
    
    this.setDisplayName = function(displayName) {
        console.log('display name updated to :' + displayName);
        this.displayName = displayName;   
    }

    this.stopVideo = function() { 
        if (this.stream && this.stream.getVideoTracks()[0]) {
            this.stream.getVideoTracks()[0].enabled = false; 
        }
    };
    this.startVideo = function() { 
        if (this.stream && this.stream.getVideoTracks()[0]) {
            this.stream.getVideoTracks()[0].enabled = true; 
        }
    };
    this.stopAudio = function() { 
        if (this.stream && this.stream.getAudioTracks()[0]) {
            this.stream.getAudioTracks()[0].enabled = false; 
        }
    };
    this.startAudio = function() { 
        if (this.stream && this.stream.getAudioTracks()[0]) {
            this.stream.getAudioTracks()[0].enabled = true; 
        }
    };
    
    this.close = function() {
        this.stream.stop();
        this.peerConnection.close();
    }

};