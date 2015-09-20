/*
    Room model
    Holds details of a Room. A room act like a tempalte of a WebRTC chat, 
    and contains details about the forms of communication a room will allow.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {

    var autoIncrement = require('mongoose-auto-increment'),
        Schema = mongoose.Schema;
    
    autoIncrement.initialize(mongoose.connection);
    
    var RoomSchema = new Schema ({
        // roomId: Number (Autoincrement), - added by the autoIncrement plugin
        name: String,
        maxUsers: Number,
        hasVideo: Boolean,
        hasAudio: Boolean,
        hasMessaging: Boolean,
        hasFilesharing: Boolean,
        hasCustomUserIds: Boolean,
        theme: String,
        recordAudio: Boolean,
        recordVideo: Boolean,
        logMessages: Boolean,
        allowScreensharing: Boolean,
        fullscreenEnabled: Boolean,
        popoutEnabled: Boolean
    });
    
    RoomSchema.plugin(autoIncrement.plugin, { model: 'Room', field: 'roomId' });
    RoomSchema.index({ name: 'roomId' });
    
    var Room = mongoose.model(prefix + 'Room', RoomSchema);
    
    return Room;
}