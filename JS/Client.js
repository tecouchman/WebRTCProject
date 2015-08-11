$(document).ready(function() {
    
    var RTCOption = {
        'shareLocalVideo' : true,
        'shareLocalAudio' : true,
        'remoteVideo' : true,
        'iceServers' : ["stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302"]
    }

    
    MyWebRTC.init(RTCOption);
});

