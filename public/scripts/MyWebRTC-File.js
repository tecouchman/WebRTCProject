MyWebRTC.File = (function(){

    var readFileAsDataURL = function(file, callback) {
        var fileReader = new window.FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = callback;
    };
    
    var saveFileString = function(file) {

    }
    
    var fileModule = {
        readFileAsDataURL: readFileAsDataURL 
    };
    
    return fileModule;

}());