(function() {
    var colors = require('colors');

    var makeEntities = function(text, entities) {
        if (!entities) {
            return text;
        }

        var all = [];
        if (entities.urls) {
            all = all.concat(entities.urls);
        }
        if (entities.hashtags) {
            all = all.concat(entities.hashtags);
        }
        if (entities.user_mentions) {
            all = all.concat(entities.user_mentions);
        }
        if (entities.media) {
            all = all.concat(entities.media);
        }
        all.sort(function(x, y) {
            return x.indices[0] - y.indices[0];
        });

        var retStr = '';
        if (all.length == 0) {
            retStr = text;
        } else {
            var last = 0;
            all.forEach(function(v) {
                retStr += text.slice(last, v.indices[0]);
                if (v.url) { // url or media
                    var realurl = v.expanded_url ? v.expanded_url : v.url;
                    if (!/^https?:\/\//.test(realurl)) {
                        realurl = 'http://' + realurl;
                    }
                    retStr += realurl.url;
                } else if (v.text) { // hashtag
                    retStr += ('#' + v.text).tag;
                } else if (v.screen_name) { // user_mention
                    retStr += ('@' + v.screen_name).user;
                }

                last = v.indices[1];
            });
            retStr += text.slice(last);
        }

        return retStr;
    }


    var onError = function(e) {
        console.log('error happens:', e);
    };

    var onFriends = function(f) {
        console.log('recved friends:', f);
    };

    var onTweet = function(t) {
        console.log(t.user.screen_name.author.bold, makeEntities(t.text, t.entities));
    };

    var onEvent = function(e) {
        console.log('recved event:', e);
    };

    var onOther = function(o) {
        console.log('recved other:', o);
    };

    var cli = {};
    cli.attachStream = function(us) {
        us.on('error', onError);
        us.on('friends', onFriends);
        us.on('tweet', onTweet); 
        us.on('event', onEvent);
        us.on('other', onOther);
    };

    cli.setTheme = function(theme) {
        if (theme) {
            colors.setTheme(theme);
        } else { // set a default one
            colors.setTheme({
                author: 'inverse',
                url: 'yellow',
                tag: 'red',
                user: 'green',
            });
        }
    }

    // exports
    var root = this;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = cli;
    } else if (!root.cli) {
        root.cli = cli;
    }

})();


