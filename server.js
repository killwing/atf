#!/usr/local/bin/node

var https = require('https');
var qstring = require('querystring');
var cp = require('child_process');
var rl = require('readline');
var fs = require('fs');
var ev = require("events");
var util = require('util');
var path = require('path');

var log = require('./log.js');
var nt = require('./nt.js');
var oauth = require('./OAuthSimple.js');

// app keys
var CONSUMER_KEY = 'hn3jKKLGeTLDbytT8qbUNA';
var CONSUMER_SEC = 'pigmQxksyhGUHgy1gZyZJls5oIVYXBNq5U8qHWQhxU';

var sign = function(token, type, url, data) {
    var sig = {
        consumer_key: CONSUMER_KEY,
        shared_secret: CONSUMER_SEC,
    }

    if (token.oauth_token && token.oauth_token_secret) {
        sig.oauth_token = token.oauth_token;
        sig.oauth_secret = token.oauth_token_secret;
    }
    
    return oauth().sign({
        path: url,
        action: type,
        parameters: data,
        signatures: sig
    });
};

var OAuthLogin = function(token, cb) {
    this.token = token || {};
    this.cb = cb;

    this._init();
};


OAuthLogin.prototype._init = function() {
    var self = this;
    if (!self.token || !self.token.oauth_token_secret) {
        self._requestToken();
    } else { // already got token
        self.cb(); 
    }
};

OAuthLogin.prototype._sign = function(type, url, data) {
    return sign(this.token, type, url, data);
};

OAuthLogin.prototype._accessToken = function() {
    var self = this;
    var url = 'https://api.twitter.com/oauth/access_token';
    var i = rl.createInterface(process.stdin, process.stdout, null);
    i.question("Please input your PIN-CODE:\n", function(pc) {
        nt.post({
            url: url, 
            auth: self._sign('POST', url, {oauth_verifier: pc}).header,
            cb: function(e, data) {
                if (e) {
                    console.error('accessToken error: ', e);
                    self.cb(e);
                    return;
                }

                self.token = qstring.parse(data);
                self.cb(null, self.token);
            },
        });

        i.close();
        process.stdin.destroy();
    });
};

OAuthLogin.prototype._requestToken = function() {
    var self = this;
    var url = 'https://api.twitter.com/oauth/request_token';
    nt.post({
        url: url, 
        auth: self._sign('POST', url, {oauth_callback: 'oob'}).header,
        cb: function(e, data) {
            if (e) {
                console.error('requestToken error: ', e);
                self.cb(e);
                return;
            }

            self.token = qstring.parse(data);
            //var cmd = 'start https://api.twitter.com/oauth/authorize?'+ qstring.stringify({oauth_token: self.token.oauth_token});
            var cmd = 'x-www-browser https://api.twitter.com/oauth/authorize?'+ qstring.stringify({oauth_token: self.token.oauth_token});
            cp.exec(cmd);
            // access
            self._accessToken();
        },
    });
};


var Config = function(filename) {
    this.filename = filename;
    this.data = {};

    this.read();
};

Config.prototype.read = function() {
    var self = this;
    var data = fs.readFileSync(self.filename, 'utf8');
    self.data = JSON.parse(data);
};

Config.prototype.write = function() {
    var self = this;
    fs.writeFileSync(self.filename, JSON.stringify(self.data, null, 4));
};

Config.prototype.__defineGetter__('token', function() {
    return this.data.token;
});

Config.prototype.__defineSetter__('token', function(token) {
    this.data.token = token;
});

Config.prototype.__defineGetter__('cli', function() {
    return this.data.cli;
});

Config.prototype.__defineGetter__('wsi', function() {
    return this.data.wsi;
});

Config.prototype.__defineGetter__('log', function() {
    return this.data.log;
});

var Userstream = function(token) {
    ev.EventEmitter.call(this);
    this.token = token;

    this._init();
};
util.inherits(Userstream, ev.EventEmitter);

Userstream.prototype._init = function() {
    var self = this;
    var url = 'https://userstream.twitter.com/2/user.json';
    nt.get({
        url: url, 
        auth: sign(self.token, 'GET', url).header,
        dataType: 'json',
        streaming: true,
        cb: function(e, data) {
            if (e) {
                self.emit('error', e);
                return;
            }
            if (data.friends) {
                self.emit('friends', data.friends);
            } else if (data.event) {
                self.emit('event', data);
            } else if (data.text) {
                self.emit('tweet', data);
            } else {
                self.emit('other', data);
            }
        }
    });
};


// main 
(function() {
    var config = new Config(path.join(__dirname, 'config.json'));

    if (config.log.file) {
        log.setFile(path.join(__dirname, config.log.file));
    }
    log.setLevel(config.log.level);
    var logger = log.createLogger('main');

    var login = new OAuthLogin(config.token, function(e, token) {
        if (e) {
            throw e;
        }
        if (token) {
            config.token = token;
            config.write();
        }
        console.log('login success: ', config.token.screen_name);
        logger.info('login success: ', config.token.screen_name);

        var us = new Userstream(config.token);
        if (config.cli.enable) {
            var cli = require('./cli.js');
            cli.setTheme(config.cli.theme);
            cli.attachStream(us);
        }

        if (config.wsi.enable) {
            var wsi = require('./wsi.js');
            wsi.attachStream(us);
            wsi.setBufferSize(config.wsi.buffer_size);
        }
    });

})();


