(function() {
    var fs = require('fs');
    var util = require('util');

    var levels = ['debug', 'info', 'warn', 'error', 'fatal'];

    var log = {
        level: 2, // warn
        stream: process.stdout
    };

    log.init = function(path) {
        this.stream = fs.createWriteStream(path);
    };

    log.createLogger = function(id) {
        return new Logger(id); 
    };

    log.setLevel = function(lv) {
        this.level = levels.indexOf(lv); 
    };


    var Logger = function(id) {
        this.id = id;

        // init
        this.spaces = ' ';
        var spacesLen = 8 - id.length;
        while (spacesLen-- > 0) {
            this.spaces += ' ';
        };
    };

    Logger.prototype._log = function(lv, arg) {
        var index = levels.indexOf(lv);
        if (index >= log.level) {
            if (lv == 'warn' || lv == 'info') { // padding
                lv = lv + ' '; 
            }
            log.stream.write('[' + (new Date).toLocaleTimeString() + '][' + lv.toUpperCase() + '][' + this.id + ']' + this.spaces + util.format.apply(this, arg) + '\n');
        }
    };

    levels.forEach(function(lv) {
        Logger.prototype[lv] = function() {
            this._log(lv, arguments);
        };
    });

    // exports
    var root = this;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = log;
    } else if (!root.log) {
        root.log = log;
    }

})();


