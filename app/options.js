jQuery(function ($) {

    var hotkeys, nextId = 1,
        keyList = $('#keyList'),
        keyBox = $('#keyBox'),
        keyForm = $('#keyForm'),
        keyFormControls = $('#keyFormControls'),
        keyFormStatus = keyFormControls.find('.status');

    function loadHotkeys(selectedKeyId) {
        chrome.extension.sendRequest({ action: 'getHotkeys', urlsAsGlobs: true }, function (_hotkeys) {
            hotkeys = _hotkeys;
            keyList.empty();
            $.each(hotkeys, function (id, keyData) {
                keyList.append('<a href="#" class="hotkey-item' + (id == selectedKeyId ? ' selected' : '') + '">' +
                    '<code class=keyc></code><span class=desc></span>' +
                    '</a>')
                    .children('a.hotkey-item:last')
                    .data('key-id', id)
                    .data('key-data', keyData)
                    .children('.keyc').text(keyData.keyc).end()
                    .children('.desc').text(keyData.desc);
                if (nextId == id) {
                    nextId++;
                }
            });
        });
    }

    function loadKeyForm(id) {
        
        var keyBoxMarkup = '<input type=hidden class=id-input value=' + (id || nextId) + ' />' +
                '<label><span class=title>Hotkey</span><input type=text class="keyc-input text" data-keyc="" /><a href="#" class=keyc-clear-btn>Clear</a></label>' +
                '<label><span class=title>Description</span><input type=text class="desc-input text" /></label>' +
                '<label><span class=title>Code to execute</span><textarea rows=10 class="code-input text" /></label>' +
                '<label><span class=title>Url filter</span><input type=text class="allow-input text" /> separate patterns with <tt>;</tt></label>';

        keyForm.html(keyBoxMarkup);

        if (id) {
            var keyData = hotkeys[id];
            keyForm.find('input.keyc-input').val(keyData.keyc).data('keyc', keyData.keyc);
            keyForm.find('input.desc-input').val(keyData.desc);
            keyForm.find('textarea.code-input').val(keyData.code);
            keyForm.find('input.allow-input').val(keyData.allow.join('; '));
        }

        keyBox.show().siblings('.box').hide();

    }

    keyList.delegate('a.hotkey-item', 'click', function (e) {
        e.preventDefault();
        var th = $(this), id = th.data('key-id');
        th.addClass('selected').siblings().removeClass('selected');
        loadKeyForm(id);
    });

    $('#newKeyBtn').click(function (e) {
        e.preventDefault();
        keyList.find('a.selected').removeClass('selected');
        loadKeyForm();
    });

    keyForm
        .delegate('input.keyc-input', 'keydown keypress', function (e) {

            e.stopPropagation();
            e.preventDefault();

            var th = $(this);

            var edata = {
                type: e.type,
                which: e.which,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            };

            chrome.extension.sendRequest({ action: 'readKeyCombo', edata: edata, isInputSource: true }, function (combo) {
                var totalCombo = th.data('keyc') + combo;
                th.data('keyc', totalCombo);
                th.val(totalCombo);
            });

        })
        .delegate('a.keyc-clear-btn', 'click', function (e) {
            $(this).siblings('input.keyc-input').val('').data('keyc', '');
            e.preventDefault();
        });

    $('#saveKeyBtn').click(function (e) {
        var th = $(this), id = keyForm.find('input.id-input').val();

        if (!hotkeys[id]) {
            hotkeys[id] = {};
        }

        hotkeys[id].keyc = keyForm.find('input.keyc-input').val();
        hotkeys[id].desc = keyForm.find('input.desc-input').val();
        hotkeys[id].code = keyForm.find('textarea.code-input').val();
        hotkeys[id].allow = keyForm.find('input.allow-input').val().split(';');
        saveHotkeys();
    });

    $('#saveNewKeyBtn').click(function (e) {
        keyForm.find('input.id-input').val(nextId);
        $('#saveKeyBtn').click();
    });

    $('#delKeyBtn').click(function (e) {
        var th = $(this), id = keyForm.find('input.id-input').val();
        delete hotkeys[id];
        saveHotkeys();
    });

    function saveHotkeys() {
        chrome.extension.sendRequest({ action: 'setHotkeys', hotkeys: hotkeys }, function (response) {
            keyFormStatus.html(response.ok ? 'Saved successfully' : 'Error saving. Please try again later.')
                .delay(2000).fadeOut(1000);
        });
        loadHotkeys(keyList.find('a.selected').data('key-id') || nextId);
    }

    loadHotkeys();

    var docBox = $('#docBox').load('doc/api.html');
    $('#docBtn').click(function (e) {
        e.preventDefault();
        keyList.find('a.selected').removeClass('selected');
        docBox.show().siblings('div.box').hide();
    });

});
