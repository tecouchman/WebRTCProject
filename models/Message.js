/*
    Message model
    Holds details of a message. A Message is a single line of text send during in
    WebRTC chat.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {

    var Schema = mongoose.Schema,
        autoIncrement = require('mongoose-auto-increment');
    
    autoIncrement.initialize(mongoose.connection);

    var MessageSchema = new Schema ({
        //messageId: Number (Autoincrement), - added by the autoIncrement plugin
        sessionId: Number,
        userId: String,
        userName: String,
        message: String,
        sentAt: Date
    });
    MessageSchema.plugin(autoIncrement.plugin, { model: 'Message', field: 'messageId' });
    MessageSchema.index({ name: 'messageId' });
    var Message = mongoose.model(prefix + 'Message', MessageSchema);
 
    return Message;
}