var renderer = ECT({ root : '/views', ext : '.ect' });

$('#rtc-add-turn-button').click(function(event) {
    // Get the url to be added
    var serverUrl = $('#rtc-add-turn-url').val();
    // clear the text box:
    $('#rtc-add-turn-url').val('');
    // Pass the url through to the method to add the IceServer
    addIceServer(serverUrl, 'TURN', function() {
        $('#turn-server-list').children('.info').hide(100);
        $('#turn-server-list').append(createServerListItem(serverUrl));
    });
});

$('#rtc-add-stun-button').click(function(event) {
    // Get the url to be added
    var serverUrl = $('#rtc-add-stun-url').val();
    // clear the text box:
    $('#rtc-add-stun-url').val('');
    // Pass the url through to the method to add the IceServer
    addIceServer(serverUrl, 'STUN', function() {
        $('#stun-server-list').children('.info').hide(100);
        $('#stun-server-list').append(createServerListItem(serverUrl));
    });
});

$('.list').on('click', '.delete-button', function(event) {
    var url = $(this).data('url');

    deleteIceServer(url, function() {
        var parentLi = $(event.target).parents('li'); 
        parentLi.hide(100, function() {
            // Get a reference to the parent unordered list element
            var parentUl = parentLi.parents('ul');
            // Remove the list item from the list
            parentLi.remove();   
        
            // If there are no remaining child elements then
            // show the 'no servers' message
            if (parentUl.children('li').length == 0) {
                parentUl.children('.info').show(100);
            }
        })
    });
    return false;
});

// Method to add an IceServer url to the database
function addIceServer(url, type, success) {
    // Make an ajax post to submit the server url to the backend
    $.ajax({
        url: '/admin/ice-servers',
        type: 'POST',
        data: { url: url, type: type },
        success: function(result) {
            if (result.status == 'ok') {
                success();
            } else {
                alert(result.message);
            }
        }
    });
}

// Method to remove an IceServer url from the database
function deleteIceServer(url, success) {
    // Make an ajax delete request to delete the url from the database
    $.ajax({
        url: '/admin/ice-servers',
        type: 'DELETE',
        data: { url: url },
        success: function(result) {
            if (result.status == 'ok') {
                success();
            } else {
                alert(result.message);
            }
        }
    });
}

// Method to create a new list item for an ice server
// So they can be added to the page dynamically without
// reloading the page. Uses precompiled etc templates.
function createServerListItem(url) {
    var data = { iceServer : { serverURL : url } };
    return renderer.render('admin/partials/ice-server-list-item', data);
}