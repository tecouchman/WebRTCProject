var express = require('express');
var app = express();
var http =  require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');

// The port the app will listen to
var port = 3000,
    // Map of clients
    clients = {};

// Set up access to static files
app.use('/styles', express.static('Styles'));
app.use('/js', express.static('JS'));
app.use('/socket.io', express.static('socket.io'));


// Set up routing for get requests made to the base URL.
// Sends index.html to the client.
app.get('/room/[a-zA-Z]{6,9}', function(req, res) {
    res.sendFile(__dirname + '/index.html'); 
});

// Set up a listener for when a client connects (a user visits the page)
io.on('connection', function(socket) {
    
    // Store the socket in a the clients map.
    clients[socket.id] = socket;
    
    // TODO: socket.request.headers.referer is undocumented, maybe unreliable
    // Get the URL of the page to determined the users room
    var URL = url.parse(socket.request.headers.referer);
    // The room ID is the final part of the path, so remove
    // the start.
    var room = URL.path.replace('/room/','')
        
    console.log('Adding user to room: ' + room);
    
    // Add the socket to the room
    // (A socket.io room is a conceptual group of sockets
    // to which messages can be broadcasted)
    socket.join(room);
    
    // Return an ID to the the new client
    socket.emit('IdGenerated', socket.id);

    socket.on('Offer', function(data){
        console.log('Offer recieved for :' + data.peerId);
        clients[data.peerId].emit('Offer', { peerId: socket.id, offer: data.offer});
    });
    
    socket.on('Answer', function(data){
        console.log('Answer recieved for :' + data.peerId);
        clients[data.peerId].emit('Answer', { peerId: socket.id, answer: data.answer});
    })
    
    socket.on('IceCandidate', function(data){
        clients[data.peerId].emit('IceCandidate', { peerId: socket.id, iceCandidate: data.iceCandidate});
    })
    
    
    // When the socket disconnects
    socket.on('disconnect', function() {
        console.log('Client ' + socket.id + ' has disconnected');
        
        // Tell others that the client has disconnected
        socket.broadcast.to(room).emit('PeerRemoved', socket.id);
        
        // Remote the socket from the client list
        delete clients[socket.id];
    });
    
    // Tell other users that the client has been added to the room
    socket.broadcast.to(room).emit('PeerAdded', socket.id);
    
});




http.listen(port, function(){
  console.log('Listening on port ' + port);
});