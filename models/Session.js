/*
    Session model
    Holds details of a Session. A session is an instance of a Room.
    It holds an access url, and can also set a password.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {   
    
    var Schema = mongoose.Schema,
        autoIncrement = require('mongoose-auto-increment');
    
    autoIncrement.initialize(mongoose.connection);
    
    var SessionSchema = new Schema ({
        //sessionId: Number (Autoincrement), - added by the autoIncrement plugin
        name: String,
        url: String,
        embeddable: Boolean,
        roomId: Number,
        passwordProtected: Boolean
    });
    
    SessionSchema.plugin(autoIncrement.plugin, { model: 'Session', field: 'sessionId' });
    SessionSchema.index({ name: 'sessionId' });
    var Session = mongoose.model(prefix + 'Session', SessionSchema);
    
    return Session;
}