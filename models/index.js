var connected = false;

module.exports.connected = function(){ return connected; };

module.exports.init = function(url, username, password, prefix) {
    // If prefix undefined, set it to an empty string
    prefix = prefix || '';
    console.log(prefix);
    
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
    
    UserSchema.pre('save', function(next){
        
        // If the password is being set, encrypt it
        if (this.isModified('password')) {
            // this is the user being saved, stored a reference, so it can still
            // in the bcrypt callbacks
            var newUser = this;
            
            // Generate a salt for the password hash
            bcrypt.genSalt(10, function(err, salt) {
                // If there is an error, pass it to next, and return
                // so execution doesn't continue
                if (err) {
                    return next(err);
                }
                
                // Hash the password being set, with the generated salt
                bcrypt.hash(newUser.password, salt, null, function(err, hash) {
                   if (err) {
                        return next(err);
                   }
                    
                    console.log(hash);
                    // replace the password with the hash
                    newUser.password = hash;
                    next();
                });
                
            });
            
        } else { // if password not being updated:
            // Go straight to the next middleware.
            next();
        }
    });
    
    // Method to authenticate a user
    UserSchema.statics.authenticate = function(username, password, callback) {
        
        // Find the user based on the username
        this.findOne({ username: username }, function(err, user) {
            if (err) {
                return callback(err);   
            } else if (!user) {
                return callback(null, null);   
            }
            
            bcrypt.compare(password, user.password, function(err, match) {
                console.log('bcrypt compare match? ' + match);
                
                // if an error occurred
                if (err) {
                    console.log('bcrypt compare error');
                    return callback(err);
                } else if (!match){
                    callback(null, null) 
                } else if (match) {
                    callback(null, user);
                }

            });
            
        })
    }
    
    var User = mongoose.model(prefix + 'UserInfo', UserSchema);

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

    var FileOptionsSchema = new Schema ({
        roomId: { type: Number, index: { unique : true } },
        maxFileSize: Number,
        acceptedFileTypes: [String]
    });
    var FileOptions = mongoose.model(prefix + 'FileOptions', FileOptionsSchema);

    var IceServerSchema = new Schema({
        serverUrl: String,
        type: { type: String, enum: ['STUN', 'TURN'] }
    });

    var IceServer = mongoose.model(prefix + 'IceServer', IceServerSchema);

    var SessionCredentialsSchema = new Schema ({
        sessionId: { type: Number, index: { unique : true } } ,
        password: String
    });

    var SessionCredentials = mongoose.model(prefix + 'SessionCredentials', SessionCredentialsSchema);

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

    var ThemeSchema = new Schema({
        themeName: { type: String, index: { unique: true}},
        layoutName: String,
        includeMobileLayout : Boolean,
        hasCustomCss : Boolean,
        showDisplayName : Boolean,
        showAvatar : Boolean
    })
    var Theme = mongoose.model(prefix + 'Theme', ThemeSchema);
    
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
