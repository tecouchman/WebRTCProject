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
        renderer = ECT({ root : '/views', ext : '.ect' }),
        streamCount = 0,
        avatars = {},
        srcTag,
        attachedFile;
    
    // Shim for the fullscreen API
    document.exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    // Shim for webkit prefix on window.url
    window.url = window.url || window.webkitURL;
    
    var fullscreenButton = $('#rtc-btn-fullscreen'),
        popoutButton = $('#rtc-btn-popout'),
        setDisplayName = $('#rtc-btn-set-displayname');
    
    // Default options values, which are used for any of the options
    // that are not set explicitly by the user.
    var defaultOptions = {
        'passwordRequired' : false, // Do not require a password to join
        'customisableId' : true, // Allow users to set custom Ids
        'filesharing' : true, // Enabled file sharing
        'maxFileSize' : 2000, // 2mb max file size
        'acceptedFiletypes' : '', // Accept all types
        'fullscreenEnabled' : true,
        'popoutEnabled' : true
    }
    
    var init = function(opts) {
        options = {};
        
        // Merge the users options with default options to create a full list of options
        $.extend(options, defaultOptions, opts)
        
        if (options.passwordRequired === true) {
            $('#rtc-password-container').removeClass('hidden');
        }
        
        if (options.filesharing) {
            $('#rtc-add-file').removeClass('hidden');
            
            if (options.acceptedFiletypes.length > 0) {
                $('#rtc-input-file').attr('accept', options.acceptedFiletypes);
            }
        }
        
        if (options.fullscreenEnabled) {
            fullscreenButton.removeClass('hidden'); 
        } else {
            fullscreenButton.remove();
        }
        
        if (options.popoutEnabled && !(window.top == window.self)) {
            popoutButton.removeClass('hidden'); 
        } else {
            popoutButton.remove();
        }
        
        if (options.customisableId) {
            setDisplayName.removeClass('hidden'); 
        } else {
            setDisplayName.remove();
        }
        
        srcTag = ($('<video>')[0].mozSrcObject != undefined)? 'mozSrcObject' : 'src';
        
        setUpEmojis();
        

        
    }

    var htmlFileDragHandler = function (e) {
        e.stopPropagation();
        e.preventDefault();

        switch (e.type) {
            case 'dragover':
                $('#rtc-file-drag-message').show();
                break;
            case 'drop':
                $('#rtc-file-drag-message').hide();
                attachedFile = (e.originalEvent.target.files || e.originalEvent.dataTransfer.files)[0];
                break;
        }
    };
    
    $('html').on('dragover', htmlFileDragHandler)
             .on('dragleave', htmlFileDragHandler)
             .on('drop', htmlFileDragHandler);
    

    var dropAreaFileDragHandler = function(e) {
        var $this = $(e.target);
        switch (e.type) {
            case 'dragover':
                $this.addClass('hover');
                break;
            case 'dragleave':
                $this.removeClass('hover');
            case 'drop':
                $this.removeClass('hover');
                //
                
                break;
        }
    };
    $('#rtc-input-form').on('dragover', dropAreaFileDragHandler)
                        .on('dragleave', dropAreaFileDragHandler)
                        .on('drop', dropAreaFileDragHandler);
    
    
    // When the core class indicates that the browser is not compatible.
    $(MyWebRTC).on("browserNotSupported", function(evt) {
    
        // clear the rtc container object
        container.html('');
        
        // Use ECT to render the 
        var browserSupportPopup = renderer.render('partials/popup-browser');
        
        container.append(browserSupportPopup);
    });
    
    // When the connectiont to the room is closed
    $(MyWebRTC).on("Disconnected", function(evt) {
        // remove all cotent fromt the video container
        $('#rtc-container').html('');
    });
    
    $(MyWebRTC).on("GetLocalStream", function (evt, stream) {    
        // Get a reference to the video container element
        var videoContainer = $('#rtc-video-container');
        
        var localVideo = '<div class="rtc-local-video">'
        +'   <video ' + srcTag +  '="' + ((srcTag == 'src') ? window.URL.createObjectURL(stream) : stream) + '" autoplay muted></video>'
        +'    <div class="rtc-local-video-controls">'
        +'        <input type="checkbox" class="video-control video-option" id="rtc-stop-local-video"  data-id="local" checked />'
        +'        <label for="rtc-stop-local-video"></label>'
        +'        <input type="checkbox" class="video-control audio-option" id="rtc-stop-local-audio" data-id="local" checked />'
        +'        <label for="rtc-stop-local-audio"></label>'
        +'    </div>'
        +'</div>';
        
        // Append the video element to the passed in element
        videoContainer.append(localVideo);
    });
    
    $(MyWebRTC).on("GetRemoteStream", function (evt, remotePeerId, peerType, stream) {
        
        // Increment the number of streams
        streamCount++;
        
        // Get a reference to the video container element
        var videoContainer = $('#rtc-video-container-center');
        
        // When the local stream is alone, it has extra stylings,
        // so remove these when another user enters.
        $('.rtc-local-video').addClass('rtc-floating-video');
        
        // Special case for older versions of firefox
        var srcData = { 
                id: remotePeerId,
                presenter: peerType == 'presenter'
        };
        // Use ECT to render the video element
        //var remoteVideo = renderer.render('partials/remote-video', srcData);
        

            
        var container = $('<div id="remote' + remotePeerId + '" class="rtc-remote-video ' + peerType + '" >') ;
        var testClass = $('<div>').addClass('test');
        var video = $('<video ' + srcTag +  '="' + ((srcTag == 'src') ? window.URL.createObjectURL(stream) : stream) + '" autoplay></video>');
        var controls = $('<div class="rtc-local-video-controls">'
        +'        <input type="checkbox" class="video-control video-option" id="rtc-stop-remote-video' + remotePeerId + '"  data-id="' + remotePeerId + '" checked />'
        +'        <label for="rtc-stop-remote-video' + remotePeerId + '"></label>'
        +'        <input type="checkbox" class="video-control audio-option" id="rtc-stop-remote-audio' + remotePeerId + '" data-id="' + remotePeerId + '" checked />'
        +'        <label for="rtc-stop-remote-audio' + remotePeerId + '"></label>'
        +'    </div>');
        
        testClass.append(video);
        testClass.append(controls);
        container.append(testClass);
        
        // Append the video element to the passed in element
        videoContainer.append(container);
        
        if (!stream.getVideoTracks()[0].enabled) {
            $('#remote' + remotePeerId).addClass('video-disabled');
        }

        setTimeout(function delayedCreateAvatar(){
            var avatar = createAvatar(video);
            avatars[remotePeerId] = avatar;
        }, 1000);
        
        arrangeStreams();
    });
    
    $(MyWebRTC).on('RemoteVideoTrackToggled', function (evt, remotePeerId, enabled) {
        var remoteVideo = $('#remote' + remotePeerId);
        console.log('enabled:'+enabled);
        if (enabled) {
            remoteVideo.removeClass('video-disabled');
        } else {
            remoteVideo.addClass('video-disabled');
        }
    });
    
    
    // Rearrange streams to make use of the space available
    var arrangeStreams = function() {
        var videoContainer = $('#rtc-video-container');
        
        var videoElem = $('.rtc-remote-video video'), 
            videoBox = $('.rtc-remote-video');
        
        var maxWidth = 0;
        var maxHeight = 0;
        var maxSquare = 0;
        
        for (var counter = 1; counter <= streamCount; counter++) {
            var width = videoContainer.width() / counter;
            var height = videoContainer.height() / Math.ceil((streamCount / counter));
            var size = Math.min(width, height);

            if (size > maxSquare) {
                maxSquare = size;
                maxWidth = width;
                maxHeight = height;
            }
        
        }
        
        videoElem.css('max-width', maxWidth * 0.9 +'px').css('max-height', maxHeight * 0.9 +'px');

    }
    
    $(window).resize(function() {
        scrollToMessagesBottom();
        arrangeStreams();
    })
    
    var createAvatar = function(elem) {
   
        var canvas, context;
        canvas = $('<canvas>')[0];
        canvas.width = 40;
        canvas.height = 40;
        context = canvas.getContext('2d');
        context.drawImage(elem[0], -10, -5, 60, 50);
        
        return canvas.toDataURL('img/png');
    }
    
    $(MyWebRTC).on("PeerConnected", function(evt, remotePeerId, displayName) {
        var newUserElem = $('<p>').append(displayName + " has joined the chat");
        $('#rtc-messages').append(newUserElem);
        scrollToMessagesBottom();
    });
    
    $(MyWebRTC).on("PeerDisconnected", function(evt, remotePeerId, displayName) {
        
        
        var newUserElem = $('<p>').append(displayName + " has left the chat");
        $('#rtc-messages').append(newUserElem);
        
        
        // Decrement the number of streams
        streamCount--;
        
         $('#remote' + remotePeerId).fadeOut(300, function() {
            // Remove the peers video window, if there is one
            $('#remote' + remotePeerId).remove();
        
            scrollToMessagesBottom();

            // If there are no other streams
            if (streamCount == 0) {
                // Remove the floating class so that the local stream becomes
                // larger
                $('.rtc-local-video').removeClass('rtc-floating-video');   
            }

            arrangeStreams();
         });
    });
    
    $(MyWebRTC).on('DataChannelOpen', function(evt) {
        // Enable the send button
        $('#rtc-send').removeAttr('disabled');
        $('#rtc-input-message').removeAttr('disabled');
    });
    
    $(MyWebRTC).on('DataChannelClosed', function(evt) {
        $('#rtc-send').attr('disabled');
    });
    
    // When the user sends a message
    $(MyWebRTC).on("MessageSent", function(evt, message) {
        addMessage('local', message);
    });
    
    // When the user receieves a message
    $(MyWebRTC).on('DownloadComplete', function(evt, fileDataURL, id) {
        var downloadElem = $('#' + id.replace('.',''));
        downloadElem.html('');

        var img = $('<img>');
        img.attr('src', fileDataURL);
        downloadElem.append(img);
    });
    
        // When a download starts
    $(MyWebRTC).on('FileOfferRecieved', function(evt, sender, name, filesize) {
        var downloadElem = $('<div>').addClass('rtc-message').addClass('remote').addClass('download');
        downloadElem.attr('id', name.replace('.',''));
        downloadElem.append($('<p>').append(sender + ' would like to send a file:'));
        downloadElem.append($('<p>').addClass('rtc-download-name').append(name));
        
        var accept = $('<button>').text('Accept').addClass('rtc-soft-button');
        accept.click(function(event){
            MyWebRTC.acceptFile(name);
            downloadElem.fadeOut(200, 
                function() { downloadElem.remove();
            });
        }) 
        var decline = $('<button>').text('Decline').addClass('rtc-soft-button');
        decline.click(function(event){
            downloadElem.fadeOut(200, 
                function() { downloadElem.remove();
            });
        })        
        
        downloadElem.append(accept).append(decline);
        $('#rtc-messages').append(downloadElem);
    });
    
    // When a download starts
    $(MyWebRTC).on('DownloadStarted', function(evt, id) {
        var downloadElem = $('<div>').addClass('rtc-message').addClass('remote').addClass('download');
        downloadElem.attr('id', id.replace('.',''));
        downloadElem.append($('<p>').addClass('rtc-download-name').append(id));
        downloadElem.append($('<progress>').addClass('rtc-download-progress').attr('max', 100));
        $('#rtc-messages').append(downloadElem);
    });

    // When data is recieved for a download
    $(MyWebRTC).on('DownloadProgress', function(evt, id, percent) {
        var downloadElem = $('#' + id.replace('.','') + ' > progress');
        downloadElem.attr('value',percent);
    });
    
    // When the user receieves a message
    $(MyWebRTC).on('MessageReceived', function(evt, sender, message) {
        addMessage(sender, message);
    });
    
    var addMessage = function(sender, message) {
        
        var isLocal = sender == 'local';
        
        var message = emojione.toImage(message);
        
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

        var avatar = $('<div>').css('background-image', 'url("' + avatars[sender] + '")').addClass('avatar');
        
        $('#rtc-messages').append(timeStampElem).append(avatar).append(messageElem);
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
    
    $('#rtc-add-file').click(function() {
        $('#rtc-input-file').trigger('click');
    });
    
    $('#rtc-input-file').on('change', function() {
        
        if ($('#rtc-input-file')[0].files[0].size / 1024 > options.maxFileSize) {
            alert('File too large');   
            $('#rtc-input-file').parent('form')[0].reset();
        } else {
            attachedFile = $('#rtc-input-file')[0].files[0];   
        }
    })
    
    $('#rtc-send').click(function(e) {
        
        // Prevent default submit behaviour to avoid page reload.
        e.preventDefault();
        
        // If the user has entered a message then 
        // send it to the other peers
        if ($('#rtc-input-message').val() != '') {
            
            console.log('sending: ' + $('#rtc-input-message').val());
            
            // Send the message is the text box
            MyWebRTC.sendMessage( $('#rtc-input-message').val() );
        }
        
        // If the user has selected a file
        // send it to the other peers
        if (attachedFile != null) {
            // Send the message is the text box
            MyWebRTC.sendFile( attachedFile );
            attachedFile = null;
        }
        
        $('#rtc-input-form')[0].reset();
        
    });
    
    $('#rtc-password-submit').click(function(e) {
        // Prevent default submit behaviour to avoid page reload
        e.preventDefault();
        
        // Send the password to the server via the com submodule
        MyWebRTC.Com.submitPassword($('#rtc-password-input').val());
    });
    
    $('#rtc-video-container').on('change', '.video-option', function(e){
        var id = $(e.target).data('id');
  
        if (id == 'local') {
            $(e.target).prop('checked') ? MyWebRTC.localMedia.startVideo() : MyWebRTC.localMedia.stopVideo();
        } else {
            $(e.target).prop('checked') ? MyWebRTC.getPeers()[id].startVideo() : MyWebRTC.getPeers()[id].stopVideo();
        }
        //$(e.target).remove();
    });
    
    $('#rtc-video-container').on('change', '.audio-option', function(e){
        var id = $(this).data('id');
        if (id == 'local') {
            $(this).prop('checked') ? MyWebRTC.localMedia.startAudio() : MyWebRTC.localMedia.stopAudio();
        } else {
            $(this).prop('checked') ? MyWebRTC.getPeers()[id].startAudio() : MyWebRTC.getPeers()[id] .stopAudio();
        }
    });
    
    container.on('click', '#rtc-displayname-submit', function(e) {
        MyWebRTC.setDisplayName($('#rtc-displayname-input').val());
        $('#rtc-set-displayname-container').remove();
    });
    
    container.on('click', '#rtc-displayname-cancel', function(e) {
        $('#rtc-set-displayname-container').remove();
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
        container.append(popup);
    });
    
    var toggleFullscreen = function () {
        
        // Vendor prefix shim to get current fullscreen element
        document.fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        var containerElem = container[0];
        // If no element is currently fullscreen, enable fullscreen.
        if (document.fullscreenElement == undefined) {
            if (containerElem.requestFullscreen) {
                containerElem.requestFullscreen();
            } else if (containerElem.webkitRequestFullscreen) {
                containerElem.webkitRequestFullscreen(container.ALLOW_KEYBOARD_INPUT);
            } else if (containerElem.mozRequestFullScreen) {
                containerElem.mozRequestFullScreen();
            } else if (containerElem.msRequestFullscreen) {
                containerElem.msRequestFullscreen();
            }
        } else {
            // Else if an element is fullscreen disable it
            document.exitFullscreen();
            document.fullscreenElement = undefined;
        }
    };
    
    if (fullscreenButton) {
        fullscreenButton.click(function (e) {
            toggleFullscreen();
            if (fullscreenButton.text() == 'Enter Fullscreen') {
                fullscreenButton.text('Exit Fullscreen');
            } else {
                fullscreenButton.text('Enter Fullscreen');
            }
        });
    }
    
    if (popoutButton) {
        popoutButton.click(function(e) {
            
            // Close the connection
            MyWebRTC.close();
            window.open(window.location, "_blank", "resizable=yes, width=800, height=400");
            
        }); 
    }
    
    if (setDisplayName) {
        setDisplayName.click(function(e) {

            var popup = renderer.render('partials/popup-displayname');
            container.append(popup);
        }); 
    }
    
    // Srolls the message box down to the latest comment.
    var scrollToMessagesBottom = function() {
        // Uses jquery scrollTop method to scroll the element
        // and gets the value to scroll to from the scrollHeight
        // value of the element - this is the 'real' height - including
        // overflow
        $('#rtc-messages').scrollTop($('#rtc-messages')[0].scrollHeight);
    };
    
    var setUpEmojis = function() {
        var emoticonMenu = $("#rtc-emoticon-menu");
        
        emoticonMenu.on('click', 'img', function(e) {
            $('#rtc-input-message').val($('#rtc-input-message').val() + $(this).attr('alt'));
        });
        
   
        var emoHtml = emojione.toImage(emoticonMenu.text());   
        emoticonMenu.html(emoHtml); 
    }
    
    UIAPI = {
        'init': init, // Initialisation method
        'toggleFullscreen': toggleFullscreen // Method to toggle fullscreen on an element. 
    };
    
    // Return the public methods/fields to the user
    return UIAPI;
    
}($('#rtc-container') || document.body));