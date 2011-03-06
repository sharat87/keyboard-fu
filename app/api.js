(function () {

    var body = $('body');

    var fu = window.fu = {

        scrollDown: function (size, time) {
            console.info('scroll down from fu');
            body.animate({ scrollTop: body.scrollTop() + (size || 100) }, time || 150);
        },

        scrollUp: function (size, time) {
            console.info('scroll up from fu');
            body.animate({ scrollTop: body.scrollTop() - (size || 100) }, time || 150);
        },

        scrollLeft: function (size, time) {
            console.info('scroll left from fu');
            body.animate({ scrollLeft: body.scrollLeft() - (size || 70) }, time || 120);
        },

        scrollRight: function (size, time) {
            console.info('scroll right from fu');
            body.animate({ scrollLeft: body.scrollLeft() - (size || 70) }, time || 120);
        },

        scrollToTop: function (time) {
            console.info('scroll to top from fu');
            body.animate({ scrollTop: body.height() }, 150);
        },

        scrollToBottom: function (time) {
            console.info('scroll to bottom from fu');
            body.animate({ scrollTop: 0 }, 150);
        },

        tabNext: function () {
            console.info('next tab from fu');
            chrome.extension.sendRequest({ action: 'tabSwitchBy', count: 1 });
        },

        tabPrevious: function () {
            console.info('previous tab from fu');
            chrome.extension.sendRequest({ action: 'tabSwitchBy', count: -1 });
        },

        tabRight: function () {
            console.info('move tab to right from fu');
            chrome.extension.sendRequest({ action: 'tabMoveBy', count: 1 });
        },

        tabLeft: function () {
            console.info('move tab to left from fu');
            chrome.extension.sendRequest({ action: 'tabMoveBy', count: -1 });
        },

        tabClose: function () {
            console.info('close tab from fu');
            chrome.extension.sendRequest({ action: 'tabClose' });
        }

    };

}());
