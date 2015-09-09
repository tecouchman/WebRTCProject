// When the value of the 'password protected' checkbox
// changes, call the password input box toggle method.
$('#rtc-add-room-filesharing').change(function(event) {
    toggleFilesharingSectionSection();
});

// Set whether the password input section is visible
// based on the value of the 'password protected' checkbox
function toggleFilesharingSectionSection() {
    console.log('togglin');
    var passwordSection = $('#rtc-file-sharing-section');
    // Shows or hides the section based on the checked property of the checkbox
    // Jquery show and hide are used so that the appearance/disappearance of the
    // password input box is animated.
    if ($('#rtc-add-room-filesharing').prop('checked') == true) {
        passwordSection.show(100);
    } else {
        passwordSection.hide(100);
    }
}