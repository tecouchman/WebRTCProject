
// Calculate and display the session URL
// and iframe code
updateURL();
updateIframeCode();

// When the user alters the sessions url
$('#rtc-add-session-url').keyup(function(event) {
    // Recalculate the full session url
    updateURL();
    // and iframe code
    updateIframeCode();
});

// When the associate room is changed
$('#rtc-add-session-room').change(function(event) {
    // Update the iframe code, to ensure the allow full screen
    // properties match the room
    updateIframeCode()
});

$('#rtc-add-session-embeddable').change(function(event) {
    toggleEmbedSection();
});

// Method to update the full session url
function updateURL() {
    var url = 'http://' + baseURL + '/room/' + $('#rtc-add-session-url').val(); 
    $('#rtc-full-url').val(url);
    $('#rtc-page-link').attr('href', url);
}

// Method to calculate the iframe code for
// embedding sessions.
function updateIframeCode() {

    var iframe = '<iframe src="' + $('#rtc-full-url').val()+ '"';
    
    var roomSelect = $('#rtc-add-session-room')[0];
    if (rooms[roomSelect.selectedIndex]) {
        iframe += ' allowfullscreen webkitallowfullscreen mozallowfullscreen'
    }
    
    iframe += '><iframe>';

    $('#rtc-embed-code').text(iframe);

}

// Set whether the embed section is visible
// based on the value of the 'embeddable' checkbox
function toggleEmbedSection() {
    var embedSection = $('#rtc-add-session-embed-section');
    // Shows or hides the embed based on the checked property of the checkbox
    // Jquery show and hide are used so that the appearance/disappearance of the
    // embed box is animated.
    if ($('#rtc-add-session-embeddable').prop('checked') == true) {
        embedSection.show(100);
    } else {
        embedSection.hide(100);
    }
}

// If the user edits the password
$('#rtc-add-session-password').on('change', function(event) {
    // set the value of the password changed checbox to true
    $('#rtc-password-changed').checked(true);
});