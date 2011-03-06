Keyboard-fu Documentation
=========================

fu API
------

The following are the functions available under the ``fu`` object. You can use them in the key binding scripts. More will be added in the coming versions. If you have any suggestions, feel free to get in touch via email (shrikantsharat.k@gmail.com), or on twitter sharat87_ <- You should follow me ;)

.. _sharat87: http://twitter.com/sharat87

``fu.scrollUp(pixels, time)``
    Scroll up ``pixels`` pixels (default 100), in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.

``fu.scrollDown(pixels, time)``
    Scroll down ``pixels`` pixels (default 100), in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.

``fu.scrollLeft(pixels, time)``
    Scroll left ``pixels`` pixels (default 70), in ``time`` milliseconds (default 120). Give time as 0, to bypass animation.

``fu.scrollRight(pixels, time)``
    Scroll right ``pixels`` pixels (default 70), in ``time`` milliseconds (default 120). Give time as 0, to bypass animation.

``fu.scrollToTop(time)``
    Scroll to the top of the page in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.

``fu.scrollToBottom(time)``
    Scroll to the bottom of the page in ``time`` milliseconds (default 150). Give time as 0, to bypass animation.

``fu.tabNext()``
    Go to the next tab.

``fu.tabPrevious()``
    Go to the previous tab.

``fu.tabLeft()``
    Move current tab to the left.

``fu.tabRight()``
    Move current tab to the right.

``fu.tabClose()``
    Close the current tab.

Additional Notes
----------------

Also note that the ``jQuery`` object is available (also as the ``$``), which you can use to bind hotkeys to various DOM manipulations using jQuery. For example, you can bind a key on a particular page to dispatch a click event on a link, or event to fill out a form (or even 10s or forms) and submit them, for testing or for other purposes. Its up to your imagination. If you need any functions or feel that the API is limiting in any way, let me know and may be your idea will be implemented in a later version of *Keyboard-fu*.

Happy fu!!
