$('.delete-button').click(function(event) {
    // Confirm with the user that they want to delete the session
    var confirmDelete = confirm('Are you sure you\'d like to delete this session?');
    
    if (confirmDelete) {
        // Get the id of the session to delete from the data-id attribute
        // of the button
        var sessionToDelete = $(this).data('id');

        // Make an ajax DELETE request to remove the session
        $.ajax({
            url: '/admin/sessions/' + sessionToDelete,
            type: 'DELETE',
            success: function(result) {
                if (result.status == 'ok') {
                    
                    $('#session' + sessionToDelete).hide(100, function() {
                        $('#session' + sessionToDelete).remove();  
                        
                        if ($('.session').length == 0) {
                            $('#rtc-empty-message').show(100);
                        }
                    });
                    

                } else {
                    alert(result.message);
                }
            }
        });
    }
});