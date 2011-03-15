body = $ 'body'

# The fu object, that currently holds all of the API functions. It may be split
# into more diverse categorical objects later on.
@fu =

    # Open the page given by `resource` in the `target`, which can be `here`, `window`, or `tab` (default)
    # `resource` can be `!options` or any other url
    open: (resource, target='tab') ->
        log 'opening options page from fu'
        location = window.location.toString()
        chrome.extension.sendRequest { action: 'open', resource, target, location }, (response) ->
            window.location = response.url

    toggleKeyReference: ->
        log 'toggle key reference from fu'
        cs.toggleKeyReference()

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

    # Undo closing of last tab.
    tabUndoClose: ->
        log 'undo close tab from fu'
        chrome.extension.sendRequest action: 'tabUndoClose'
