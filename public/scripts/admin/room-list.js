$('.delete-button').click(function(event) {
    // Confirm with the user that they want to delete the room
    var confirmDelete = confirm('Are you sure you\'d like to delete this room?');
    if (confirmDelete) {
        
        // Get the id of the room to delete from the data-id attribute
        // of the button
        var roomToDelete = $(this).data('id');

        // Make an ajax DELETE request to remove the room
        $.ajax({
            url: '/admin/rooms/' + roomToDelete,
            type: 'DELETE',
            success: function(result) {
                if (result.status == 'ok') {
                    
                    $('#room' + roomToDelete).hide(100, function() {
                        $('#room' + roomToDelete).remove();    
                        
                        if ($('.room').length == 0) {
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