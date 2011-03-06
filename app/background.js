jQuery(function ($) {

    // TODO
    // Grab undo-close-tab functionality from http://code.google.com/p/recently-closed-tabs/source/browse/trunk/background.html
    // Add Bespin/Skywriter to the javascript code editing experience
    // Save as new button in hotkey editing form
    // Import/Export hotkeys

    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
        actions[request.action](request, sender, sendResponse);
    });

    var actions = {

        alert: function (request, sender, sendResponse) {
            console.info('alert request made');
            alert(request.message);
        },

        getHotkeys: function (request, sender, sendResponse) {
            console.info('hotkeys get request made');
            sendResponse(keyStore.load(request.urlsAsGlobs));
        },

        setHotkeys: function (request, sender, sendResponse) {
            console.info('hotkeys save request made');
            keyStore.dump(request.hotkeys);
            sendResponse({ ok: true });
        },

        tabSwitchBy: function (request, sender, sendResponse) {
            console.info('tabSwitch request made');
            tabSwitchBy(request.count);
        },

        tabMoveBy: function (request, sender, sendResponse) {
            console.info('tabMove request made');
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.move(tab.id, { index: tab.index + request.count });
            });
        },

        tabClose: function (request, sender, sendResponse) {
            console.info('tabClose request made');
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.remove(tab.id);
            });
        }

    };

    var nextId = 1, keyStore = {

        defaultHotkeys: {
            1: { keyc: 'j', desc: 'Scroll down', code: 'fu.scrollDown()', allow: [] },
            2: { keyc: 'k', desc: 'Scroll up', code: 'fu.scrollUp()', allow: [] },
            3: { keyc: 'h', desc: 'Scroll left', code: 'fu.scrollLeft()', allow: [] },
            4: { keyc: 'l', desc: 'Scroll right', code: 'fu.scrollRight()', allow: [] },
            5: { keyc: 'g', desc: 'Go to top', code: 'fu.scrollToTop()', allow: [] },
            6: { keyc: 'Shift+g', desc: 'Go to bottom', code: 'fu.scrollToBottom()', allow: [] },
            7: { keyc: 'Shift+j', desc: 'Scroll down big', code: 'fu.scrollDown(370)', allow: [] },
            8: { keyc: 'Shift+k', desc: 'Scroll up big', code: 'fu.scrollUp(370)', allow: [] },
            9: { keyc: 'Shift+l', desc: 'Next tab', code: 'fu.tabNext()', allow: [] },
            10: { keyc: 'Shift+h', desc: 'Previous tab', code: 'fu.tabPrevious()', allow: [] },
            11: { keyc: 'Shift+n', desc: 'Move tab left', code: 'fu.tabLeft()', allow: [] },
            12: { keyc: 'Shift+m', desc: 'Move tab right', code: 'fu.tabRight()', allow: [] },
            13: { keyc: 'x', desc: 'Close tab', code: 'fu.tabClose()', allow: [] },
            14: { keyc: 't', desc: 'Just a test', code: 'alert(\'passed\')', allow: ['http://*.google.com/*'] }
        },

        // Storage data strucutre:
        // Eack hotkey is an array of the form,
        //   [id, keyc, desc, code, allow[]]
        // localStorage.hotkeys is an array of these arrays

        load: function (urlsAsGlobs) {
            if (!localStorage.hotkeys) {
                keyStore.dump(keyStore.defaultHotkeys);
            }
            var rawHotkeys = JSON.parse(localStorage.hotkeys),
                hotkeys = {}, i = 0, l = rawHotkeys.length;
            while (i < l) {
                var rh = rawHotkeys[i++], allowUrls = rh[4];
                if (!urlsAsGlobs) {
                    allowUrls = [];
                    for (var j = 0, m = rh[4].length; j < m; j++) {
                        var glob = rh[4][j], regex = globToRegex(glob);
                        console.info('glob', glob, '=> regex', regex);
                        allowUrls.push(regex);
                    }
                }
                hotkeys[rh[0]] = {
                    keyc: rh[1],
                    desc: rh[2],
                    code: rh[3],
                    allow: allowUrls
                };
            }
            return hotkeys;
        },

        dump: function (hotkeys) {
            var rawHotkeys = [];
            $.each(hotkeys, function (i, keyData) {
                rawHotkeys.push([i, keyData.keyc, keyData.desc, keyData.code, keyData.allow]);
            });
            localStorage.hotkeys = JSON.stringify(rawHotkeys);
        }

    };

    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        return;
        chrome.tabs.get(tabId, function (tab) {
                console.info('closed tab', tab);
        });
    });

    function tabSwitchBy(count) {
        chrome.tabs.getSelected(null, function (tab) {
            var newIndex = tab.index + count;
            chrome.tabs.getAllInWindow(null, function (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].index == newIndex) {
                        chrome.tabs.update(tabs[i].id, { selected: true });
                        break;
                    }
                }
            });
        });
    }

    function urlGlobToRegex(url) {
        url = $.trim(url);
        if (url === '*') {
            return /./i;
        }
        var m = url.match(/^(\*|http|https|file|ftp):\/\/(\*|\*\.[^\/\*]+|[^\/\*]+)(\/.*)$/);
        console.info(m);
        if (m == null) return null;
        var scheme = m[1], host = m[2], path = m[3];
        return '^' +
            (scheme == '*' ? '(http|https|file|ftp)' : '(' + scheme + ')') +
            '://' +
            (host == '*' ? '(.*)' : '([^\\.]*?' + host.substr(1) + ')') +
            path.replace(/\*/, '.*?') +
            '$';
    }

    function globToRegex(line) {
        console.info("got line [" + line + "]");
        line = $.trim(line);
        
        var sb = [];
        
        // Remove beginning and ending * globs because they're useless
        if (line.length > 1 && line[0] === "*") {
            line = line.substring(1);
        }
        if (line.length > 1 && line[line.length-1] === "*") {
            line = line.substring(0, line.length - 1);
        }
        
        var i = 0, len = line.length,
            escaping = false, inCurlies = 0;
        
        while (i < len) {
            var currentChar = line[i++];
            switch (currentChar) {
            case '*':
                sb.push(escaping ? "\\*" : ".*");
                escaping = false;
                break;
            case '?':
                sb.push(escaping ? "\\?" : ".");
                escaping = false;
                break;
            case '.':
            case '(':
            case ')':
            case '+':
            case '|':
            case '^':
            case '$':
            case '@':
            case '%':
                sb.push('\\');
                sb.push(currentChar);
                escaping = false;
                break;
            case '\\':
                escaping && sb.push("\\\\");
                escaping = !escaping;
                break;
            case '{':
                sb.push(escaping ? '\\{' : '(');
                if (!escaping) {
                    inCurlies++;
                }
                escaping = false;
                break;
            case '}':
                if (inCurlies > 0 && !escaping) {
                    sb.push(')');
                    inCurlies--;
                } else if (escaping) {
                    sb.push("\\}");
                } else {
                    sb.push("}");
                }
                escaping = false;
                break;
            case ',':
                if (inCurlies > 0 && !escaping) {
                    sb.push('|');
                } else if (escaping) {
                    sb.push("\\,");
                } else {
                    sb.push(",");
                }
                break;
            default:
                escaping = false;
                sb.push(currentChar);
            }
        }
        return sb.join('');
    }

    function parseHotkey(skey) {
        keySequence = [];
        while (skey.length) {
            var m = skey.match(/^(<(([scam]-)+.|Space|CR|PgUp|PgDown)>)|./i);
            if (m === null) return null;
            keySequence.push(m[0]);
        }
        return keySequence;
    }

});
