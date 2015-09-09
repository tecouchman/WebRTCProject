var DownloadManager = (function(DataConnection) {

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
        
        // TODO: this is duplicated in peer factory!
        peerConnection.sendDataChannel.onmessage = function(event) {

            var receivedObj = JSON.parse(event.data);

            console.log('DATACHANNEL MESSAGE RECEIEVED: ' + receivedObj.type);

            if (receivedObj.type === 'message') {
                $(MyWebRTC).trigger("MessageReceived", [ receivedObj.data ]);
            } else if (receivedObj.type === 'file') {
                var file = JSON.parse(receivedObj.data);
                $(MyWebRTC).trigger("MessageReceived", [ file.name ]);
            }
        };
        
    };
    
    
    var DM = {
        setupDataChannel: setupDataChannel
    };

    return DM;

}());