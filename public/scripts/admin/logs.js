$('.delete-button').click(function(event) {
    // Confirm with the user that they want to delete the session
    var confirmDelete = confirm('Are you sure you\'d like to clear this log?');
    
    if (confirmDelete) {
        // Get the id of the session to delete from the data-id attribute
        // of the button
        var sessionLogToDelete = $(this).data('id');

        // Make an ajax DELETE request to remove the session
        $.ajax({
            url: '/admin/logs/' + sessionLogToDelete,
            type: 'DELETE',
            success: function(result) {
                if (result.status == 'ok') {
                    
                    location.reload();
                    
                } else {
                    alert(result.message);
                }
            }
        });
    }
});


// Find each fo the message
$('.message').each(function(index, message) {
    // Parse the text using emojione to convert emojis to images
    // and put the generated html back into the message span.
    $(message).html(emojione.toImage($(message).text()));
});