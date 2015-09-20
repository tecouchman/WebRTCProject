$('#rtc-wizard-to-room').click( function(event) {
    window.location = '/admin/add_room?wizard=2&theme=' +  $('input:radio[name=selectedTheme]:checked').val();
});