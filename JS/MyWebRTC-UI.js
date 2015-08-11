/*
 * MyWebRTC UI sub-module
 * Tom Couchman 2015
 */
MyWebRTC.UI = (function (container) {
    'use strict';
    
    // Declare an object that will be accessible to the user
    // e.g. the public API
    var UIAPI,
        moduleId = "MyWebRTC-UI";
    
    // Shim for the fullscreen API
    document.exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    
    console.log(moduleId + ': Adding the onLocalStream callback');
    
    $(MyWebRTC).on("GetLocalStream", function (evt, stream) {
        
        // Get a reference to the video container element
        var videoContainer = $('#rtc-video-container');

        // Generate a video element for the stream
        var localVideo = generateVideoElement(stream);
        // Give the video element an id
        localVideo.setAttribute('class','rtc-local-video alone');
        // Mute the local video to avoid echo
        localVideo.muted = "muted";
        // Append the video element to the passed in element
        videoContainer.append(localVideo);
    });
    
    $(MyWebRTC).on("GetRemoteStream", function (evt, remotePeerId, stream) {
        
        // Get a reference to the video container element
        var videoContainer = $('#rtc-video-container');
        
        // When the local stream is alone, it has extra stylings,
        // so remove these when another user enters.
        $('.rtc-local-video').removeClass('alone');
        
        // Generate a video element for the stream
        var remoteVideo = generateVideoElement(stream);
        
        // Set the id to the peerId
        remoteVideo.setAttribute('id',remotePeerId);
        // Give the video element an id
        remoteVideo.setAttribute('class','rtc-remote-video');

        // Append the video element to the passed in element
        videoContainer.append(remoteVideo);
    });
    
    /* Method to generate video elements for camera stream */
    var generateVideoElement = function(stream) {
        // Create a video element to display the stream
        var videoElem = document.createElement('video');
        // Generate a URL object from the stream and set
        // is as the source of the video element
        videoElem.src = window.URL.createObjectURL(stream);
        // Add sutoplay attribute to the video element so the video
        // is not paused.
        videoElem.setAttribute('autoplay', '');
        
        return videoElem;
    }
    
    $(MyWebRTC).on("PeerConnected", function(evt, remotePeerId) {
        var newUserElem = $('<p>').append(remotePeerId + " has joined the chat");
        $('#rtc-messages').append(newUserElem);
        scrollToMessagesBottom();
    });
    
    $(MyWebRTC).on("PeerDisconnected", function(evt, remotePeerId) {
        var newUserElem = $('<p>').append(remotePeerId + " has left the chat");
        $('#rtc-messages').append(newUserElem);
        
        // Revmove the peers video window, if there is one
        $('#' + remotePeerId).remove();
        
        scrollToMessagesBottom();
    });
    
    $(MyWebRTC).on("DataChannelOpen", function(evt) {
        // Enable the send button
        $('#rtc-send').removeAttr('disabled');
        $('#rtc-input-message').removeAttr('disabled');
    });
    
    $(MyWebRTC).on("DataChannelClosed", function(evt) {
        $('#rtc-send').attr('disabled');
    });
    
    // When the user sends a message
    $(MyWebRTC).on("MessageSent", function(evt, message) {
        addMessage(true, message);
    });
    
    // When the user receieves a message
    $(MyWebRTC).on("MessageReceived", function(evt, message) {
        addMessage(false, message);
    });
    
    var addMessage = function(isLocal, message) {
        var messageElem = $('<div>').append($('<p>').append(message));
        messageElem.addClass('rtc-message');
        
        var timeStampElem = getTimeStamp();
        if (isLocal) {
            messageElem.addClass('local');
            timeStampElem.addClass('local');
        } else {
            messageElem.addClass('remote');
            timeStampElem.addClass('remote');
        }
        
        $('#rtc-messages').append(timeStampElem).append(messageElem);
        scrollToMessagesBottom();
    }
    
    var getTimeStamp = function() {
        var date = new Date();
        var time = padLeadingZero(date.getHours()) + ':' + padLeadingZero(date.getMinutes());
        
        return $('<p>').addClass('rtc-timestamp').append(time);
    }
    
    var padLeadingZero = function (int) {
        if ((int + '').length == 1) {
            return '0' + int;   
        } else {
            return '' + int;   
        }
    }
    
    $('#rtc-send').click(function() {
        console.log('Sending my message: ' + $('#rtc-input-message').val())
        // Send the message is the text box
        MyWebRTC.sendMessage( $('#rtc-input-message').val() );
        
        // Clear the message text box
        $('#rtc-input-message').val('');
        
        return false;
    });
    
    var fullscreenButton = document.getElementById('rtc-btn-fullscreen');
    
    if (fullscreenButton) {
        fullscreenButton.onclick = function () {
            MyWebRTC.UI.toggleFullscreen(container);
            if (fullscreenButton.innerHTML == 'Enter Fullscreen') {
                fullscreenButton.innerHTML = 'Exit Fullscreen';
            } else {
                fullscreenButton.innerHTML = 'Enter Fullscreen';
            }
        };
    }
    
    var toggleFullScreen = function (elem) {
        // Vendor prefix shim to get current fullscreen element
        document.fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElemen;

        // If no element is currently fullscreen, enable fullscreen.
        if (!document.fullscreenElement) {
            if (elem.requestFullscren) {
                elem.requestFullscren();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen(elem.ALLOW_KEYBOARD_INPUT);
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            // Else if an element is fullscreen disable it
            document.exitFullscreen();
        }
    };
    
    $(document).ready(function() {
        
    });
    
    var scrollToMessagesBottom = function() {
        $('#rtc-messages').scrollTop($('#rtc-messages').height());
    };
    
    
    UIAPI = {
        'toggleFullscreen': toggleFullScreen // Method to toggle fullscreen on an element. 
    };
    
    // Return the public methods/fields to the user
    return UIAPI;
    
}(document.getElementById('rtc-container') || document.body));