/* 
   Unit Tests
   
   To run these tests enter the following into command line:
   mocha -u tdd spec tests/unit.js

   May need to first install mocha globally to be able to use the mocha
   command:
   npm install --global mocha
   On mac run this command as sudo: sudo npm install --global mocha
*/

// Require classes to be tested
var Emailer = require('../emailer');

// Import expect from chai
var expect = require('chai').expect;

suite ('suite name', function() {
    
    test('test name', function() {
        
        expect(true == true);
        
    });
});


/* Tests for the email sender module */
suite ('Email Test', function() {
    
    test('Test Send Email', function() {

        // Init the emailer with the email address and password of the account to send
        // emails from
        var emailer = Emailer('webrtcaddress@gmail.com', 'webrtcPassword');
        
        emailer.send('webrtcaddress@gmail.com', 'My Subject', 'My Email Body', function(error) {
             expect(error == null);
        });
        
    });
});


