$(document).ready(function() {
   
    var usernameInput, passwordInput, confirmInput, emailInput, registerButton, mismatchWarning, usernameEmptyWarning, usernameInvalidWarning, passwordEmptyWarning, passwordInvalidWarning, emailEmptyWarning, emailInvalidWarning;
    
    usernameInput = $('#rtc-install-username');
    passwordInput = $('#rtc-install-password');
    confirmInput = $('#rtc-install-password-confirm');
    emailInput = $('#rtc-install-email');
    registerButton = $('#rtc-register-button');
    mismatchWarning = $('#rtc-password-mismatch');
    usernameEmptyWarning = $('#rtc-username-empty');
    usernameInvalidWarning = $('#rtc-username-invalid');
    passwordEmptyWarning = $('#rtc-password-empty');
    passwordInvalidWarning = $('#rtc-password-invalid');
    emailEmptyWarning = $('#rtc-email-empty');
    emailInvalidWarning = $('#rtc-email-invalid');

    usernameInput.blur(function() {
        if (usernameInput.val() != '') {
            checkValidUsername();
        }
    });
    
    emailInput.blur(function() {
        if (emailInput.val() != '') {
            checkValidEmail();
        }
    });
    
    passwordInput.blur(function() {
        if (confirmInput.val() != '') {
            checkPasswordMatch();
        }
        
        if (passwordInput.val() != '') {
            checkValidPassword();
        }
    });
    
    confirmInput.blur(function() {
        if (confirmInput.val() != '') {
            checkPasswordMatch();
        }
    });
    
    function checkPasswordMatch() {
        match = confirmInput.val() == passwordInput.val();
        if (match) {
            confirmInput.removeClass('invalid');
            mismatchWarning.addClass('hidden');
            return true;
        } else {
            confirmInput.addClass('invalid');
            mismatchWarning.removeClass('hidden');
            return false;
        }
    }
    
    function checkValidPassword() {
        var password = passwordInput.val();
        
        // Reset the alerts
        passwordEmptyWarning.addClass('hidden');
        passwordInvalidWarning.addClass('hidden');
        
        // If no password has been entered
        if (password == '') {
            // Inform the user that they must enter a valid password
            passwordInput.addClass('invalid');
            passwordEmptyWarning.removeClass('hidden');
            return false;
        } else if (password.indexOf('@') > -1) {
            passwordInput.addClass('invalid');
            passwordInvalidWarning.removeClass('hidden');
            return false;
        } else {
            passwordInput.removeClass('invalid');
            return true;
        }
    }
    
    function checkValidUsername() {
        var username = usernameInput.val();
        
        // Reset the alerts
        usernameEmptyWarning.addClass('hidden');
        usernameInvalidWarning.addClass('hidden');
        
        // If no username has been entered
        if (username == '') {
            // Inform the user that they must enter username
            usernameInput.addClass('invalid');
            usernameEmptyWarning.removeClass('hidden');
            return false;
        // TODO: put a real check for a valid username
        } else if (username.indexOf('@') > -1) {
            // Inform the user their password is invalid
            usernameInput.addClass('invalid');
            usernameInvalidWarning.removeClass('hidden');
            return false;
        } else {
            usernameInput.removeClass('invalid');
            return true;
        }
    }
    
    function checkValidEmail() {
        var email = emailInput.val();
        
        // Reset the alerts
        emailEmptyWarning.addClass('hidden');
        emailInvalidWarning.addClass('hidden');
        
        // If no password has been entered
        if (email == '') {
            // Inform the user that they must enter an email address
            emailInput.addClass('invalid');
            emailEmptyWarning.removeClass('hidden');
            return false;
        } else if (email.search(/^[\s\S]+@[\s\S]+$/) == -1) {
            // Inform the user their email address is invalid
            emailInput.addClass('invalid');
            emailInvalidWarning.removeClass('hidden');
            return false;
        } else {
            emailInput.removeClass('invalid');
            return true;
        }
    }
    
    // behaviour when the user clicks the button
    registerButton.click(function() {
        // If the password and confirm do not match,
        // or an invalid/no username has been entered:
        if (!checkValidUsername() | !checkValidEmail() | !checkValidPassword() |  !checkPasswordMatch()) {
            // return false so the form will not submit
            return false;
        }
    });
    
});