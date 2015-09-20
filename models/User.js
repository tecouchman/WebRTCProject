/*
    User model
    Holds details of a User: their username, email address and password.
    Contains a methods that is automatically called when a user is saved 
    to encrypt the password using bcrypt. This means that only the hash of a password
    needs to be stored. The model also has a convenience method for authenticating
    users that compares an inputted password against the hashed password.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {

    var Schema = mongoose.Schema,
            bcrypt = require('bcrypt-nodejs');
    
    // Database schema for user account:
    var UserSchema = new Schema ({
            username: { type: String, index: { unique : true } },
            password: String,
            emailAddress: String
    });
    
    // Function called before save, hashes passwords
    UserSchema.pre('save', function(next){
        
        // If the password is being set, encrypt it
        if (this.isModified('password')) {
            // 'this' is the User being saved, store a reference, so it can still
            // be accessed in the bcrypt callbacks
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
        
        // Find the user based on the username - uses a regex expression to make the search case insensitive
        this.findOne({ username: new RegExp(username, 'i') }, function(err, user) {
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
    
    var User = mongoose.model(prefix + 'User', UserSchema);

    return User;
    
}