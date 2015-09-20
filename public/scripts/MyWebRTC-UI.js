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
        attachedFile
    
    // Shim for the fullscreen API
    document.exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    // Shim for webkit prefix on window.url
    window.url = window.url || window.webkitURL;
    
    var fullscreenButton = $('#rtc-btn-fullscreen'),
        popoutButton = $('#rtc-btn-popout'),
        setDisplayName = $('#rtc-btn-set-displayname'),
        popupContainer = $('#rtc-popup-area');
    
    // Default options values, which are used for any of the options
    // that are not set explicitly by the user.
    var options = {
        passwordRequired : false, // Do not require a password to join
        customisableId : true, // Allow users to set custom Ids
        filesharing : true, // Enabled file sharing
        maxFileSize : 2000, // 2mb max file size
        acceptedFiletypes : '', // Accept all types
        fullscreenEnabled : true,
        popoutEnabled : true,
        showAvatar: true,
        showDisplayName : true,
        localVideoPIP : true,
        hasVideo : true,
        hasAudio : true,
        hasMessaging : true
    }
    
    var init = function(opts) {
        
        // Merge the users options with default options to create a full list of options
        $.extend(options, options, opts)
        
        if (options.passwordRequired === true) {
            $('#rtc-password-container').removeClass('hidden');
        }
        
        if (options.filesharing) {
            $('#rtc-add-file').removeClass('hidden');
            
            if (options.acceptedFiletypes.length > 0) {
                $('#rtc-input-file').attr('accept', options.acceptedFiletypes);
            }
        }
        
        if (options.hasMessaging && !(options.hasAudio || options.hasVideo)) {
            $('#rtc-messages-container').css('width', '100%');   
        } else if (!options.hasMessaging && (options.hasAudio || options.hasVideo)) {
            $('#rtc-video-container').css('width', '100%'); 
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
        
        if (options.hasMessaging) {
            setUpEmojis();
        } 
        
    }
    
    var attachFile = function(file) {
        attachedFile = file;
        var trimmedText = file.name.length > 25 ? file.name.substr(0,22) + '...' : file.name;
        
        var fileAttachmentElem = $('#rtc-attachment');
        fileAttachmentElem.children('span').text(trimmedText);
        fileAttachmentElem.removeClass('hidden');
    }
    
    $('#rtc-remove-attachment').click(function(){
        removeAttachment();
    });
    
    var removeAttachment = function() {
        attachedFile = null;
        var fileAttachmentElem = $('#rtc-attachment');
        fileAttachmentElem.addClass('hidden');
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
                attachFile((e.originalEvent.target.files || e.originalEvent.dataTransfer.files)[0]);
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
        var videoContainer = $('#rtc-video-container-center');
        
        streamCount++;
    
        var peerType = 'client';
        
        var container = $('<div class="rtc-video local ' + peerType + '" >') ;
        var rel = $('<div>').addClass('rtc-rel');
        var video = $('<video ' + srcTag +  '="' + ((srcTag == 'src') ? window.URL.createObjectURL(stream) : stream) + '" autoplay muted></video>');
        var controls = $('<div class="rtc-video-controls"></div>');
        
        if (options.hasVideo) {
            controls.append($('<input type="checkbox" class="video-control video-option" id="rtc-stop-local-video"'
                              + ' data-id="local" checked />'
                              + '<label for="rtc-stop-local-video"></label>'));
        }
            
        if (options.hasAudio) {
            controls.append($('<input type="checkbox" class="video-control audio-option" id="rtc-stop-local-audio"'
                              + ' data-id="local" checked />'
                              + '<label for="rtc-stop-local-audio"></label>'));
        }
        
        if (!options.hasVideo && options.hasAudio) {
            container.addClass('audio-only');
        }
        
        rel.append(video);
        rel.append(controls);
        container.append(rel);
        
        // Append the video element to the passed in element
        videoContainer.append(container);
        // Arrange the streams to best fill the window.
        arrangeStreams();

    });
    
    $(MyWebRTC).on("GetRemoteStream", function (evt, remotePeerId, peerType, stream) {
        

        
        peerType = 'client'
        
        // Get a reference to the video container element
        var videoContainer = $('#rtc-video-container-center');
        
        if (options.localVideoPIP && !$('.rtc-video.local').hasClass('rtc-floating-video')) {
            // When the local stream is alone, it has extra stylings,
            // so remove these when another user enters and move the video outside the div
             $('#rtc-video-container').append($('.rtc-video.local').addClass('rtc-floating-video'));
            // Set the local stream as the src of the moved local video element
            // as there is a browser/jquery issue where the stream stops when it moves
            var localStream = MyWebRTC.getLocalMedia().getStream();
             $('.rtc-video.local video').attr(srcTag, ((srcTag == 'src') ? window.URL.createObjectURL(localStream) : localStream));
            streamCount--;
        }
            
        var container = $('<div id="remote' + remotePeerId + '" class="rtc-video remote ' + peerType + '" >') ;
        var rel = $('<div>').addClass('rtc-rel');
        var video = $('<video ' + srcTag +  '="' + ((srcTag == 'src') ? window.URL.createObjectURL(stream) : stream) + '" autoplay></video>');
        var controls = $('<div class="rtc-video-controls"></div>');
        
        if (options.hasVideo) {
            controls.append($('<input type="checkbox" class="video-control video-option" id="rtc-stop-remote-video'
                                + remotePeerId + '"  data-id="' + remotePeerId + '" checked />'
                                + '<label for="rtc-stop-remote-video' + remotePeerId + '"></label>'));
        }
            
        if (options.hasAudio) {
            controls.append($('<input type="checkbox" class="video-control audio-option" id="rtc-stop-remote-audio'
                              + remotePeerId + '" data-id="' + remotePeerId + '" checked />'
                              +'<label for="rtc-stop-remote-audio' + remotePeerId + '"></label>'));
        }
        
        
        rel.append(video);
        rel.append(controls);
        container.append(rel);
        
        // Append the video element to the passed in element
        videoContainer.append(container);
        
        
        if (options.hasVideo && !stream.getVideoTracks()[0].enabled) {
            $('#remote' + remotePeerId).addClass('video-disabled');
        }
        
        if (!options.hasVideo && options.hasAudio) {
            container.addClass('audio-only');
        }

        if (options.showAvatar) {
            setTimeout(function delayedCreateAvatar(){
                var avatar = createAvatar(video);
                avatars[remotePeerId] = avatar;
            }, 1000);
        }
        
        // Increment the number of streams
        streamCount++;
        arrangeStreams();
    });
    
    $(MyWebRTC).on('RemoteVideoTrackToggled', function (evt, remotePeerId, enabled) {
        var remoteVideo = $('#remote' + remotePeerId);

        if (enabled) {
            remoteVideo.removeClass('video-disabled');
        } else {
            remoteVideo.addClass('video-disabled');
        }
    });
    
    
    // Rearrange streams to make use of the space available
    var arrangeStreams = function() {
        var videoContainer = $('#rtc-video-container');
        
        var videoClass = '.rtc-video';
        
        
        var videoElem = $(videoClass + ' video'), 
            videoBox = $(videoClass);
        
        
            
        
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
        if (options.hasMessaging) {
            var newUserElem = $('<p>').append(displayName + " has joined the chat");
            $('#rtc-messages').append(newUserElem);
            scrollToMessagesBottom();
        }
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
            if (options.localVideoPIP && streamCount == 0) {
                // Remove the floating class so that the local stream becomes
                // larger
                $('.rtc-video.local').removeClass('rtc-floating-video');   
                
                // When the local stream is alone move it back into the central video div
                $('#rtc-video-container-center').append($('.rtc-video.local'));
                // Set the local stream as the src of the moved local video element
                // as there is a browser/jquery issue where the stream stops when it moves
                var localStream = MyWebRTC.getLocalMedia().getStream();
                $('.rtc-video.local video').attr(srcTag, ((srcTag == 'src') ? window.URL.createObjectURL(localStream) : localStream));
                streamCount++;
                
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
        displayMessage('local', MyWebRTC.getDisplayName, message);
    });


    // When the user receieves a message
    $(MyWebRTC).on('FileSendComplete', function(evt, recipient, fileId, file) {
        var reader = new FileReader();
        MyWebRTC.File.readFileAsDataURL(file, function(event){
            displayDownloadComplete('local', fileId, event.target.result);
        })
        
    });
                   
    // When the user receieves a message
    $(MyWebRTC).on('DownloadComplete', function(evt, sender, fileId, file) {
        displayDownloadComplete(sender, fileId, file);
    });
    
    var displayDownloadComplete = function(sender, fileId, file) {
        var downloadElem = $('#' + fileId.replace('.',''));
        downloadElem.html('');
        
        if (file.substr(5,5) == 'image') {
            var img = $('<img>');
            img.attr('src', file);
            downloadElem.append(img);
        } else if (file.substr(5,5) == 'video') {
            var video = $('<video>');
            video.attr('src', file)
                .prop("controls",true)
                .css('width', '100%');
            downloadElem.append(video);
        }
        
        if (sender == 'local') {
            var anchor = $('<span>').text('File ' + fileId + ' sent.');
            downloadElem.append(anchor);
        } else {
            var anchor = $('<a>').text('Download').attr('download', fileId).attr('href',file);
            downloadElem.append(anchor);
        }
        
        scrollToMessagesBottom();
    }

    
    // When a download starts
    $(MyWebRTC).on('FileOfferRecieved', function(evt, senderId, senderName, fileName, filesize) {
        
        var container = $('#rtc-messages');
        
        var downloadElem = $('<div>').addClass('rtc-message').addClass('remote').addClass('download');
        downloadElem.attr('id', fileName.replace('.',''));
        downloadElem.append($('<p>').append(senderName + ' would like to send a file:'));
        downloadElem.append($('<p>').addClass('rtc-download-name').append(fileName));
        
        var accept = $('<button>').text('Accept').addClass('rtc-soft-button');
        accept.click(function(event){
            MyWebRTC.acceptFile(senderId, fileName);
        }) 
        var decline = $('<button>').text('Decline').addClass('rtc-soft-button');
        decline.click(function(event){
            downloadElem.fadeOut(200, 
                function() { downloadElem.remove();
            });
        })        
        
        downloadElem.append(accept).append(decline);
        
        
        // Generate a time stamp element
        var timeStampElem = getTimeStamp();
        timeStampElem.addClass('remote');

    
        // append the time stamp to the messages element
        container.append(timeStampElem);

        if (options.showDisplayName) {
            var displayNameElem = $('<div>').addClass('rtc-display-name')
                                        .append(displayName);
            container.append(displayNameElem);
        }
                
        if (options.showAvatar) {
            // Create an avatar div
            var avatar = $('<div>').css('background-image', 'url("' + avatars[senderId] + '")').addClass('rtc-avatar');
            container.append(avatar);
        }
        
        
        container.append(downloadElem);
        
        scrollToMessagesBottom();
    });
    
    // When a download starts
    $(MyWebRTC).on('DownloadStarted', function(evt, senderId, fileId) {
        displayDownloadStarted(senderId, 'local', fileId);
    });
    
    // When an upload starts
    $(MyWebRTC).on('FileSendStarted', function(evt, receiverId, fileId) {
        console.log('sending file');
        displayDownloadStarted('local', receiverId, fileId);
    });
    
    var displayDownloadStarted = function(senderId, receiverId, fileId) {
        console.log('sending file');
        
        var elemId = fileId.replace('.','');
        var downloadElem = $('#' + elemId);
        
        if (!downloadElem[0]) {
            downloadElem = $('<div>').addClass('rtc-message')
                                    .addClass(senderId == 'local' ? 'local' : 'remote')
                                    .addClass('download')
                                    .attr('id', elemId);
            $('#rtc-messages').append(downloadElem);
        }
        downloadElem.html('');
        var description = $('<p>').addClass('rtc-download-name');
        if (senderId == 'local') {
            description.append('Uploading ' + fileId + ' to ' + receiverId);//MyWebRTC.getPeers[receiverId].displayName);   
        } else {
            description.append('Downloading ' + fileId + ' from ' + senderId);//MyWebRTC.getPeers[senderId].displayName);
        }
        
        downloadElem.append(description);
        downloadElem.append($('<progress>').addClass('rtc-download-progress').attr('max', 100));
        
    }
    
    
    $(MyWebRTC).on('FileSendProgress', function(evt, senderId, fileId, progress) {
        console.log('FileSendProgress: ' +progress);
        updateDownload(fileId, progress);
    });
    
    var updateDownload = function(fileId, progress) {
        var downloadElem = $('#' + fileId.replace('.','') + ' > progress');
        downloadElem.attr('value',progress);
    };
    
    // When data is recieved for a download
    $(MyWebRTC).on('DownloadProgress', function(evt, senderId, fileId, progress) {
        updateDownload(fileId, progress);
    });
    
    // When the user receieves a message
    $(MyWebRTC).on('MessageReceived', function(evt, sender, displayName, message) {
        console.log('displaying message');
        displayMessage(sender, displayName, message);
    });
    
    var displayMessage = function(sender, displayName, message) {
        
        // Determine if the message is from the local or remote peer
        var isLocal = sender == 'local';
        // Parse the message using emjione to replace emojis
        // with images
        var message = emojione.toImage(message);
        
        // Append the message to a div element, with the rtc-message class
        var messageElem = $('<div>').addClass('rtc-message').append($('<p>').append(message));
        
        // Generate a time stamp element
        var timeStampElem = getTimeStamp();
        
        // Based on the isLocal boolean, set a class
        // to determine whether a message/timestamp element is remote or local
        // - this allows different style for each, e.g. remote right aligned,
        // local left aligned
        var isLocalClass = isLocal? 'local' : 'remote';
        messageElem.addClass(isLocalClass);
        timeStampElem.addClass(isLocalClass);

        
        var container = $('#rtc-messages');
        // append the time stamp to the messages element
        container.append(timeStampElem);

        if (options.showDisplayName && !isLocal) {
            var displayNameElem = $('<div>').addClass('rtc-display-name')
                                        .append(displayName);
            container.append(displayNameElem);
        }
                
        if (options.showAvatar && !isLocal) {
            // Create an avatar div
            var avatar = $('<div>').css('background-image', 'url("' + avatars[sender] + '")').addClass('rtc-avatar');
            container.append(avatar);
        }
        
        container.append(avatar).append(messageElem);
        // Ensure the most recent message is visible
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
            var data = { id : 'fileTooLarge' , 
                title : 'File Too Large',
                message : 'Cannot share files larger that ' + options.maxFileSize + 'KB',
                buttons : 'ok'
            };
            var popup = renderer.render('partials/popup', data);
            popupContainer.append(popup);
            $('#rtc-input-file').parent('form')[0].reset();
        } else {
            attachFile($('#rtc-input-file')[0].files[0]);   
        }
    })
    
    $('#rtc-send').click(function(e) {
        
        // Prevent default submit behaviour to avoid page reload.
        e.preventDefault();
        
        // If the user has entered a message then 
        // send it to the other peers
        if ($('#rtc-input-message').val() != '') {

            // Send the message is the text box
            MyWebRTC.sendMessage( $('#rtc-input-message').val() );
        }
        
        // If the user has selected a file
        // send it to the other peers
        if (attachedFile != null) {
            // Send the message is the text box
            MyWebRTC.sendFile( attachedFile );
            removeAttachment();
        }
        
        $('#rtc-input-form')[0].reset();
        
    });
    
    $('#rtc-password-submit').click(function(e) {
        // Prevent default submit behaviour to avoid page reload
        e.preventDefault();
        
        // Send the password to the server via the com submodule
        MyWebRTC.Com.submitPassword($('#rtc-password-input').val());
        
        return false;
    });
    
    $('#rtc-video-container').on('change', '.video-option', function(e){
        var id = $(e.target).data('id');

        if (id == 'local') {
            $(e.target).prop('checked') ? MyWebRTC.getLocalMedia().startVideo() : MyWebRTC.getLocalMedia().stopVideo();
        } else {
            $(e.target).prop('checked') ? MyWebRTC.getPeers()[id].startVideo() : MyWebRTC.getPeers()[id].stopVideo();
        }
        //$(e.target).remove();
    });
    
    $('#rtc-video-container').on('change', '.audio-option', function(e){
        var id = $(this).data('id');
        if (id == 'local') {
            $(this).prop('checked') ? MyWebRTC.getLocalMedia().startAudio() : MyWebRTC.getLocalMedia().stopAudio();
        } else {
            $(this).prop('checked') ? MyWebRTC.getPeers()[id].startAudio() : MyWebRTC.getPeers()[id] .stopAudio();
        }
    });
    
    container.on('click', '#rtc-displayname-submit', function(e) {
        MyWebRTC.setDisplayName($('#rtc-displayname-input').val());
        $('#rtc-set-displayname-container').remove();
        // Return false to stop submit behaviour
        return false;
    });
    
    container.on('click', '#rtc-displayname-cancel', function(e) {
        e.preventDefault();
        $('#rtc-set-displayname-container').remove();
        // Return false to stop submit behaviour
        return false;
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
        popupContainer.append(popup);
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

            if ($('#rtc-set-displayname-container')[0]) {
                return;
            }
            
            var popup = renderer.render('partials/popup-displayname', {
                displayName : MyWebRTC.getDisplayName()   
            });
            popupContainer.append(popup);
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
        
   
        var emoHtml = emojione.toImage(emoticonMenu.html());   
        emoticonMenu.html(emoHtml); 
    }
    
    UIAPI = {
        'init': init, // Initialisation method
        'toggleFullscreen': toggleFullscreen // Method to toggle fullscreen on an element. 
    };
    
    // Return the public methods/fields to the user
    return UIAPI;
    
}($('#rtc-container') || document.body));