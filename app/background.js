jQuery(function ($) {

    var appVersion = '0.3';

    function checkVersion() {
        var version = localStorage.version || (localStorage.hotkeys ? '0.2' : null);
        if (appVersion != version) {
            upgraders[version]();
        }
    }

    var upgraders = {

        '0.2': function () {

        }

    };

    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
        actions[request.action](request, sender, sendResponse);
    });

    var actions = {

        alert: function (request, sender, sendResponse) {
            console.info('alert request made');
            alert(request.message);
        },

        console: function (request) {
            console[request.fn].apply(console, request.args);
        },

        getHotkeys: function (request, sender, sendResponse) {
            console.info('hotkeys get request made');
            sendResponse(keyStore.load(request.urlsAsGlobs));
        },

        setHotkeys: function (request, sender, sendResponse) {
            console.info('hotkeys save request made');
            keyStore.dump(request.hotkeys);
            sendResponse({ ok: true });
        },

        importHotkeys: function (request, sender, sendResponse) {
            console.info('hotkeys import request made');
            keyStore.import(request.content);
            sendResponse({ ok: true });
        },

        exportHotkeys: function (request, sender, sendResponse) {
            console.info('hotkeys export request made');
            sendResponse(keyStore.export());
        },

        getGlobalFilters: function (request, sender, sendResponse) {
            console.info('global fitlers set request made');
            sendResponse(keyStore.loadGlobalFilters());
        },

        setGlobalFilters: function (request, sender, sendResponse) {
            console.info('global fitlers get request made');
            keyStore.dumpGlobalFilters(request.filters);
            sendResponse({ ok: true });
        },

        openOptionsPage: function (request, sender, sendResponse) {
            var target = request.target,
                url = chrome.extension.getURL('options.html');
            if (target == 'here') {
                window.location = url;
            } else if (target == 'window') {
                chrome.windows.create({ url: url });
            } else {
                chrome.tabs.create({ url: url });
            }
        },

        tabSwitchBy: function (request, sender, sendResponse) {
            console.info('tabSwitch request made');
            tabSwitchBy(request.count);
        },

        tabMoveBy: function (request, sender, sendResponse) {
            console.info('tabMove request made');
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.move(tab.id, { index: tab.index + request.count });
            });
        },

        tabClose: function (request, sender, sendResponse) {
            console.info('tabClose request made');
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.remove(tab.id);
            });
        },

        tabUndoClose: function (request, sender, sendResponse) {
            console.info('tabUndoClose request made');
            if (allClosedTabs.length) {
                chrome.tabs.create({ url: allClosedTabs.pop() });
            }
        }

    };

    var keyStore = {

        defaultHotkeys: {
            1: { keyc: 'j', desc: 'Scroll down', code: 'fu.scrollDown()', filters: [] },
            2: { keyc: 'k', desc: 'Scroll up', code: 'fu.scrollUp()', filters: [] },
            3: { keyc: 'h', desc: 'Scroll left', code: 'fu.scrollLeft()', filters: [] },
            4: { keyc: 'l', desc: 'Scroll right', code: 'fu.scrollRight()', filters: [] },
            5: { keyc: 'gg', desc: 'Go to top', code: 'fu.scrollToTop()', filters: [] },
            6: { keyc: 'G', desc: 'Go to bottom', code: 'fu.scrollToBottom()', filters: [] },
            7: { keyc: 'gj', desc: 'Scroll down big', code: 'fu.scrollDown(370)', filters: [] },
            8: { keyc: 'gk', desc: 'Scroll up big', code: 'fu.scrollUp(370)', filters: [] },
            9: { keyc: 'L', desc: 'Next tab', code: 'fu.tabNext()', filters: [] },
            10: { keyc: 'H', desc: 'Previous tab', code: 'fu.tabPrevious()', filters: [] },
            11: { keyc: 'N', desc: 'Move tab left', code: 'fu.tabLeft()', filters: [] },
            12: { keyc: 'M', desc: 'Move tab right', code: 'fu.tabRight()', filters: [] },
            13: { keyc: '<C-x>', desc: 'Close tab', code: 'fu.tabClose()', filters: [] },
            14: { keyc: 'u', desc: 'Undo close tab', code: 'fu.tabUndoClose()', filters: [] },
            15: { keyc: 'go', desc: 'Open Keyboard-fu options page', code: 'fu.openOptionsPage("newTab")', filters: [] },
            16: { keyc: 'o', desc: 'Go back', code: 'history.back()', filters: [] },
            17: { keyc: 'i', desc: 'Go forward', code: 'history.forward()', filters: [] },
            18: { keyc: 'gu', desc: 'Go up in the url', code: 'fu.openParentPage()', filters: [] },
            19: { keyc: 't', desc: 'Just a test', code: 'alert(\'passed\')', filters: ['http://*.google.com/*'] }
        },

        // Storage data strucutre:
        // Eack hotkey is an array of the form,
        //   [id, keyc, desc, code, filters[]]
        // localStorage.hotkeys is an array of these arrays

        load: function () {
            if (!localStorage.hotkeys) {
                keyStore.dump(keyStore.defaultHotkeys);
            }
            var rawHotkeys = JSON.parse(localStorage.hotkeys),
                hotkeys = {}, i = 0, l = rawHotkeys.length;
            while (i < l) {
                var rh = rawHotkeys[i++];
                hotkeys[rh[0]] = {
                    keyc: rh[1],
                    desc: rh[2],
                    code: rh[3],
                    filters: rh[4]
                };
            }
            return hotkeys;
        },

        dump: function (hotkeys) {
            var rawHotkeys = [];
            $.each(hotkeys, function (i, keyData) {
                rawHotkeys.push([i, keyData.keyc, keyData.desc, keyData.code, keyData.filters]);
            });
            localStorage.hotkeys = JSON.stringify(rawHotkeys);
        },

        import: function (content) {
            var importObj = JSON.parse(content);
            localStorage.clear();
            for (key in importObj) {
                localStorage[key] = importObj[key];
            }
        },

        export: function () {
            return JSON.stringify(localStorage);
        },

        defaultGlobalFilters: [
            '-https://mail.google.com/*',
            '-https://reader.google.com/*',
            '*'
        ],

        loadGlobalFilters: function () {
            if (!localStorage.globalFilters) {
                keyStore.dumpGlobalFilters(keyStore.defaultGlobalFilters);
            }
            return JSON.parse(localStorage.globalFilters);
        },

        dumpGlobalFilters: function (filters) {
            localStorage.globalFilters = JSON.stringify(filters);
        }

    };

    // Switch tab by `count` tabs. If count is 1, goes to next tab, if it is -1, goes to previous tab.
    // Does not wrap
    function tabSwitchBy(count) {
        chrome.tabs.getSelected(null, function (tab) {
            var newIndex = tab.index + count;
            chrome.tabs.getAllInWindow(null, function (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].index == newIndex) {
                        chrome.tabs.update(tabs[i].id, { selected: true });
                        break;
                    }
                }
            });
        });
    }

    // Spying on closed tabs. Code stolen from http://code.google.com/p/recently-closed-tabs/source/browse/trunk/background.html
    // Listener on update.
    var allOpenTabs = {}, allClosedTabs = [];
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (tab && changeInfo.status == 'complete') {
            allOpenTabs[tabId] = tab;
        }
    });

    // Listener on remove.
    chrome.tabs.onRemoved.addListener(function (tabId) {
        var tabInfo = allOpenTabs[tabId];
        if (tabInfo == undefined) return;
        delete allOpenTabs[tabId];
        allClosedTabs.push(tabInfo.url);
    });

});
