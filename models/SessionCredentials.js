/*
    Session Credentials model
    Holds the password for a sessions that is password protected.
    The model has a method that automatically encrypts password as
    they are saved so they can be stored as hashes, and gives access 
    to an authenticate for checking passwords against the stored hash.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {   
    
    var Schema = mongoose.Schema,
        bcrypt = require('bcrypt-nodejs');
    
    var SessionCredentialsSchema = new Schema ({
        sessionId: { type: Number, index: { unique : true } } ,
        password: String
    });
    
    // Function called before save, hashes session passwords
    SessionCredentialsSchema.pre('save', function(next){
        
        // If the password is being set, encrypt it
        if (this.isModified('password')) {
            // 'this' is the SessionCredentials being saved, store a reference, so it can still
            // be accessed in the bcrypt callbacks
            var newSession = this;
            
            // Generate a salt for the password hash
            bcrypt.genSalt(10, function(err, salt) {
                // If there is an error, pass it to next, and return
                // so execution doesn't continue
                if (err) {
                    return next(err);
                }
                
                // Hash the password being set, with the generated salt
                bcrypt.hash(newSession.password, salt, null, function(err, hash) {
                   if (err) {
                        return next(err);
                   }
                    
                    console.log(hash);
                    // replace the password with the hash
                    newSession.password = hash;
                    next();
                });
                
            });
            
        } else { // if password not being updated:
            // Go straight to the next middleware.
            next();
        }
    });
    
    // Method to authenticate a passport protected session
    SessionCredentialsSchema.statics.authenticate = function(sessionId, password, callback) {
        
        // Find the credentials based on the session id
        this.findOne({ sessionId: sessionId }, function(err, credentials) {
            if (err) {
                return callback(err);   
            } else if (!credentials) {
                return callback(null, null);   
            }
            
            bcrypt.compare(password, credentials.password, function(err, match) {
                console.log('bcrypt compare match? ' + match);
                
                // if an error occurred
                if (err) {
                    console.log('bcrypt compare error');
                    return callback(err);
                } else if (!match){
                    callback(null, null) 
                } else if (match) {
                    callback(null, credentials);
                }

            });
            
        })
    };
    
    var SessionCredentials = mongoose.model(prefix + 'SessionCredentials', SessionCredentialsSchema);
 
    return SessionCredentials;
}
    