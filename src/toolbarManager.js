/*globals define, $*/

define(function () {

    var possibleStatus = {
        NOT_RUNNING: {
            class: 'not-running'
        },
        CONNECTED: {
            class: 'connected'
        },
        NOT_CONNECTED: {
            class: 'not-connected'
        },
        ACTIVE: {
            class: 'active'
        },
        NOT_ACTIVE: {
            class: 'not-active'
        },
        ERROR: {
            class: 'error'
        }
    };


    var toolbarManager = {};

    toolbarManager.status = possibleStatus.NOT_RUNNING;

    toolbarManager.createIcon = function() {

        $('<a href="#" title="terminal" id="terminal-icon"></a>').appendTo($("#main-toolbar .buttons"));
        this._$icon = $('#terminal-icon');
        this._$icon.on('click', function (){
            $(toolbarManager).trigger('click');
        });
        this.setStatus(possibleStatus.NOT_RUNNING);
    };

    toolbarManager.setStatus = function (status) {
        this._$icon.removeClass();
        this._$icon.addClass(status.class);
        this.status = status;
    };

    toolbarManager = $.extend(toolbarManager, possibleStatus);
    return toolbarManager;
});
