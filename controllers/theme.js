module.exports = function(app, models) {
        
    var url = require('url'),
        nodemailer = require('nodemailer'),
        async = require('async'),
        crypto = require('crypto'),
        fs = require('fs');
    
    var exports = {};
    
       // On client get request for the theme list
    exports.renderThemes = function renderThemes(req, res) {

        // Find all themes expect default - it is not editable
        models.Theme.find({ themeName : {$ne : 'default'} }, function themeResultsCallback(err, themes) {
            // Render the theme list, and pass in the theme data
            res.render('admin/theme-list', {
                user: req.user,
                themes: themes,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/theme-list.js' ],
                wizard: req.query.wizard
            }); 
        });
    };


    exports.renderAddTheme = function renderAddTheme(req, res) {

        var cssUrl = app.get('root') + '/public/styles/default.css';

        fs.readFile(cssUrl, function(err, data) {
            if (!err && data) {
                customCss = data.toString();
            } else if (err) {
                console.log(err);   
            }
            
            // Render the add theme page:
            res.render('admin/edit-theme', {
                mode: 'add',
                user: req.user,
                customCss : customCss,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/theme-edit.js' ],
                wizard: req.query.wizard
            }); 
        }); 

    };

    
    // TODO: check if theme name already exists before creating:
    
    exports.addTheme = function addTheme(req, res) {
            console.log('Adding theme: ' + req.body.themeName);
        
            var hasCustomCss = false;
            if (req.body.hasCustomCss && req.body.customCss != '') {
                hasCustomCss = true;

                var cssUrl = app.get('root') + '/public/styles/themes/' + encodeURIComponent(req.body.themeName) + '.css'
            
                fs.writeFile(cssUrl, req.body.customCss, function(err) {
                    if (err) {
                        console.log(err.message);   
                    }
                });
                
            }
        
            // Create a new room with the data from the add_room form
            var newTheme = new models.Theme({ 
                themeName: req.body.themeName,
                layoutName: req.body.layoutName,
                includeMobileLayout: req.body.includeMobileLayout,
                hasCustomCss : hasCustomCss,
                showDisplayName : req.body.showDisplayName,
                showAvatar: req.body.showAvatar,
                localVideoPIP : req.body.localVideoPIP
            });
        
            // Save the newly created theme
            newTheme.save(function(err) {
                
                // If the user is completing the wizard:
                if (req.query.wizard) {
                    //redirect to next step
                    res.redirect(302, '/admin/add_room?wizard=2&theme=' + encodeURIComponent(req.body.themeName)); 
                } else {
                    // else Take the user to themes list
                    res.redirect(302, '/admin/themes'); 
                }
            });
        
            
    };
    
    exports.renderEditTheme = function renderEditTheme(req, res) {
        
        // Get the theme name from the requested url
        var themeName = req.params.themeName;
        
        models.Theme.findOne({ themeName: themeName },function(err, theme) {
            
            var customCss = '';
            
            // Method to render the theme, defined as it will be called from different 
            // places depending on whether the page has custom css
            var renderEditTheme = function() {
                res.render('admin/edit-theme', {
                    mode: 'edit',
                    user: req.user,
                    theme: theme,
                    customCss : customCss,
                    scripts: [ '/scripts/jquery.min.js', '/scripts/admin/theme-edit.js' ]
                }); 
            }
            
            
            var cssUrl = '';
            if (theme.hasCustomCss) {
                cssUrl = app.get('root') + '/public/styles/themes/' + encodeURIComponent(theme.themeName) + '.css';
            } else {
                cssUrl = app.get('root') + '/public/styles/default.css';
            }


            fs.readFile(cssUrl, function(err, data) {
                if (!err && data) {
                    customCss = data.toString();
                } else if (err) {
                    console.log(err);   
                }

                console.log('read: ' + customCss);

                renderEditTheme();
            });   


        });

    };
    
    
    exports.saveTheme = function saveTheme(req, res) {
        // Get the theme name from the requested url
        var themeName = req.params.themeName;

        var conditions = { themeName: themeName };
        
        
        var hasCustomCss = false;
        if (req.body.hasCustomCss && req.body.customCss != '') {
            hasCustomCss = true;

            var cssUrl = app.get('root') + '/public/styles/themes/' + encodeURIComponent(req.body.themeName) + '.css'

            fs.writeFile(cssUrl, req.body.customCss, function(err) {
                if (err) {
                    console.log(err.message);   
                }
            });

        }
        
        console.log(req.body.layoutName);
        // Create a object to hold the new values
        var updatedValues = { 
            themeName: req.body.themeName,
            layoutName: req.body.layoutName,
            includeMobileLayout: req.body.includeMobileLayout,
            hasCustomCss : hasCustomCss,
            showDisplayName : req.body.showDisplayName,
            showAvatar: req.body.showAvatar,
            localVideoPIP : req.body.localVideoPIP
        };

        // Call update on the theme model, passing in the
        // conditions that identify the theme to update and the 
        // values to update. On complete redirect to the themes list
        models.Theme.update(conditions, updatedValues, {}, function() {
            // Take the user to the dashboard
            res.redirect(302, '/admin/themes'); 
        });
    };
    
    /* Method to delete a theme base on id */
    exports.deleteTheme = function deleteTheme(req, res) {
        
        // Get the themeID from the end of the request URL
        var themeId = req.params.themeId;

        // Search for the theme based on the URL
        models.Theme.remove({ _id: themeId },function(err) {
            // If the theme is found
            if (err) {
                // If the room is not found return a failure message
                res.send({status:"nok", message:"Theme could not be deleted"}); 
            } else {
                // Send a success message
                res.send({status:"ok", message:"Theme deleted."});
            } 
        });
    };   

    
    return exports;
    
}