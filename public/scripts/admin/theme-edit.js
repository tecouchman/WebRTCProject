
$('#rtc-has-custom-css').change(function(){
    if ($(this).prop('checked')) {
        $('#rtc-custom-css-section').removeClass('hidden');   
    } else {
        $('#rtc-custom-css-section').addClass('hidden'); 
    }
    
})
