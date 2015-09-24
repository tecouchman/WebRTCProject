/**
	Utils module
**/
InstantRTC.Utils = function(){

	// Convenience method for reading files as data URLs
    this.readFileAsDataURL = function(file, callback) {
        var fileReader = new window.FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = callback;
    };
    
};