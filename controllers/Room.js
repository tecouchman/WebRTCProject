module.exports = function(app, models) {
	
	// On get request for rooms list
    exports.renderRooms = function renderRooms(req, res) {

        models.Room.find(function(err, rooms) {
            res.render('admin/room-list', {
                user: req.user,
                rooms: rooms,
                scripts: [  '/scripts/jquery.min.js', '/scripts/admin/room-list.js' ]
            }); 
        });
    };


    // On client room delete request with the id of the room to be deleted.
    exports.deleteRoom = function deleteRoom(req, res) {

        // Get the roomId from the end of the request URL
        var roomId = req.params.roomId;

        // Search for the room based on the URL
        models.Room.findOne({ roomId: roomId },function(err, room) {
            // If the room is found
            if (room) {
                // Delete it
                room.remove();
                // Send a success message
                res.send({status:"ok", message:"Room " + room.name + " deleted."});
            } else {
                // If the room is not found return a failure message
                res.send({status:"nok", message:"Room could not be deleted"}); 
            }
        });
    };


 exports.renderAddRoom = function renderAddRoom(req, res) {

        models.Theme.find({}, function(err, themes) {
            res.render('admin/add-room', {
                user: req.user,
                themes: themes,
                scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ],
                wizard: req.query.wizard,
                theme: req.query.theme
            }); 
        });

    };

    exports.addRoom = function addRoom(req, res) {

            // Create a new room with the data from the add_room form
            var newRoom = new models.Room({ 
                name: req.body.name,
                maxUsers: req.body.maxUsers,
				isPresentation: req.body.isPresentation,
                hasVideo: req.body.hasVideo,
                hasAudio: req.body.hasAudio,
                hasMessaging: req.body.hasMessaging,
                hasFilesharing: req.body.hasFilesharing,
                hasCustomUserIds: req.body.hasCustomUserIds,
                theme: req.body.theme,
                recordAudio: req.body.recordAudio,
                recordVideo: req.body.recordVideo,
                logMessages: req.body.logMessages,
                fullscreenEnabled: req.body.fullscreenEnabled,
                popoutEnabled: req.body.popoutEnabled
            });
        
            newRoom.save(function(err) {
   
                // If the user is completing the wizard:
                if (req.query.wizard) {
                    //redirect to next step
                    res.redirect(302, '/admin/add_session?wizard=3&room=' + encodeURIComponent(req.body.name)); 
                } else {
                    // Else the user to the dashboard
                    res.redirect(302, '/admin/rooms'); 
                }
                
                if (req.body.hasFilesharing) {

                    var newFileOptions = new models.FileOptions({
                        roomId: newRoom.roomId,
                        maxFileSize: req.body.maxFileSize,
                        acceptedFileTypes: req.body.acceptedFileTypes.split(',')
                    });
                    newFileOptions.save();
                }
            });
        
            
    };

    exports.saveRoom = function saveRoom(req, res) {
            // Get the room number from the requested url
            var roomId = req.params.roomId;

            var conditions = { roomId: roomId };
            // Create a object to hold the new values
            var updatedValues = { 
                name: req.body.name,
                maxUsers: req.body.maxUsers,
				isPresentation: req.body.isPresentation,
                hasVideo: req.body.hasVideo,
                hasAudio: req.body.hasAudio,
                hasMessaging: req.body.hasMessaging,
                hasFilesharing: req.body.hasFilesharing,
                hasCustomUserIds: req.body.hasCustomUserIds,
                theme: req.body.theme,
                recordAudio: req.body.recordAudio,
                recordVideo: req.body.recordVideo,
                logMessages: req.body.logMessages,
                fullscreenEnabled: req.body.fullscreenEnabled,
                popoutEnabled: req.body.popoutEnabled
            };

            // Call update on the Room model, passing in the
            // conditions that identify the room to update and the 
            // values to update. On complete redirect to the rooms list
            models.Room.update(conditions, updatedValues, {}, function() {
                // Take the user to the dashboard
                res.redirect(302, '/admin/rooms'); 
            });
    };

    exports.renderEditRoom = function renderEditRoom(req, res) {

        // Get the room number from the requested url
        var room = req.params.roomId;

        // Find the room in the DB and show the edit page for that room
        models.Room.findOne({
            roomId: room
        }, function(err, room) {
            // If the room is found, display it
            if (room) {
                
                models.Theme.find({}, function(err, themes) {
                    if (room.hasFilesharing) {
                        models.FileOptions.findOne({ roomId : room.roomId }, function(err, fileOptions) {
                            if (fileOptions && !err) {
                                res.render('admin/edit-room', {
									user: req.user,
                                    scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ],
                                    room: room,
                                    themes: themes,
                                    fileOptions : fileOptions
                                });  
                            } else {
                                // else redirect the user to the room list
                                res.redirect(302, '/admin'); 
                            }
                        });
                    } else {
                        res.render('admin/edit-room', {
                            user: req.user,
                            scripts: [ '/scripts/jquery.min.js', '/scripts/admin/add-room.js' ],
                            room: room,
                            themes: themes
                        });  
                    }
                });
            } else {
                // else redirect the user to the room list
                res.redirect(302, '/admin'); 
            }

        });
    };
	
	
	return exports;

}