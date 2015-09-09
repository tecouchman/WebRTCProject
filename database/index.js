var connected = false;

module.exports.connected = function(){ return connected; };
module.exports.init = function(url, username, password) {
    
    // Require mongoose for database connectivity
    var mongoose = require('mongoose');
    // Auto increment plugin for mongoose
    var autoIncrement = require('mongoose-auto-increment');
    
    var bcrypt = require('bcrypt-nodejs');
    
    // Connect to the database - TODO: section out the db stuff so another type of db can be used?
    mongoose.connect('mongodb://' + username + ':' + password + '@' + url);
    connected = true;
    console.log('local :' + connected);
    
    var Schema = mongoose.Schema;

    autoIncrement.initialize(mongoose.connection);

    // Database schema for user account:
    var UserSchema = new Schema ({
            username: { type: String, index: { unique : true } },
            password: String,
            emailAddress: String,
            passwordResetToken : String,
            passwordResetTokenExpiry : Date
    });
    /*UserSchema.pre('save', function(){
        
        
    });*/
    var User = mongoose.model('UserInfo', UserSchema);

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
    
    var Room = mongoose.model('Room', RoomSchema);

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
    var Session = mongoose.model('Session', SessionSchema);

    var FileOptionsSchema = new Schema ({
        roomId: { type: Number, index: { unique : true } },
        maxFileSize: Number,
        acceptedFileTypes: [String]
    });
    var FileOptions = mongoose.model('FileOptions', FileOptionsSchema);

    var IceServerSchema = new Schema({
        serverUrl: String,
        type: { type: String, enum: ['STUN', 'TURN'] }
    });

    var IceServer = mongoose.model('IceServer', IceServerSchema);

    var SessionCredentialsSchema = new Schema ({
        sessionId: { type: Number, index: { unique : true } } ,
        password: String
    });

    var SessionCredentials = mongoose.model('SessionCredentials', SessionCredentialsSchema);

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
    var Message = mongoose.model('Message', MessageSchema);

    var ThemeSchema = new Schema({
        themeName: { type: String, index: { unique: true}},
        layoutName: String,
        hasCustomCss : Boolean
    })
    var Theme = mongoose.model('Theme', ThemeSchema);
    
    // Export the DB Models, so they can be accessed from elsewhere
    module.exports.User = User;
    module.exports.Room = Room;
    module.exports.Session = Session;
    module.exports.FileOptions = FileOptions;
    module.exports.IceServer = IceServer;
    module.exports.SessionCredentials = SessionCredentials;
    module.exports.Message = Message;
    module.exports.Theme = Theme;

}
