(function() {
    var fs = require('fs');
    var util = require('util');

    var Logger = function(stream, id) {
        this.stream = stream || process.stdout;
        this.id = id;

        // init
        this.spaces = ' ';
        var spacesLen = 8 - id.length;
        while (spacesLen-- > 0) {
            this.spaces += ' ';
        };
    };

    Logger.prototype._log = function(level, arg) {
        this.stream.write('[' + (new Date).toLocaleTimeString() + '][' + level + '][' + this.id + ']' + this.spaces + util.format.apply(this, arg) + '\n');
    };

    Logger.prototype.debug = function() {
        this._log('DEBUG', arguments); 
    };
    Logger.prototype.info = function() {
        this._log('INFO ', arguments); 
    };
    Logger.prototype.warn = function() {
        this._log('WARN ', arguments); 
    };
    Logger.prototype.error = function() {
        this._log('ERROR', arguments); 
    };
    Logger.prototype.fatal = function() {
        this._log('FATAL', arguments); 
    };


    var log = {};
    log.init = function(path) {
        this.stream = fs.createWriteStream(path);
    };

    log.createLogger = function(id) {
       return new Logger(this.stream, id); 
    };


    // exports
    var root = this;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = log;
    } else if (!root.kt) {
        root.nt = log;
    }

})();


