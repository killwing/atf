(function() {
    Array.prototype.clean = function(deleteValue) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {         
                this.splice(i, 1);
                i--;
            }
        }
        return this;
    };

    var logger = require('./log.js').createLogger('wsi');

    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({port: 13045});
  
    var events = ['error', 'friends', 'tweet', 'event', 'other'];
    var buffer = [];
    var bufferSize = 0;
    var clients = [];

    var refreshBuffer = function() {
        if (buffer.length) {
            buffer.forEach(function(item) {
                clients.forEach(function(client) {
                    client.send(JSON.stringify(item), function(err) {
                        if (err) {
                            logger.warn('send error: ', err);
                        }
                    });
                }); 
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
        wss.on('connection', function(ws) {
            clients.push(ws);

            logger.debug('user connected, clients: ', clients.length);
            refreshBuffer();

            ws.on('close', function () {
                logger.debug('user closed');
                clients.clean(ws);
            });

            ws.on('error', function () {
                logger.debug('user error');
                clients.clean(ws);
            });
        });
    };

    var wsi = {};
    wsi.attachStream = function(us) {
         // just proxy events
        events.forEach(function(e) {
            us.on(e, function(data) {
                var msg = {event: e, data: data};
                if (clients.length) { // if we have clients connected
                    refreshBuffer();
                    clients.forEach(function(client) {
                        client.send(JSON.stringify(msg), function(err) {
                            if (err) {
                                logger.warn('send error: ', err);
                            }
                        });
                    }); 
                } else {
                    pushToBuffer(msg);
                    logger.debug('buffer len:', buffer.length);
                }
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


