/*
    Module for loading and saving config values.
    When the module is imported, values are automatically
    loaded from file and made available as key-value pairs.
    When a new pair is added, it is automatically saved
    to file.
    
    @author Tom Couchman
*/

// fs module for working with files
var fs = require('fs'),
    // object to store the config key-value pairs
    config,
    // location to load/store the config data
    filename = './config/config.json';
         
/*
    Method to load the config data from file. Loads data and then parses the json.
*/
var loadConfig = function(callback) {
    // Read the file 
    fs.readFile(filename, function(err, data) {
        if (!err && data) {
            config = JSON.parse(data.toString());
            callback(config);
        } else if (err) {
            // Read failed, display a message
            console.error(err);   
        }
    });
};


/**
    Method to store the config data 
*/
var saveConfig = function() {
    
    // Stringify the data ready for saving
    var configString = JSON.stringify(config);
    
    // Write the encrypted data to file
    fs.writeFile(filename, configString, function(err) {
        // if write failed, display a message
        if (err) {
            console.error(err.message);   
        }

    });
}

/*
    GetConfig method returns object, with config
    info stored as key-value pairs
*/
module.exports.getConfig = function(callback) {
    if (config) {
        callback(config);
    } else {
        loadConfig(callback);
    }
};

/*
    Method to add a new key-value pair to the config.
    Automatically saves the updated valueds to file.
    
    @param name - A key to identify the stored value
    @param value - the value to be stored
*/
module.exports.add = function(key, value) {
    config[key] = value;
    saveConfig();
}






