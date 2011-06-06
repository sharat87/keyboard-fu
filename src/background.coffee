jQuery ($) ->

    appVersion = '0.3'

    checkVersion = ->
        version = localStorage.version or (if localStorage.hotkeys then '0.2' else null)
        if appVersion isnt version
            upgraders[version]?()

    upgraders =

        '0.2': ->

    chrome.extension.onRequest.addListener (request, sender, sendResponse) ->
        actions[request.action](request, sender, sendResponse)

    actions =

        alert: (request, sender, sendResponse) ->
            console.info 'alert request made'
            alert request.message

        console: (request) ->
            console[request.fn].apply(console, request.args)

        getHotkeys: (request, sender, sendResponse) ->
            console.info 'hotkeys get request made'
            sendResponse keyStore.load request.urlsAsGlobs

        setHotkeys: (request, sender, sendResponse) ->
            console.info 'hotkeys save request made'
            keyStore.dump request.hotkeys
            sendResponse ok: true

        importHotkeys: (request, sender, sendResponse) ->
            console.info 'hotkeys import request made'
            keyStore.import request.content
            sendResponse ok: true

        exportHotkeys: (request, sender, sendResponse) ->
            console.info 'hotkeys export request made'
            sendResponse keyStore.export()

        getGlobalFilters: (request, sender, sendResponse) ->
            console.info 'global fitlers set request made'
            sendResponse keyStore.loadGlobalFilters()

        setGlobalFilters: (request, sender, sendResponse) ->
            console.info 'global fitlers get request made'
            keyStore.dumpGlobalFilters request.filters
            sendResponse ok: true

        open: (request, sender, sendResponse) ->
            { resource, target, location } = request

            url = switch resource
                      when '!parent'
                          target or= 'here'
                          location.replace(/\/[^\/]+\/?$/, '')
                      when '!fu-options'
                          chrome.extension.getURL 'options.html'
                      when '!extensions'
                          'chrome://extensions'
                      when '!chrome-options'
                          'chrome://settings'
                      else
                          resource

            if target is 'here'
                sendResponse { url }
            else if target is 'window'
                chrome.windows.create { url }
            else
                chrome.tabs.create { url }

        openBookmark: (request, sender, sendResponse) ->
            console.info 'openBookmark request made'
            chrome.bookmarks.search request.name, (marks) ->
                url = null
                for mark in marks
                    if mark.title == request.name
                        url = mark.url
                        break

                if url?
                    sendResponse { url }
                else
                    alert "The bookmark '#{request.name}' does not exist or does not have a valid url"

        openBookmarkByPath: (request, sender, sendResponse) ->
            console.info 'openBookmarkByPath request made'

            {location, target} = request

            pathItems = location.split '/'
            console.info 'pathItems is', pathItems

            chrome.bookmarks.getTree (nodes) ->

                currentNodeList = nodes
                nodeToOpen = null

                while pathItems.length
                    item = pathItems.shift()
                    found = no

                    for n in currentNodeList
                        if n.title is item
                            found = yes
                            if pathItems.length is 0
                                nodeToOpen = n
                            else
                                currentNodeList = n.children
                                break

                    unless found
                        alert "The bookmark '#{request.name}' does not exist or does not have a valid url"

                unless nodeToOpen?
                    alert "Bookmark '#{request.name}' could not be found"
                    return

                url = nodeToOpen.url

                if url[..10] is 'javascript:'
                    chrome.tabs.executeScript null, code: unescape url[11..]
                else if target is 'here'
                    sendResponse { url }
                else if target is 'window'
                    chrome.windows.create { url }
                else
                    chrome.tabs.create { url }

        openNewTab: (request, sender, sendResponse) ->
            chrome.tabs.create {}

        tabSwitchBy: (request, sender, sendResponse) ->
            console.info 'tabSwitch request made'
            tabSwitchBy request.count

        tabMoveBy: (request, sender, sendResponse) ->
            console.info 'tabMove request made'
            chrome.tabs.getSelected null, (tab) ->
                chrome.tabs.move tab.id, { index: tab.index + request.count }

        tabClose: (request, sender, sendResponse) ->
            console.info 'tabClose request made'
            chrome.tabs.getSelected null, (tab) ->
                chrome.tabs.remove(tab.id)

        tabUndoClose: (request, sender, sendResponse) ->
            console.info 'tabUndoClose request made'
            if allClosedTabs.length
                {url, index} = allClosedTabs.pop()
                chrome.tabs.create { url, index }

    keyStore =

        defaultHotkeys:
            1: { keyc: 'j', desc: 'Scroll down', code: 'fu.scrollDown()', filters: [] }
            2: { keyc: 'k', desc: 'Scroll up', code: 'fu.scrollUp()', filters: [] }
            3: { keyc: 'h', desc: 'Scroll left', code: 'fu.scrollLeft()', filters: [] }
            4: { keyc: 'l', desc: 'Scroll right', code: 'fu.scrollRight()', filters: [] }
            5: { keyc: 'gg', desc: 'Go to top', code: 'fu.scrollToTop()', filters: [] }
            6: { keyc: 'G', desc: 'Go to bottom', code: 'fu.scrollToBottom()', filters: [] }
            7: { keyc: 'gj', desc: 'Scroll down big', code: 'fu.scrollDown(370)', filters: [] }
            8: { keyc: 'gk', desc: 'Scroll up big', code: 'fu.scrollUp(370)', filters: [] }
            9: { keyc: 'L', desc: 'Next tab', code: 'fu.tabNext()', filters: [] }
            10: { keyc: 'H', desc: 'Previous tab', code: 'fu.tabPrevious()', filters: [] }
            11: { keyc: 'N', desc: 'Move tab left', code: 'fu.tabLeft()', filters: [] }
            12: { keyc: 'M', desc: 'Move tab right', code: 'fu.tabRight()', filters: [] }
            13: { keyc: '<C-x>', desc: 'Close tab', code: 'fu.tabClose()', filters: [] }
            14: { keyc: 'u', desc: 'Undo close tab', code: 'fu.tabUndoClose()', filters: [] }
            15: { keyc: 'go', desc: 'Open Keyboard-fu options page', code: 'fu.open("!fu-options")', filters: [] }
            16: { keyc: 'o', desc: 'Go back', code: 'history.back()', filters: [] }
            17: { keyc: 'i', desc: 'Go forward', code: 'history.forward()', filters: [] }
            18: { keyc: 'gu', desc: 'Go up in the url', code: 'fu.open("!parent")', filters: [] }
            19: { keyc: 'gs', desc: 'View source of current page', code: 'fu.viewSource()', filters: [] }
            20: { keyc: 'gf', desc: 'Toggle Keyboard-fu in current tab', code: 'fu.toggleKeyboardFu()', filters: [] }
            21: { keyc: '?', desc: 'Toggle help box', code: 'fu.toggleKeyReference()', filters: ['http:#*.google.com/*'] }

        # Storage data strucutre:
        # Eack hotkey is an array of the form,
        #   [id, keyc, desc, code, filters[]]
        # localStorage.hotkeys is an array of these arrays

        load: ->
            if not localStorage.hotkeys
                keyStore.dump keyStore.defaultHotkeys
            rawHotkeys = JSON.parse localStorage.hotkeys
            hotkeys = {}
            for rh in rawHotkeys
                hotkeys[rh[0]] =
                    keyc: rh[1]
                    desc: rh[2]
                    code: rh[3]
                    filters: rh[4]
            hotkeys

        dump: (hotkeys) ->
            rawHotkeys = []
            $.each hotkeys, (i, keyData) ->
                rawHotkeys.push [i, keyData.keyc, keyData.desc, keyData.code, keyData.filters]
            localStorage.hotkeys = JSON.stringify rawHotkeys

        import: (content) ->
            importObj = JSON.parse content
            localStorage.clear()
            for key, val of importObj
                localStorage[key] = val

        export: ->
            JSON.stringify localStorage

        defaultGlobalFilters: [
            '-https:#mail.google.com/*'
            '-https:#reader.google.com/*'
            '*'
        ]

        loadGlobalFilters: ->
            if not localStorage.globalFilters
                keyStore.dumpGlobalFilters keyStore.defaultGlobalFilters
            JSON.parse localStorage.globalFilters

        dumpGlobalFilters: (filters) ->
            localStorage.globalFilters = JSON.stringify filters

    # Switch tab by `count` tabs. If count is 1, goes to next tab, if it is -1, goes to previous tab.
    # Does not wrap
    tabSwitchBy = (count) ->
        chrome.tabs.getSelected null, (tab) ->
            newIndex = tab.index + count
            chrome.tabs.getAllInWindow null, (tabs) ->
                for tab in tabs
                    if tab.index is newIndex
                        chrome.tabs.update tab.id, { selected: true }
                        break

    # Spying on closed tabs.
    # Part of the following code stolen from http://code.google.com/p/recently-closed-tabs/source/browse/trunk/background.html
    # Listener on update.
    allOpenTabs = {}
    allClosedTabs = []
    chrome.tabs.onUpdated.addListener (tabId, changeInfo, tab) ->
        if tab and changeInfo.status is 'complete'
            allOpenTabs[tabId] = tab

    # Listener on remove.
    chrome.tabs.onRemoved.addListener (tabId) ->
        return if tabId not of allOpenTabs
        tabInfo = allOpenTabs[tabId]
        delete allOpenTabs[tabId]
        allClosedTabs.push(tabInfo)

    chrome.tabs.getAllInWindow null, (tabs) ->
        for t in tabs
            allOpenTabs[t.id] = t
