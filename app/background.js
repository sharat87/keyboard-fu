jQuery(function ($) {

    // TODO
    // Grab undo-close-tab functionality from http://code.google.com/p/recently-closed-tabs/source/browse/trunk/background.html
    // Add Bespin/Skywriter to the javascript code editing experience
    // Save as new button in hotkey editing form
    // Import/Export hotkeys

    var specialKeys = {
        8: "BackSpace", 9: "Tab", 13: "Return", 16: "Shift", 17: "Ctrl", 18: "Alt", 19: "Pause",
        20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home",
        37: "Left", 38: "Up", 39: "Right", 40: "Down", 45: "Insert", 46: "Del",
        96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
        104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
        112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8",
        120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "Scroll", 191: "/", 224: "Meta"
    };

    var modifiers = { '<Ctrl>': true, '<Alt>': true, '<Shift>': true, '<Meta>': true };

    var shiftNums = {
        "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
        "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
        ".": ">",  "/": "?",  "\\": "|"
    };

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

        readKeyCombo: function (request, sender, sendResponse) {
            sendResponse(readKeyCombo(request.edata, request.isInputSource));
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

    var keyStore = {

        defaultHotkeys: {
            1: { keyc: 'j', desc: 'Scroll down', code: 'fu.scrollDown()', allow: [] },
            2: { keyc: 'k', desc: 'Scroll up', code: 'fu.scrollUp()', allow: [] },
            3: { keyc: 'h', desc: 'Scroll left', code: 'fu.scrollLeft()', allow: [] },
            4: { keyc: 'l', desc: 'Scroll right', code: 'fu.scrollRight()', allow: [] },
            5: { keyc: 'gg', desc: 'Go to top', code: 'fu.scrollToTop()', allow: [] },
            6: { keyc: 'G', desc: 'Go to bottom', code: 'fu.scrollToBottom()', allow: [] },
            7: { keyc: 'gj', desc: 'Scroll down big', code: 'fu.scrollDown(370)', allow: [] },
            8: { keyc: 'gk', desc: 'Scroll up big', code: 'fu.scrollUp(370)', allow: [] },
            9: { keyc: 'L', desc: 'Next tab', code: 'fu.tabNext()', allow: [] },
            10: { keyc: 'H', desc: 'Previous tab', code: 'fu.tabPrevious()', allow: [] },
            11: { keyc: 'N', desc: 'Move tab left', code: 'fu.tabLeft()', allow: [] },
            12: { keyc: 'M', desc: 'Move tab right', code: 'fu.tabRight()', allow: [] },
            13: { keyc: '<C-x>', desc: 'Close tab', code: 'fu.tabClose()', allow: [] },
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

    // Mine a minimal event object and create a string that represents the keypress
    // in vim/emacs like syntax
    function readKeyCombo(edata, isInputSource) {

        // Keypress represents characters, not special keys
        var special = edata.type !== "keypress" && specialKeys[edata.which],
            character = String.fromCharCode(edata.which).toLowerCase(),
            hasShift, hasCtrl, hasAlt, hasMeta, modif = '', combo;

        // check combinations (alt|ctrl|shift+anything)
        hasAlt = edata.altKey && special !== "alt";
        hasCtrl = edata.ctrlKey && special !== "ctrl";
        hasShift =  edata.shiftKey && special !== "shift";

        // TODO: Need to make sure this works consistently across platforms
        hasMeta =  edata.metaKey && !edata.ctrlKey && special !== "meta";

        modif = '<' + (hasShift && special ? 'S-' : '') + (hasCtrl ? 'C-' : '') + (hasAlt ? 'A-' : '') + (hasMeta ? 'M-' : '');
        modif = modif == '<' ? '' : modif;

        if (special) {
            combo = modif + special;
        } else {
            combo = modif + (hasShift ? (shiftNums[character] || character.toUpperCase()) : character);
        }

        if (modif) {
            combo += '>';
        } else if (special) {
            combo = '<' + combo + '>';
        }

        console.info('combo', edata.type, special, combo, 'and combo is', combo);
        if (isInputSource) {
            if (!modifiers[combo]) {
                return combo;
            }
        } else {
            if (edata.type == 'keypress' || (!special && combo[0] == '<')) {
                return combo;
            }
        }

        return '';

    }

    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        return;
        chrome.tabs.get(tabId, function (tab) {
                console.info('closed tab', tab);
        });
    });

    // Switch tab by `count` tabs. If count is 1, goes to next tab, if it is -1, goes to previous tab.
    // Does not wrap
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

    // Gives a string that is a regex representation of the given glob pattern
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

});
