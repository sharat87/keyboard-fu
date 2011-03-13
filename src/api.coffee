body = $ 'body'

@fu =

    openOptionsPage: (target) ->
        console.info 'opening options page from fu'
        chrome.extension.sendRequest action: 'openOptionsPage', target: target

    openParentPage: ->
        console.info 'open parent page from fu'
        window.location = window.location.toString().replace(/\/[^\/]+\/?/, '')

    scrollDown: (size=100, time=150) ->
        console.info 'scroll down from fu'
        body.animate { scrollTop: body.scrollTop() + size }, time

    scrollUp: (size=100, time=150) ->
        console.info 'scroll up from fu'
        body.animate { scrollTop: body.scrollTop() - size }, time

    scrollRight: (size=70, time=120) ->
        console.info 'scroll right from fu'
        body.animate { scrollLeft: body.scrollLeft() + size }, time

    scrollLeft: (size=70, time=120) ->
        console.info 'scroll left from fu'
        body.animate { scrollLeft: body.scrollLeft() - size }, time

    scrollToTop: (time=150) ->
        console.info 'scroll to top from fu'
        body.animate { scrollTop: 0 }, time

    scrollToBottom: (time=150) ->
        console.info 'scroll to bottom from fu'
        body.animate { scrollTop: body.height() }, time

    tabNext: ->
        console.info 'next tab from fu'
        chrome.extension.sendRequest action: 'tabSwitchBy', count: 1

    tabPrevious: ->
        console.info 'previous tab from fu'
        chrome.extension.sendRequest action: 'tabSwitchBy', count: -1

    tabRight: ->
        console.info 'move tab to right from fu'
        chrome.extension.sendRequest action: 'tabMoveBy', count: 1

    tabLeft: ->
        console.info 'move tab to left from fu'
        chrome.extension.sendRequest action: 'tabMoveBy', count: -1

    tabClose: ->
        console.info 'close tab from fu'
        chrome.extension.sendRequest action: 'tabClose'

    tabUndoClose: ->
        console.info 'undo close tab from fu'
        chrome.extension.sendRequest action: 'tabUndoClose'
