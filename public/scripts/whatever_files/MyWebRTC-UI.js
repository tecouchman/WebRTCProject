/*
 * MyWebRTC UI sub-module
 * Tom Couchman 2015
 */
MyWebRTC.UI = (function (container) {
    'use strict';
    
    // Declare an object that will be accessible to the user
    // e.g. the public API
    var UIAPI,
        moduleId = "MyWebRTC-UI",
        options,
        renderer = ECT({ root : '/views', ext : '.ect' });
    
    // Shim for the fullscreen API
    document.exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    
    var init = function(opts) {
        options = {};
        options.passwordRequired = opts.passwordRequired != null? opts.passwordRequired : false;
        options.customisableId = opts.customisableId != null? opts.customisableId : true;
        
        if (options.passwordRequired === true) {
            $('#rtc-password-container').removeClass('hidden');
        }
    }
    
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
        
        // Remove the peers video window, if there is one
        $('#' + remotePeerId).remove();
        
        scrollToMessagesBottom();
        
        if ($.isEmptyObject(MyWebRTC.peers)) {
            // When the local stream is alone, it has extra stylings,
            // add the along class to enable them
            $('.rtc-local-video').addClass('alone');   
        }
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
    $(MyWebRTC).on("DownloadComplete", function(evt, fileDataURL, id) {
        var downloadElem = $('#' + id.replace('.',''));
        downloadElem.html('');

        var img = $('<img>');
        img.attr('src', fileDataURL);
        downloadElem.append(img);
    });
    
    // When a download starts
    $(MyWebRTC).on("DownloadStarted", function(evt, id) {
        var downloadElem = $('<div>').addClass('rtc-message').addClass('remote').addClass('download');
        downloadElem.attr('id', id.replace('.',''));
        downloadElem.append($('<p>').addClass('rtc-download-name').append(id));
        downloadElem.append($('<progress>').addClass('rtc-download-progress').attr('max', 100));
        $('#rtc-messages').append(downloadElem);
    });

    // When data is recieved for a download
    $(MyWebRTC).on("DownloadProgress", function(evt, id, percent) {
        var downloadElem = $('#' + id.replace('.','') + ' > progress');
        downloadElem.attr('value',percent);
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
    
    $('#rtc-input-file').on('change', function() {
        
    })
    
    $('#rtc-send').click(function(e) {
        
        // Prevent default submit behaviour to avoid page reload.
        e.preventDefault();
        
        console.log('Sending my message: ' + $('#rtc-input-message').val())
        
        // If the user has entered a message then 
        // send it to the other peers
        if ($('#rtc-input-message').val() != '') {
            // Send the message is the text box
            MyWebRTC.sendMessage( $('#rtc-input-message').val() );

            // Clear the message text box
            $('#rtc-input-message').val('');
        }
        
        // If the user has selected a file
        // send it to the other peers
        if ($('#rtc-input-file')[0].files[0] != null) {
            
            
            
            var file = $('#rtc-input-file')[0].files[0];
            console.log(file);
            
            // Send the message is the text box
            MyWebRTC.sendFile( file );
        }
        
        $('rtc-input-form').reset();
        
    });
    
    $('#rtc-password-submit').click(function(e) {
        // Prevent default submit behaviour to avoid page reload
        e.preventDefault();
        
        // Send the password to the server via the com submodule
        MyWebRTC.Com.submitPassword($('#rtc-password-input').val());
    });
    
    // Called if the password was correct
    $(MyWebRTC).on("PasswordCorrect", function(evt) {
        $('#rtc-password-container').addClass('hidden');
    });
    
    // Called if the password was incorrect
    $(MyWebRTC).on("PasswordIncorrect", function(evt) {
        // Remove the 'hidden' class on the 'incorrect password' label
        // so it will be displayed to the user.
        $('#rtc-password-incorrect-label').removeClass('hidden');
    });
    
    // Called if the room is full
    $(MyWebRTC).on("RoomFull", function(evt) {
        var data = { id : 'roomFull' , 
                    title : 'Room is Full',
                    message : 'Please try again later.'
                };
        var popup = renderer.render('partials/popup', data);
        $('#rtc-container').append(popup);
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
    
    var scrollToMessagesBottom = function() {
        $('#rtc-messages').scrollTop($('#rtc-messages').height());
    };
    
    
    
    UIAPI = {
        'init': init, // Initialisation method
        'toggleFullscreen': toggleFullScreen // Method to toggle fullscreen on an element. 
    };
    
    // Return the public methods/fields to the user
    return UIAPI;
    
}(document.getElementById('rtc-container') || document.body));