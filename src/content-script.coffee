@log = (args...) ->

    chrome.extension.sendRequest action: 'console', fn: 'info', args

@cs = {}

jQuery ($) ->

    enableFu = yes
    keyComboMap = {}

    mask = {}
    maskVars = [
        'window'
        'document'
        'chrome'
        'cs'
    ]

    for v in maskVars
        mask[v] = undefined

    chrome.extension.sendRequest { action: 'getHotkeys' }, (hotkeys) ->

        log 'got hotkeys'
        loc = window.location.toString()

        $.each hotkeys, (id, keyData) ->

            allow = no

            chrome.extension.sendRequest { action: 'getGlobalFilters' }, (filters) ->

                allFilters = keyData.filters.concat(filters)

                for pat in allFilters
                    isNegativePattern = pat[0] is '-'
                    log 'matching with pattern', pat
                    pat = pat[1..] if isNegativePattern
                    re = new RegExp globToRegex pat
                    log 'regex is', re
                    if loc.match re
                        allow = not isNegativePattern
                        break

                if not allow
                    log 'allow is false'
                    return

                keyData.id = id
                keyComboMap[keyData.keyc] = keyData
                log 'combo map', keyData.keyc, keyData

    keyQueue =

        q: ''
        display: $('<div id=keyboardFuQueue />').appendTo('body')

        push: (combo) ->
            keyQueue.q += combo
            keyQueue.updateDisplay()

        clear: ->
            keyQueue.q = ''
            keyQueue.updateDisplay()

        updateDisplay: ->
            if keyQueue.q.length
                keyQueue.display.text(keyQueue.q).addClass('active')
            else
                keyQueue.display.removeClass('active')

    # Key binding functionality
    keyHandler = (e) ->

        # Return if keyboard-fu is disabled
        return unless enableFu

        # Don't fire in text-accepting inputs that we didn't directly bind to
        return if this isnt e.target and (
                /textarea|select/i.test(e.target.nodeName) or
                /text|search|tel|url|email|password/i.test(e.target.type) or
                typeof $(e.target).attr('contenteditable') isnt 'undefined')

        # ESC key
        if e.which is 27
            if keyQueue.q.length > 0
                keyQueue.clear()
                return

            fuPopups = $('div.fu-popup:visible')
            if fuPopups.length > 0
                fuPopups.hide()

            return

        combo = readKeyCombo(e)
        checkAndPush(combo) if combo

    document.addEventListener 'keydown', keyHandler
    document.addEventListener 'keypress', keyHandler

    executeAction = (keyc) ->
        (new Function('with (this) { ' + keyComboMap[keyc].code + ' }')).call(mask)

    # Used for clearing timed-out sequence hotkeys
    keyExpiryCode = 0

    checkAndPush = (combo) ->

        log 'checkAndPush', combo

        totalCombo = keyQueue.q + combo

        # Invalidate the last started timer to clear the queue, if any
        keyExpiryCode++

        log 'totalCombo', totalCombo

        # Check if we have a valid prefix, if so, add it to the queue and
        # start a timer to clear it
        isPrefix = no
        for keyc, keyData of keyComboMap
            if keyc.length > totalCombo.length and keyc[...totalCombo.length] is totalCombo
                isPrefix = yes
                break

        if isPrefix
            keyQueue.push(combo)
            setTimeout( ((_keyExpiryCode) -> ->
                return if keyExpiryCode isnt _keyExpiryCode
                executeAction(keyQueue.q) if keyQueue.q of keyComboMap
                keyQueue.clear()
                log 'emptied keyQueue'
            )(keyExpiryCode), 2200)
        else
            if totalCombo of keyComboMap
                # If we have a complete key combination, execute it and clear the queue
                log 'executing', totalCombo
                executeAction(totalCombo)
            keyQueue.clear()

        log 'key queue', keyQueue.q

    refElem = null
    cs.toggleKeyReference = ->
        if refElem is null
            refElem = $('<div id=fuKeyRef class=fu-popup style=display:none />').appendTo 'body'
            markup = ''

            for keyc, kdata of keyComboMap
                markup += "<div class=fu-key-item><span class=fu-refbox-desc>#{kdata.desc}</span><code class=fu-refbox-keyc>#{htmlentities keyc}</code></div>"

            refElem.html(markup)

        refElem.toggle()

    cs.toggleKeyboardFu = ->
        enableFu = not enableFu
