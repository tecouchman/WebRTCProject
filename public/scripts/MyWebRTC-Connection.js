// Connection constructor function.
MyWebRTC.Connection = function(remotePeerId, localStream, configuration, options, dataConnection, type, displayName) {
        
    var _connection = this;

    this.id = remotePeerId;
    this.stream  = null;
    this.displayName = displayName;
    this.type = type;
    
    // Details of the file offers sent and recieved.
    var sentFileOffers = {},
        recievedFileOffers = {},
        downloads = {};

    // PeerConnection object for creating a connection with a peer
    // Takes in the ice server urls, and options for the conncetions type.
    this.peerConnection = new RTCPeerConnection(configuration, options);

    if (localStream) {
        this.peerConnection.addStream(localStream);
    }
    
    
    var onMessageHandler = function(event) {
        
        // Parse the receieved JSON
        var receivedData = JSON.parse(event.data);

        // Recieved data can be either a message or a file.
        // Check the 'type' property to check which it is 
        
        // If a message was recieved
        switch (receivedData.type) {
            case 'message':
                
                console.log('got message: '+ receivedData.data);
                // Trigger a 'MessageReceived' event
                $(_connection).trigger("MessageReceived", [ receivedData.data ]);
                break;
            
            case 'fileOffer':  // Else if a file has been offered
                // Trigger a 'MessageReceived' event
                $(_connection).trigger("FileOffer", [ receivedData.data.name, receivedData.data.size ]);
                break;
            
            case 'fileAccept': // Else if a file has been offered

                if (sentFileOffers[receivedData.data.name]) {

                    var file = sentFileOffers[receivedData.data.name].file;
                    
                    // Use the file submodile to read the file as a data URL, then
                    // Send the file once the onLoad callback is called.
                    MyWebRTC.File.readFileAsDataURL(file, function(event){

                        // Send the file using the send file string method
                        sendFileString(event.target.result, file.name, event.target.result.length);
                    });
                }

                // Trigger a 'MessageReceived' event
                $(_connection).trigger("FileAccept", [ receivedData.data.name ]);
                break;
            
            case "file": // Else the data is a file:
            
                var fileId = receivedData.data.id;
                
                // If the download has just started
                if (!downloads[fileId]) {
                    downloads[fileId] = new Download(fileId, receivedData.data.size);
                    $(_connection).trigger("DownloadStarted", [ fileId ]);
                    
                    // When the download is complete
                    $(downloads[fileId]).on('DownloadComplete', function (event, fileId, file) {
                        delete downloads[fileId];
                        $(_connection).trigger("DownloadComplete", [ fileId, file ]);
                    });
                    
                    $(downloads[fileId]).on("DownloadProgress", function(event, fileId, progress) {
                        $(_connection).trigger("DownloadProgress", [ fileId, progress ]);
                    });
                }
                
                    downloads[fileId].append(receivedData.data);
                
                break;
        }
    }
        
    _connection.peerConnection.ondatachannel = function(e) {

        _connection.peerConnection.sendDataChannel = e.channel;

        $(MyWebRTC).trigger("DataChannelOpen");

        _connection.peerConnection.sendDataChannel.onmessage = onMessageHandler;
        
        // When the send data channel is open (ready for ending data);
        _connection.peerConnection.sendDataChannel.onopen = function() {
            $(_connection).trigger("DataChannelOpen");
        };
        
        // When the send data channel is open (ready for ending data);
        _connection.peerConnection.sendDataChannel.onclose = function() {
            $(_connection).trigger("DataChannelClosed");
            
            createDataChannel();
        };
        
    };  
    
    // Method to setup a data channel
    var createDataChannel = function() {
            
        // Create the data channel through which data can be sent between peers.
        // TODO: research the beneffits of reliable vs unrealiable.
        var sendDataChannel = _connection.peerConnection.createDataChannel('DataChannel', { relaiable : false });

        sendDataChannel.onmessage = onMessageHandler;
        
        // When the send data channel is open (ready for ending data);
        sendDataChannel.onopen = function() {

            $(_connection).trigger("DataChannelOpen");
        };
        
        // When the send data channel is open (ready for ending data);
        sendDataChannel.onclose = function() {

            $(_connection).trigger("DataChannelClosed");
        };
        
        _connection.peerConnection.sendDataChannel = sendDataChannel;
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



    _connection.peerConnection.onaddstream = function(e) {

        // Store a reference to the stream in the connection object.
        _connection.stream = e.stream;

        // Trigger the GetRemoteStream event so subscribers are updated.
        $(MyWebRTC).trigger("GetRemoteStream", [ _connection.id, _connection.peerType, e.stream ]);
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

            _connection.peerConnection.createAnswer(
                function(answer) {
                    // Set the local description fo the peer connection
                    // to the answer that was generated
                    _connection.peerConnection.setLocalDescription(answer);

                    // Trigger the CreateAnswer event so subscribers are updated.
                    $(MyWebRTC).trigger("CreateAnswer", [ _connection.id, MyWebRTC.getDisplayName(), answer ]);
                }, 
                function(err){
                    // TODO: Error handling
                    console.log(err);
                },
                answerConstraints
            );

        }, function(err) { console.log(err) });
    }


    // Method by which answers can be passed to the peer connection
    this.addAnswer = function(answer, callback) {
        _connection.peerConnection.setRemoteDescription(answer, function() {}, function(err) {}); 
    }
    
    // Method to create an offer
    this.createOffer = function(callback) {
        this.peerConnection.createOffer(function(offer){

            _connection.peerConnection.setLocalDescription(offer);
            
            callback(offer);

        }, function(err) { console.log(err); }, null);   
        
    }

    // Method by which ice candidates from remote peers can be added
    this.addIceCandidate = function(iceCandidate) {
        _connection.peerConnection.addIceCandidate(iceCandidate);
    }
    
    // Method to send a message to a remove peer
    this.sendMessage = function(message) {
        // If their send data channel is open:
        if (_connection.peerConnection.sendDataChannel.readyState === 'open') {
            console.log('sending message');
            // Send the data to the peer connection, with the type 'message'
            _connection.peerConnection.sendDataChannel.send(JSON.stringify({ type : "message", data : message }));
        }
    }
    
    
    // initate file sending
    this.sendFile = function(file) {
    
        // If their send data channel is open:
        if (_connection.peerConnection.sendDataChannel.readyState === 'open') {
            
            sentFileOffers[file.name] = {
                file: file
            };
            
            var data = {
                name: file.name,
                size: file.size
            }
            
            $(_connection).trigger("FileSendStarted", [ file.name ]);

            // First send a file, when an accept is recieved, then send the file
            _connection.send({ type : "fileOffer", data : data });
        }
    }
    
    this.acceptFileOffer = function(fileId) {
        _connection.send({ type : "fileAccept", data: { name : fileId } });
    }
    
    // Send data
    this.send = function(data) {
        // If their send data channel is open:
        if (_connection.peerConnection.sendDataChannel.readyState === 'open') {
            // Send the data to the peer connection, with the type 'message'
            _connection.peerConnection.sendDataChannel.send(JSON.stringify(data));
        }
    }
    
    this.setDisplayName = function(displayName) {
        this.displayName = displayName;   
    }

    // Method to stop the video stream
    this.stopVideo = function() { 
        if (this.stream && this.stream.getVideoTracks()[0]) {
            this.stream.getVideoTracks()[0].enabled = false; 
        }
    };
    
    // Method to start the video stream
    this.startVideo = function() { 
        if (this.stream && this.stream.getVideoTracks()[0]) {
            this.stream.getVideoTracks()[0].enabled = true; 
        }
    };
    
    // Method to stop the audio stream
    this.stopAudio = function() { 
        if (this.stream && this.stream.getAudioTracks()[0]) {
            this.stream.getAudioTracks()[0].enabled = false; 
        }
    };
    
    // Method to start the audio stream
    this.startAudio = function() { 
        if (this.stream && this.stream.getAudioTracks()[0]) {
            this.stream.getAudioTracks()[0].enabled = true; 
        }
    };
    
    // Close this connection
    this.close = function() {
        //this.stream.stop();
        this.peerConnection.close();
    }
    
    
    var sendFileString = function(text, fileId, size) {
            var chunkLength = 16000;
            var data = {};
        
            // Store the name and size of the file
            // in the data object
            data.id = fileId;
            data.size = size;
            
            // if the file is still large than the length of chunks being send
            // then spilice of a chunk sized piece to send
            if (text.length > chunkLength) {
                data.message = text.slice(0, chunkLength);
                data.isLast = false;
            } else {
                // If less than a chunk is left, send it and set data.last
                // to true so the recipient knows there's nothing left to come.
                data.message = text;
                data.isLast = true;
            }
        
        
            $(_connection).trigger("FileSendProgress", [ fileId, ((size - text.length) / size * 100) ]);
        
            _connection.send({ type : "file", data : data });

            // Set text to the remanining data
            var remainingDataURL = text.slice(data.message.length);
            // If there is still some to send, recall this method.
            if (remainingDataURL.length) {
                setTimeout(function() {
                    sendFileString(remainingDataURL, fileId, size);
                }, 0);
            } else {
                $(_connection).trigger("FileSendComplete", [ fileId, sentFileOffers[fileId].file ]);   
            }
    }
    
    var Download = function(id, fileSize){
        
        this.id = id;
        this.filesize = fileSize;
        
        // Data of the file
        this.data = [];
        
        // Mehod to add data as data is recieved
        this.append = function (chunk) {
            
            this.data.push(chunk.message);

            if (chunk.isLast) {
                $(this).trigger("DownloadComplete", [ this.id, this.data.join('') ]);
            } else {
                $(this).trigger("DownloadProgress", [ this.id, this.getProgress() ]);
            }
        };
        
        this.getProgress = function () {
            return this.data.join('').length / this.filesize * 100;
        };
    }
    

};