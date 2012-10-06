(function() {
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({port: 13045});
    wss.on('connection', function(ws) {
        logger.debug('ws user connected');
        ws.on('message', function(message) {
            console.log('received: %s', message);
        });
        ws.send('something');
    });
    logger.debug('load ws');

    //var io = require('socket.io').listen(13045);
    var logger = require('./log.js').createLogger('wsi');

    var events = ['error', 'friends', 'tweet', 'event', 'other'];
    var buffer = [];
    var bufferSize = 0;

    var refreshBuffer = function() {
        if (buffer.length) {
            buffer.forEach(function(item) {
                //io.sockets.emit(item.event, item.data);
            });
            buffer = [];
        } 
    };

    var pushToBuffer = function(item) {
        if (bufferSize == 0) {
            return;
        }

        if (buffer.length >= bufferSize) {
            buffer.shift(); // delete oldest
        }
        buffer.push(item);
    };

    var init = function() {
        /*
        io.configure(function() {
            io.set('log level', 1);
        });

        io.sockets.on('connection', function(socket) {
            logger.debug('user connected');
            refreshBuffer();

            socket.on('disconnect', function () {
                logger.debug('user disconnected');
            });
    });
        */
    };

    var wsi = {};
    wsi.attachStream = function(us) {
         // just proxy events
        events.forEach(function(e) {
            us.on(e, function(data) {
                /*
                if (io.sockets.clients().length) { // if we have clients connected
                    refreshBuffer();
                    io.sockets.emit(e, data);
                } else {
                    pushToBuffer({event: e, data: data});
                    logger.debug('buffer len:', buffer.length);
                }
                */
            });
        });
    };

    wsi.setBufferSize = function(n) {
        bufferSize = n;
    };


    init();

    // exports
    var root = this;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = wsi;
    } else if (!root.wsi) {
        root.wsi = wsi;
    }

})();


