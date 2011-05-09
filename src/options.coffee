hotkeys = null
nextId = 1
keyList = $('#keyList')
keyBox = $('#keyBox')
keyForm = $('#keyForm')
keyFormControls = $('#keyFormControls')
keyFormStatus = keyFormControls.find('.status')

loadHotkeys = (selectedKeyId) ->
    chrome.extension.sendRequest { action: 'getHotkeys' }, (_hotkeys) ->
        hotkeys = _hotkeys
        keyList.empty()
        $.each hotkeys, (id, keyData) ->
            id = parseInt id, 10
            el = $("""<a href="#" class="hotkey-item#{if id == selectedKeyId then ' selected' else ''}">
                          <code class=keyc></code><span class=desc></span>
                      </a>""").appendTo(keyList)
            el.data('key-id', id)
            el.data('key-data', keyData)
            el.children('.keyc').text(keyData.keyc)
            el.children('.desc').text(keyData.desc)
            nextId++ if nextId is id

loadKeyForm = (id) ->
    
    keyBoxMarkup = """<input type=hidden class=id-input value="#{id or nextId}" />
            <div><span class=title>Hotkey</span><span type=text class="keyc-display text" data-keyc=""></span>
                <button class=keyc-capture-btn>Capture</button><button class=keyc-uncapture-btn style=display:none>Stop Capture</button><button class=keyc-clear-btn>Clear</button></div>
            <label><span class=title>Description</span><input type=text class="desc-input text" /></label>
            <label><span class=title>Code to execute</span><textarea rows=10 class="code-input text" /></label>
            <label><span class=title>Url filter (Global filters will be added to the end of this list)</span><textarea rows=7 class="filters-input text" /> one pattern per line"""

    keyForm.html keyBoxMarkup

    if id
        keyData = hotkeys[id]
        keyForm.find('span.keyc-display').text keyData.keyc
        keyForm.find('input.desc-input').val keyData.desc
        keyForm.find('textarea.code-input').val keyData.code
        keyForm.find('textarea.filters-input').val keyData.filters.join('\n')

    keyBox.show().siblings('.box').hide()

keyList.delegate 'a.hotkey-item', 'click', (e) ->
    e.preventDefault()
    th = $(this)
    id = th.data('key-id')
    th.addClass('selected').siblings().removeClass('selected')
    loadKeyForm(id)

$('#newKeyBtn').click (e) ->
    e.preventDefault()
    keyList.find('a.selected').removeClass('selected')
    loadKeyForm()

keycCapture = off

keyHandler = (e) ->

    return unless keycCapture

    e.stopPropagation()

    keyForm.find('span.keyc-display').text (i, oldVal) ->
        return oldVal + readKeyCombo(e, yes)

document.addEventListener('keydown', keyHandler)
document.addEventListener('keypress', keyHandler)

keyForm.delegate 'button.keyc-clear-btn', 'click', (e) -> keyForm.find('span.keyc-display').text('')
keyForm.delegate 'button.keyc-capture-btn, button.keyc-uncapture-btn', 'click', (e) ->
    keycCapture = not keycCapture
    keyForm.find('span.keyc-display').toggleClass('capturing')
    keyForm.find('input.text, textarea')[if keycCapture then 'attr' else 'removeAttr']('disabled', 1)
    $(this).hide().siblings('button.keyc-capture-btn, button.keyc-uncapture-btn').show()

$('#saveKeyBtn').click (e) ->
    id = keyForm.find('input.id-input').val()

    if not hotkeys[id]
        hotkeys[id] = {}

    hotkeys[id].keyc = keyForm.find('span.keyc-display').text()
    hotkeys[id].desc = keyForm.find('input.desc-input').val()
    hotkeys[id].code = keyForm.find('textarea.code-input').val()
    hotkeys[id].filters = keyForm.find('textarea.filters-input').val().split('\n')
    saveHotkeys()

$('#saveNewKeyBtn').click (e) ->
    keyForm.find('input.id-input').val nextId
    $('#saveKeyBtn').click()

$('#delKeyBtn').click (e) ->
    id = keyForm.find('input.id-input').val()
    delete hotkeys[id]
    saveHotkeys()

saveHotkeys = ->
    chrome.extension.sendRequest { action: 'setHotkeys', hotkeys: hotkeys }, (response) ->
        msg = if response.ok then 'Saved successfully' else 'Error saving. Please try again later.'
        keyFormStatus.html(msg).delay(2000).fadeOut(1000)
    loadHotkeys(keyList.find('a.selected').data('key-id') or nextId)

loadHotkeys()

loadGlobalFilters = ->
    chrome.extension.sendRequest { action: 'getGlobalFilters' }, (filters) ->
        $('#globalFilterInput').val(filters.join('\n'))

globalFilterBox = $('#globalFilterBox')
$('#globalFiltersBtn').click (e) ->
    loadGlobalFilters()
    globalFilterBox.show().siblings('div.box').hide()

$('#globalFilterSaveBtn').click (e) ->
    chrome.extension.sendRequest { action: 'setGlobalFilters', filters: $('#globalFilterInput').val() }, (response) ->
        loadGlobalFilters()
        msg = if response.ok then '<span>Saved successfully.</span>' else '<span>Saving failed. Please try again later.</span>'
        th.after(msg).next().delay(2000).fadeOut(1000)

$('#bottomControls').delegate 'a', 'click', (e) ->
    e.preventDefault()
    keyList.find('a.selected').removeClass('selected')

$('a[target=_blank]').click  (e) ->
    window.open chrome.extension.getURL($(this).attr('href'))

ieBox = $('#ieBox')
ieBox.delegate '.import-btn', 'click', (e) ->
    th = $(this)
    chrome.extension.sendRequest { action: 'importHotkeys', content: $('#importBox').val() }, (response) ->
        loadHotkeys()
        msg = if response.ok then '<span>Import successful.</span>' else '<span>Import failed. Please try again later.</span>'
        th.after(msg).next().delay(2000).fadeOut(1000)

$('#ieBtn').click (e) ->
    chrome.extension.sendRequest { action: 'exportHotkeys' }, (content) -> $('#exportBox').val(content)
    ieBox.show().siblings('div.box').hide()
