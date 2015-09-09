var savePasswordButton = $('#rtc-save-password'),
    saveEmailButton = $('#rtc-save-email'),
    oldPassword = $('#rtc-password'),
    newPassword = $('#rtc-new-password'), 
    newPasswordConfirm = $('#rtc-new-password-confirm'), 
    mismatchWarning = $('#rtc-password-mismatch');

savePasswordButton.click(function() {
    return checkPasswordMatch();
})

function checkPasswordMatch() {
    match = newPasswordConfirm.val() == newPassword.val();
    if (match) {
        mismatchWarning.addClass('hidden');
        return true;
    } else {
        mismatchWarning.removeClass('hidden');
        return false;
    }
}

