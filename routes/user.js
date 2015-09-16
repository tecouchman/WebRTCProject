module.exports = function(app, user) {
    
    // Routing requiest for a chat room
    app.get('/room/:sessionId', user.renderRoom);
    
}