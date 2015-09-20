/*
    Ice Server model
    Holds details of ICE servers. These are servers that facilitate WebRTC Communication.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {   
    
    var Schema = mongoose.Schema;
    
    var IceServerSchema = new Schema({
        serverUrl: String,
        type: { type: String, enum: ['STUN', 'TURN'] }
    });

    var IceServer = mongoose.model(prefix + 'IceServer', IceServerSchema);
    
    return IceServer;
}