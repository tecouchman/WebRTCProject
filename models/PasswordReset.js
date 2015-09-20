/*
    Password Reset model
    Details of a password reset request. Holds a reset token and expiry date.
    Users will access links in their password reset emails that will contain 
    these tokens. They can then be validated against, the db.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {   
    
    var Schema = mongoose.Schema;
    
    // Database schema for Password Reset tokens
    var PasswordResetSchema = new Schema ({
            userId: { type: String, index: { unique : true } },
            resetToken : String,
            resetTokenExpiry : Date
    });
    
    var PasswordReset = mongoose.model(prefix + 'PasswordReset', PasswordResetSchema);
 
    return PasswordReset;
}