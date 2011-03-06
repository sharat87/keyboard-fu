jQuery(function ($) {

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

    chrome.extension.sendRequest({ action: 'getHotkeys', urlsAsGlobs: false }, function (hotkeys) {
        console.info('got hotkeys');
        var loc = window.location.toString();
        $.each(hotkeys, function (id, keyData) {

            var allow = false, i = 0, l = keyData.allow.length;
            if (l == 0) {
                // No allow urls given, so allow all
                allow = true;
            } else {
                while (i < l) {
                    var pat = keyData.allow[i++];
                    if (loc.match(new RegExp(pat)) !== null) {
                        allow = true;
                        break;
                    }
                }
            }
            if (!allow) {
                return;
            }

            console.info('registering hotkey', keyData.keyc);
            $(document).bind('keydown', keyData.keyc, function (e) {
                (new Function('with (this) { ' + keyData.code + ' }')).call(mask);
            });
        });
    });

});
