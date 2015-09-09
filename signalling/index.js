
module.exports.getUserCount = function() {
    return Object.keys(clients).length;
}

// Map of clients
var clients = {},
// maps of room counts
rooms = {};

module.exports.set = function(http, db) {
    
    var io = require('socket.io')(http);
    var url = require('url');
    
    // Set up a listener for when a client connects (a user visits the page)
    io.on('connection', function(socket) {

        console.log('client connection');

        // TODO: socket.request.headers.referer is undocumented, maybe unreliable
        // Get the URL of the page to determined the users room
        var URL = url.parse(socket.request.headers.referer);
        // The room ID is the final part of the path, so remove
        // the start.
        var roomId = getUrlQuery(URL.path);

        if (!rooms[roomId])
            rooms[roomId] = 0
            
        var session, room;

        // Return an ID to the the new client
        socket.emit('IdGenerated', socket.id);
        
        // When the user requests the options:
        socket.on('GetOptions', function (data){

            var iceServers, fileOptions;

            db.IceServer.find({}, function(err, servers) {
                iceServers = servers;
                onData();
            });

            db.Session.findOne({ url : roomId }, function(err, sessionResult) {
                session = sessionResult;
                // Find the room in the database:
                db.Room.findOne({ roomId : session.roomId }, function(err, roomResult) {
                    room = roomResult;
                    onData();
                });
                
                db.FileOptions.findOne({ roomId : session.roomId }, function(err, fileOptsResult) {
                    fileOptions = fileOptsResult || true;
                    onData();
                });
            });

            // When the room/session/iceServer data becomes available:
            function onData() {

                if (session && room && iceServers && fileOptions) {
                    console.log('all data!');
                    console.log(room.name);

                    var iceServerUrls = [];
                    iceServers.forEach(function(elem, num) {

                           iceServerUrls.push(elem.serverUrl);
                    });

                    // Example options for testing:
                    /*  To be detemined for WebRTC connections
                        - Is the user sharing video
                        - Is the user sharing audio
                        - Are remote users sharing video
                        - Is text chat enabled
                        - What ICE servers are to be used   */
                    var RTCOptions = {  
                        'shareLocalVideo' : room.hasVideo,
                        'shareLocalAudio' : room.hasAudio,
                        'remoteVideo' : true,
                        'textChat' : room.hasMessaging,
                        'allowScreensharing' : room.allowScreensharing,
                        'iceServers' : iceServerUrls,
                        'fileSharing' : room.hasFilesharing,
                        'embeddable' :  session.embeddable
                    }
                    
                    if (room.hasFilesharing) {
                        if (fileOptions.acceptedFileTypes) {
                            RTCOptions['acceptedFiletypes'] = fileOptions.acceptedFileTypes.join();
                        }
                        
                        if (fileOptions.maxFileSize) {
                            RTCOptions['maxFileSize'] = fileOptions.maxFileSize;
                        }
                    }

                    /* To be determined for Signalling?
                        - Password required?   */
                    var RTCComOptions = {
                        'logMessages' : room.logMessages
                    }

                    /* To be determined for UI:
                        - Is the sessions password based?
                        - Do users need to be able to set their own identifiers?   */
                    var RTCUIOptions = {
                        'passwordRequired' : session.passwordProtected,
                        'customisableId' : room.hasCustomUserIds,
                        'fileSharing' : room.hasFilesharing,
                        'fullscreenEnabled': room.fullscreenEnabled,
                        'popoutEnabled': room.popoutEnabled
                    }
                    
                    if (room.hasFilesharing) {
                        if (fileOptions.acceptedFileTypes) {
                            RTCUIOptions['acceptedFiletypes'] = fileOptions.acceptedFileTypes.join();
                        }
                        
                        if (fileOptions.maxFileSize) {
                            RTCUIOptions['maxFileSize'] = fileOptions.maxFileSize;
                        }
                    }

                    // If room is full:
                    if (room.maxUsers > 0 && room.maxUsers <= rooms[roomId]) {
                        socket.emit('RoomFull');
                    } else {
                        // Send the room options to the user
                        socket.emit('GotOptions', RTCOptions, RTCComOptions, RTCUIOptions);
                    }
                }
            }
        });


        socket.on('Join', function(data){
            console.log('User is joining');

            // Store the socket in a the clients map.
            clients[socket.id] = { socket : socket, room: roomId };

            rooms[roomId]++;

            // If the room doesn't have a password then
            // add the user to the room
            if (!session.passwordProtected) {
                joinRoom(roomId);
            }
        });


        socket.on('Offer', function(data){
            console.log('Offer recieved for :' + data.peerId);
            clients[data.peerId].socket.emit('Offer', { peerId: socket.id, displayName : data.displayName, peerType: data.peerType, offer: data.offer});
        });

        socket.on('Answer', function(data){
            console.log('Answer recieved for :' + data.peerId);
            clients[data.peerId].socket.emit('Answer', { peerId: socket.id, displayName : data.displayName, peerType: data.peerType, answer: data.answer});
        });

        socket.on('IceCandidate', function(data){
            clients[data.peerId].socket.emit('IceCandidate', { peerId: socket.id, iceCandidate: data.iceCandidate});
        });

        socket.on('SubmitPassword', function(data){

            db.SessionCredentials.findOne({ sessionId : session.sessionId }, 
                                          function(err, sessionCredential){
                
                // If the password is correct
                if (data.password == sessionCredential.password) {
                    // Add the user to the room
                    joinRoom(roomId);
                    // And return a message to inform them the password was correct.
                    socket.emit('PasswordCorrect');
                } else {
                    // Else, inform the client the password was incorrect.
                    socket.emit('PasswordIncorrect');
                }
            })
        })


        // When the socket disconnects
        socket.on('disconnect', function() {
            console.log('Client ' + socket.id + ' has disconnected');

            // Tell others that the client has disconnected
            socket.broadcast.to(roomId).emit('PeerRemoved', socket.id);

            // If the client is in the clients map:
            if (clients[socket.id]) {

                // Decrement the room count
                // If the room is empty, remove it from the rooms map
                if (rooms[roomId] == 1) {
                    delete rooms[roomId]; 
                } else {
                    rooms[roomId]--;
                }

                // Remove the socket from the client list
                delete clients[socket.id];
            }
        });
        
        // When a message is sent
        socket.on('MessageSent', function(data) {

            // Create a new Message in the db for the sent message
            message = new db.Message({
                sessionId: session.sessionId,
                userId: socket.id,
                userName: data.username,
                message: data.message,
                sentAt: Date()
            });
            message.save(function(err) {
                console.log('saved message.' + err.message);
            }); 
        });

        
        socket.on('DisplayNameChanged', function(data) {
            socket.broadcast.to(roomId).emit('DisplayNameChanged', { remotePeerId : socket.id, displayName : data.displayName }); 
        });

        socket.on('VideoTrackToggled', function(data) {
            socket.broadcast.to(roomId).emit('VideoTrackToggled', { remotePeerId : socket.id, enabled : data.enabled }); 
        });
    
        
        
        function joinRoom(roomId){
            // Add the socket to the room
            // (A socket.io room is a conceptual group of sockets
            // to which messages can be broadcasted)
            socket.join(roomId);
            // Tell other users that the client has been added to the room
            socket.broadcast.to(roomId).emit('PeerAdded', socket.id);   
        }

    });
    
    // Returns the content after the final forward slash in a URL
    function getUrlQuery(url) {
        return url.substr(url.lastIndexOf('/') + 1);;
    }
}