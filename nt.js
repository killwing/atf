(function() {
    var url = require('url');
    var qstring = require('querystring');
    var http = require('http');
    var https = require('https');
    var logger = require('./log.js').createLogger('nt');

    var request = function(type, settings) {

        var urlObj = url.parse(settings.url || 'http://localhost/');

        var options = {
            host: urlObj.hostname,
            port: urlObj.protocol == 'https:' ? 443 : 80,
            path: urlObj.pathname,
            method: type,
            headers: {}
        };

        if (type == 'POST') {
            options.headers['Content-Type'] = settings.contentType || 'application/x-www-form-urlencoded';
        } else if (type == 'GET' && settings.data) {
            options.path += '?' + qstring.stringify(settings.data);
        }

        if (settings.auth) {
            options.headers.Authorization = settings.auth;
        }

        var prot = urlObj.protocol == 'https:' ? https : http;
        var req = prot.request(options, function(res) {
            logger.info('statusCode: ', res.statusCode);
            logger.debug('headers: ', res.headers);

            if (res.statusCode == '200') {
            }

            var chunks = [];
            res.on('data', function (chunk) {
                logger.debug('data:', chunk.toString('utf8'));
                chunk = chunk.toString('utf8').trim();
                if (chunk) {
                    if (settings.streaming && settings.cb) {
                        if (settings.dataType == 'json') {
                            try {
                                chunk = JSON.parse(chunk); 
                            } catch (e) {
                                logger.warn('JSON parse error:', e);
                            }
                        }
                        settings.cb(null, chunk); 
                    } else {
                        chunks.push(chunk); 
                    }
                }
            });

            res.on('end', function() {
                logger.info('end');

                if (!settings.streaming) {
                    var data = chunks.join('');

                    if (settings.dataType == 'json') {
                        try {
                            data = JSON.parse(data); 
                        } catch (e) {
                            logger.warn('JSON parse error:', e);
                        }
                    }

                    if (settings.cb) { 
                        settings.cb(null, data); 
                    }
                }
            });

            res.on('close', function(e) {
                logger.info('close: ', e);
            });

        });

        req.on('error', function(e) {
            logger.error('error: ', e);

            if (settings.cb) {
                settings.cb(e);
            }
        });

        if (type == 'POST' && settings.data) {
            req.write(qstring.stringify(settings.data));
        }

        req.end();
    };

    var nt = {};
    nt.get = function(settings) {
        request('GET', settings);
    };

    nt.post = function(settings) {
        request('POST', settings);
    };


    // exports
    var root = this;
    if (typeof module !== 'undefined'  && module.exports) {
        module.exports = nt;
    } else if (!root.kt) {
        root.nt = nt;
    }

})();
