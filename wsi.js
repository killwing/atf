(function() {
    var io = require('socket.io').listen(13045);

    io.sockets.on('connection', function(socket) {
        console.log('user connected');

        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    });



    var events = ['error', 'friends', 'tweet', 'event', 'other'];

    var wsi = {};
    wsi.attachStream = function(us) {
         // just proxy events
        events.forEach(function(e) {
            us.on(e, function(data) {
                io.sockets.emit(e, data);
            });
        });
    };

    // exports
    var root = this;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = wsi;
    } else if (!root.wsi) {
        root.wsi = wsi;
    }

})();


