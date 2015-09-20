/*
    File Options model
    Holds details of accepted files, and max file sizes for rooms with
    file sharing enabled.
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {   
    
    var Schema = mongoose.Schema;
    
    var FileOptionsSchema = new Schema ({
        roomId: { type: Number, index: { unique : true } },
        maxFileSize: Number,
        acceptedFileTypes: [String]
    });
    var FileOptions = mongoose.model(prefix + 'FileOptions', FileOptionsSchema);
    
    return FileOptions;
}