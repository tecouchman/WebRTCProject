/*
    Theme model
    Holds the layout and styling information for a Room
    
    @author Tom Couchman
*/
module.exports = function(mongoose, prefix) {
    
    var Schema = mongoose.Schema;

    var ThemeSchema = new Schema({
        themeName: { type: String, index: { unique: true}},
        layoutName: String,
        includeMobileLayout : Boolean,
        hasCustomCss : Boolean,
        showDisplayName : Boolean,
        showAvatar : Boolean,
        localVideoPIP : Boolean
    })
    var Theme = mongoose.model(prefix + 'Theme', ThemeSchema);
    
    return Theme;
}