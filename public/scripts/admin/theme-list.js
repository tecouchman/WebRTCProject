$('.delete-button').click(function(event) {
    // Confirm with the user that they want to delete the theme
    var confirmDelete = confirm('Are you sure you\'d like to delete this theme?');
    
    if (confirmDelete) {
        // Get the id of the theme to delete from the data-id attribute
        // of the button
        var themeToDelete = $(this).data('id');

        // Make an ajax DELETE request to remove the session
        $.ajax({
            url: '/admin/themes/' + themeToDelete,
            type: 'DELETE',
            success: function(result) {
                if (result.status == 'ok') {
                    
                    $('#theme' + themeToDelete).hide(100, function() {
                        $('#theme' + themeToDelete).remove(); 
                        if ($('.theme').length == 0) {
                            $('#rtc-empty-message').show(100);
                        }
                    })
                    
                } else {
                    alert(result.message);
                }
            }
        });
    }
});