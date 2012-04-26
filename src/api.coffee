body = $ 'body'

# The fu object, that currently holds all of the API functions. It may be split
# into more diverse categorical objects later on.
@fu =

    # Open the page given by `resource` in the `target`, which can be `here`, `window`, or `tab` (default)
    # `resource` can be `!options` or any other url
    open: (resource, target) ->
        log 'opening resource page from fu'
        location = window.location.toString()
        chrome.extension.sendRequest { action: 'open', resource, target, location }, (response) ->
            window.location = response.url

    # Open a bookmark(let) given by the its full path, in the given target.
    # 
    # The `location` should be a full path to the bookmark or bookmarklet. Like so
    #
    #    `'/Bookmarks Bar/Keyboard fu extension'`
    # 
    # would refer to the bookmark called *Keyboard fu extension* in the bookmarks bar.
    # You can visualize the locations of bookmarks from the bookmarks manager.
    openBookmarkByPath: (location, target='tab') ->
        log 'opening bookmark from fu'
        chrome.extension.sendRequest { action: 'openBookmarkByPath', location, target }, (response) ->
            window.location = response.url

    viewSource: ->
        log 'opening source page'
        chrome.extension.sendRequest { action: 'viewSource' }

    # Open a new tab
    openNewTab: ->
        log 'opening new tag from fu'
        chrome.extension.sendRequest action: 'openNewTab'

    # Show/hide the quick reference popup for the available hotkeys. Experimental.
    toggleKeyReference: ->
        log 'toggle key reference from fu'
        cs.toggleKeyReference()

    # Disable/Enable Keyboard-fu in current tab
    toggleKeyboardFu: ->
        log 'toggle keyboard-fu from fu'
        cs.toggleKeyboardFu()

    # Scroll down ``pixels`` pixels (default 100), in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.
    scrollDown: (size=100, time=150) ->
        log 'scroll down from fu'
        body.animate { scrollTop: body.scrollTop() + size }, time

    # Scroll up ``pixels`` pixels (default 100), in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.
    scrollUp: (size=100, time=150) ->
        log 'scroll up from fu'
        body.animate { scrollTop: body.scrollTop() - size }, time

    # Scroll right ``pixels`` pixels (default 70), in ``time`` milliseconds (default 120). Give time as 0, to bypass animation.
    scrollRight: (size=70, time=120) ->
        log 'scroll right from fu'
        body.animate { scrollLeft: body.scrollLeft() + size }, time

    # Scroll left ``pixels`` pixels (default 70), in ``time`` milliseconds (default 120). Give time as 0, to bypass animation.
    scrollLeft: (size=70, time=120) ->
        log 'scroll left from fu'
        body.animate { scrollLeft: body.scrollLeft() - size }, time

    # Scroll to the top of the page in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.
    scrollToTop: (time=150) ->
        log 'scroll to top from fu'
        body.animate { scrollTop: 0 }, time

    # Scroll to the bottom of the page in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.
    scrollToBottom: (time=150) ->
        log 'scroll to bottom from fu'
        body.animate { scrollTop: body.height() }, time

    # Go to the next tab.
    tabNext: ->
        log 'next tab from fu'
        chrome.extension.sendRequest action: 'tabSwitchBy', count: 1

    # Go to the previous tab.
    tabPrevious: ->
        log 'previous tab from fu'
        chrome.extension.sendRequest action: 'tabSwitchBy', count: -1

    # Move current tab to the right.
    tabRight: ->
        log 'move tab to right from fu'
        chrome.extension.sendRequest action: 'tabMoveBy', count: 1

    # Move current tab to the left.
    tabLeft: ->
        log 'move tab to left from fu'
        chrome.extension.sendRequest action: 'tabMoveBy', count: -1

    # Close the current tab.
    tabClose: ->
        log 'close tab from fu'
        chrome.extension.sendRequest action: 'tabClose'

    # Close all but the current tab.
    tabCloseOther: ->
        log 'close other tabs from fu'
        chrome.extension.sendRequest action: 'tabCloseOther'

    # Undo closing of last tab.
    tabUndoClose: ->
        log 'undo close tab from fu'
        chrome.extension.sendRequest action: 'tabUndoClose'
