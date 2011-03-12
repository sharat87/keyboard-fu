var _console = (function () {

    function _log(fn) {
        return function () {
            chrome.extension.sendRequest({ action: 'console', fn: fn, args: [].slice.call(arguments, 0) });
        };
    }

    return {
        log: _log('log'),
        info: _log('info'),
        debug: _log('debug'),
        error: _log('error')
    };

}());

jQuery(function ($) {

    var keyComboMap = {};

    var mask = (function () {
        var mask = {}, maskVars = [
            'window',
            'document',
            'chrome'
        ];

        for (var i = 0, l = maskVars.length; i < l; i++) {
            mask[maskVars[i]] = undefined;
        }

        return mask;
    }());

    chrome.extension.sendRequest({ action: 'getHotkeys' }, function (hotkeys) {

        console.info('got hotkeys');
        var loc = window.location.toString();

        $.each(hotkeys, function (id, keyData) {

            var allow = false, i = 0, l = keyData.filters.length;
            while (i < l) {
                var pat = keyData.filters[i++], isNegativePattern = pat[0] == '-';
                console.info('matching with pattern', pat);
                if (isNegativePattern) {
                    pat = pat.substr(1);
                }
                if (loc.match(new RegExp(globToRegex(pat))) !== null) {
                    allow = isNegativePattern;
                    break;
                }
            }

            if (!allow) {
                chrome.extension.sendRequest({ action: 'getGlobalFilters' }, function (filters) {

                    var i = 0, l = filters.length;

                    while (i < l) {
                        var pat = filters[i++], isNegativePattern = pat[0] == '-';
                        console.info('matching with pattern', pat);
                        if (isNegativePattern) {
                            pat = pat.substr(1);
                        }
                        console.info('regex is', new RegExp(globToRegex(pat)), loc);
                        if (loc.match(new RegExp(globToRegex(pat))) !== null) {
                            console.info('match successful');
                            allow = !isNegativePattern;
                            break;
                        }
                    }

                    if (!allow) {
                        console.info('allow is false');
                        return;
                    }

                    keyData.id = id;
                    keyComboMap[keyData.keyc] = keyData;
                    console.info('combo map', keyData.keyc, keyData);

                });
            }

        });

        console.info('keyComboMap', keyComboMap);

    });

    var keyQueue = {

        q: '',
        display: $('<div id=keyboardFuQueue />').appendTo('body'),

        push: function (combo) {
            keyQueue.q += combo;
            keyQueue.updateDisplay();
        },

        clear: function () {
            keyQueue.q = '';
            keyQueue.updateDisplay();
        },

        updateDisplay: function () {
            if (keyQueue.q.length) {
                keyQueue.display.text(keyQueue.q).addClass('active');
            } else {
                keyQueue.display.removeClass('active');
            }
        }

    };

    // Key binding functionality
    $(document).bind('keydown keypress', function (e) {

        // Don't fire in text-accepting inputs that we didn't directly bind to
        if (this !== e.target && (/textarea|select/i.test(e.target.nodeName) || /text|password/i.test(e.target.type) ||
                                  typeof $(e.target).attr('contenteditable') !== 'undefined')) {
            return;
        }

        console.info('key event:', e.type, e);
        if (e.type == 'keyup') return;

        // ESC key
        if (e.which == 27) {
            keyQueue.clear();
            return;
        }

        var edata = {
            type: e.type,
            which: e.which,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey
        };

        chrome.extension.sendRequest({ action: 'readKeyCombo', edata: edata, isInputSource: false }, function (combo) {
            combo && checkAndPush(combo);
        });

    });

    function executeAction(keyc) {
        (new Function('with (this) { ' + keyComboMap[keyc].code + ' }')).call(mask);
    }

    // Used for clearing timed-out sequence hotkeys
    var keyExpiryCode = 0;

    function checkAndPush(combo) {

        console.info('checkAndPush', combo);

        var totalCombo = keyQueue.q + combo;

        // Invalidate the last started timer to clear the queue, if any
        keyExpiryCode += 1;

        console.info('totalCombo', totalCombo);

        // Check if we have a valid prefix, if so, add it to the queue and
        // start a timer to clear it
        isPrefix = false;
        for (var keyc in keyComboMap) {
            if (keyc.length > totalCombo.length &&
                    keyc.substr(0, totalCombo.length) == totalCombo) {
                isPrefix = true;
                break;
            }
        }

        if (isPrefix) {
            keyQueue.push(combo);
            setTimeout(function (_keyExpiryCode) { return function () {
                if (keyExpiryCode != _keyExpiryCode) return;
                if (keyComboMap[keyQueue.q]) executeAction(keyQueue.q);
                keyQueue.clear();
                console.info('emptied keyQueue');
            }}(keyExpiryCode), 2200);
        } else {
            if (keyComboMap[totalCombo]) {
                // If we have a complete key combination, execute it and clear the queue
                console.info('executing', totalCombo);
                executeAction(totalCombo);
            }
            keyQueue.clear();
        }

        console.info('key queue', keyQueue.q);

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
