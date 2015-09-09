// When the value of the 'password protected' checkbox
// changes, call the password input box toggle method.
$('#rtc-add-session-password-protected').change(function(event) {
    togglePasswordSection();
});

// Reset the password on focus
$('#rtc-add-session-password').focus(function() {
    $(this).val('');
});

// Set whether the password input section is visible
// based on the value of the 'password protected' checkbox
function togglePasswordSection() {
    var passwordSection = $('#rtc-add-session-password-section');
    // Shows or hides the section based on the checked property of the checkbox
    // Jquery show and hide are used so that the appearance/disappearance of the
    // password input box is animated.
    if ($('#rtc-add-session-password-protected').prop('checked') == true) {
        passwordSection.show(100);
    } else {
        passwordSection.hide(100);
    }
}