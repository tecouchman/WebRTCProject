/*
 * Tom Couchman 2015
 */
(function (global, container) {
    'use strict';
    var MyWebRTC = {
        'version': '0.1.0',
        init : function () {
            // Create global variables for the various WebRTC Methods/Classes, and assign the unprefixed/vendor prefixed method/class available in the current browser.
            // This means that vendor prefixes will not need to be use from this point on as the global variables can be used.
            // TODO: Global or local?
            global.PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection;
            global.IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitIceCandidate;
            global.SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

            // Shim for the fullscreen API
            document.exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;

            console.log('Getting local media stream');

            // Options for the user media stream
            var options = {
                video: true,
                audio: true
            };

            // Get the user media stream
            navigator.getUserMedia(options,
                // On stream recieved.
                function (stream) {
                    console.log('Got local media stream');
                    // Create a video element to display the stream
                    var localVideo = document.createElement('video');
                    // Generate a URL object from the stream and set
                    // is as the source of the video element
                    localVideo.src = window.URL.createObjectURL(stream);
                    // Add sutoplay attribute to the video element so the video
                    // is not paused.
                    localVideo.setAttribute('autoplay', '');
                    localVideo.muted = "muted";
                    // Append the video element to the passed in element
                    container.appendChild(localVideo);
                },
                // On error
                function (err) {
                    // TODO: output error to user.
                    console.error(err);
                }
                );

            var fullscreenButton = document.getElementById('fullscreen-button');
            if (fullscreenButton) {
                fullscreenButton.onclick = function () {
                    MyWebRTC.toggleFullscreen(container);
                };
            }


        },
        toggleFullscreen: function (elem) {
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
        }
    };

    // Init the MyWebRTC Object
    MyWebRTC.init();

    if (global.MyWebRTC) {
        throw new Error('MyWebRTC Already Defined');
    } else {
        global.MyWebRTC = MyWebRTC;
    }

})(window, document.getElementById('MyWebRTC-container') || document.body);
