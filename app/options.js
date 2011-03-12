jQuery(function ($) {

    var hotkeys, nextId = 1,
        keyList = $('#keyList'),
        keyBox = $('#keyBox'),
        keyForm = $('#keyForm'),
        keyFormControls = $('#keyFormControls'),
        keyFormStatus = keyFormControls.find('.status');

    function loadHotkeys(selectedKeyId) {
        chrome.extension.sendRequest({ action: 'getHotkeys' }, function (_hotkeys) {
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
                // '<label><span class=title>Hotkey</span><input type=text class="keyc-input text" data-keyc="" /><a href="#" class=keyc-clear-btn>Clear</a></label>' +
                '<div><span class=title>Hotkey</span><span type=text class="keyc-display text" data-keyc=""></span>' +
                    '<button class=keyc-capture-btn>Capture</button><button class=keyc-uncapture-btn style=display:none>Stop Capture</button><button class=keyc-clear-btn>Clear</button></div>' +
                '<label><span class=title>Description</span><input type=text class="desc-input text" /></label>' +
                '<label><span class=title>Code to execute</span><textarea rows=10 class="code-input text" /></label>' +
                '<label><span class=title>Url filter (Global filters will be added to the end of this list)</span><textarea rows=7 class="filters-input text" /> one pattern per line';

        keyForm.html(keyBoxMarkup);

        if (id) {
            var keyData = hotkeys[id];
            keyForm.find('span.keyc-display').text(keyData.keyc);
            keyForm.find('input.desc-input').val(keyData.desc);
            keyForm.find('textarea.code-input').val(keyData.code);
            keyForm.find('textarea.filters-input').val(keyData.filters.join('\n'));
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

    var keycCapture = false;

    function keyHandler(e) {

        if (!keycCapture) return;

        e.stopPropagation();

        keyForm.find('span.keyc-display').text(function (i, oldVal) {
            return oldVal + readKeyCombo(e, true);
        });

    }

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keypress', keyHandler);

    keyForm
        .delegate('button.keyc-capture-btn, button.keyc-uncapture-btn', 'click', function (e) {
            keycCapture = !keycCapture;
            keyForm.find('span.keyc-display').toggleClass('capturing');
            keyForm.find('input.text, textarea')[keycCapture ? 'attr' : 'removeAttr']('disabled', 1);
            $(this).hide().siblings('button.keyc-capture-btn, button.keyc-uncapture-btn').show();
        })
        .delegate('button.keyc-clear-btn', 'click', function (e) {
            keyForm.find('span.keyc-display').text('');
        });

    $('#saveKeyBtn').click(function (e) {
        var th = $(this), id = keyForm.find('input.id-input').val();

        if (!hotkeys[id]) {
            hotkeys[id] = {};
        }

        hotkeys[id].keyc = keyForm.find('input.keyc-input').val();
        hotkeys[id].desc = keyForm.find('input.desc-input').val();
        hotkeys[id].code = keyForm.find('textarea.code-input').val();
        hotkeys[id].filters = keyForm.find('textarea.filters-input').val().split('\n');
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

    function loadGlobalFilters() {
        chrome.extension.sendRequest({ action: 'getGlobalFilters' }, function (filters) {
            $('#globalFilterInput').val(filters.join('\n'));
        });
    }

    var globalFilterBox = $('#globalFilterBox');
    $('#globalFiltersBtn').click(function (e) {
        loadGlobalFilters();
        globalFilterBox.show().siblings('div.box').hide();
    });

    $('#globalFilterSaveBtn').click(function (e) {
        chrome.extension.sendRequest({ action: 'setGlobalFilters', filters: $('#globalFilterInput').val() }, function (response) {
            loadGlobalFilters();
            th.after(response.ok ? '<span>Saved successfully.</span>' : '<span>Saving failed. Please try again later.</span>')
                .next().delay(2000).fadeOut(1000);
        });
    });

    $('#bottomControls').delegate('a', 'click', function (e) {
        e.preventDefault();
        keyList.find('a.selected').removeClass('selected');
    });

    var docBox = $('#docBox').load('doc/api.html');
    $('#docBtn').click(function (e) {
        docBox.show().siblings('div.box').hide();
    });

    var ieBox = $('#ieBox')
        .delegate('.import-btn', 'click', function (e) {
            var th = $(this);
            chrome.extension.sendRequest({ action: 'importHotkeys', content: $('#importBox').val() }, function (response) {
                loadHotkeys();
                th.after(response.ok ? '<span>Import successful.</span>' : '<span>Import failed. Please try again later.</span>')
                    .next().delay(2000).fadeOut(1000);
            });
        });
    $('#ieBtn').click(function (e) {
        chrome.extension.sendRequest({ action: 'exportHotkeys' }, function (content) {
            $('#exportBox').val(content);
        });
        ieBox.show().siblings('div.box').hide();
    });

});
