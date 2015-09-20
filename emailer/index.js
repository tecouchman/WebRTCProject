var nodemailer = require('nodemailer');       

module.exports = function (username, password) {
    
    interface = {};
    
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: username,
            pass: password
        }
    });

    interface.send =  function(emailAddress, subject, body, callback) {
        transporter.sendMail({
            from: 'no-reply',
            to: emailAddress,
            subject: subject,
            text: body
        }, function(err, info) {
            callback(err);
        });
    };

    // return the interface so that the user can access the methods
    return interface;
    
}