/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets,  Mustache, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";


    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        PanelManager = brackets.getModule("view/PanelManager"),
        AppInit = brackets.getModule("utils/AppInit"),
        Strings = brackets.getModule("strings"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        Resizer = brackets.getModule("utils/Resizer"),
        panelTemplate = require("text!htmlContent/bottom-panel.html"),

        toolbarManager = require("src/toolbarManager"),
        terminalManager = require("src/terminal")();

    var $bashPanel;

    var TERMINAL_COMMAND_ID = "artoale.terminal.open";

    var _visible = false;

    var openTerminalCommand;

    function togglePanel(forceShow) {
        if (_visible && forceShow === 'show') {
            return;
        }
        if (!_visible && forceShow === 'close') {
            return;
        }
        if (!_visible) {
            Resizer.show($bashPanel);
            openTerminalCommand.setChecked(true);
            _visible = true;
        } else {
            Resizer.hide($bashPanel);
            openTerminalCommand.setChecked(false);
            _visible = false;
        }
    }


    function renderHtml(html) {
        $bashPanel.find(".terminal-container")
            .empty()
            .append(html);
    }


    function resize() {
        terminalManager.handleResize($bashPanel);
    }

    function init() {
        toolbarManager.setStatus(toolbarManager.NOT_RUNNING);
        terminalManager.clear();
        terminalManager.startConnection();


        renderHtml('<div id="bash-console"></div>');

        $bashPanel.find(".close").on('click', function () {
            handleAction();
//            togglePanel('close');
        });

    }

    function handleAction() {
        if (toolbarManager.status === toolbarManager.ACTIVE) {
            togglePanel();
            toolbarManager.setStatus(toolbarManager.NOT_ACTIVE);
            terminalManager.blur();
        } else if (toolbarManager.status === toolbarManager.NOT_ACTIVE) {
            togglePanel();
            resize();
            terminalManager.focus();
            toolbarManager.setStatus(toolbarManager.ACTIVE);
        } else if (toolbarManager.status === toolbarManager.NOT_CONNECTED || toolbarManager.status === toolbarManager.NOT_RUNNING) {
            console.log('NOT CONNECTED ACTION');
            init();
        } else if (toolbarManager.status === toolbarManager.CONNECTED) {
            console.log('CONNECTED ACTION');
            //manca un terminale vero e proprio?
            terminalManager.createTerminal();
        } else if (toolbarManager.status === toolbarManager.ERROR) {
            console.log('ERROR ACTION');
            //Nulla da fare, siamo nella cacca
        }
    }

    var first = true;

    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "terminal.css");
        // package-style naming to avoid collisions
        openTerminalCommand = CommandManager.register("Show terminal", TERMINAL_COMMAND_ID, function () {
            handleAction();
        });

        Mustache.render(panelTemplate, Strings);
        PanelManager.createBottomPanel("bash.terminal", $(panelTemplate), 100);

        $bashPanel = $('#brackets-terminal');






//        $(window).resize(function () {
//            if (this.resizeTO) {
//                window.clearTimeout(this.resizeTO);
//            }
//            this.resizeTO = window.setTimeout(resize, 200);
//        });
        $('#sidebar').on('panelResizeEnd', resize);
        $bashPanel.on('panelResizeEnd', resize);
        $(terminalManager).on('connected', function () {
            toolbarManager.setStatus(toolbarManager.CONNECTED);
            $(terminalManager).on('disconnected', function () {
                toolbarManager.setStatus(toolbarManager.NOT_CONNECTED);
            });
        });

        $(terminalManager).on('notConnected', function () {
            toolbarManager.setStatus(toolbarManager.NOT_RUNNING);
        });

        $(terminalManager).on('killed', function () {
            toolbarManager.setStatus(toolbarManager.CONNECTED);
            togglePanel('close');
        });
        $(terminalManager).on('created', function () {
            if (first) {
                terminalManager.open($bashPanel.find('#bash-console').get()[0]);
                first = false;
            }
            toolbarManager.setStatus(toolbarManager.NOT_ACTIVE);
        });


        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuItem(TERMINAL_COMMAND_ID, "Ctrl-Shift-P");



        toolbarManager.createIcon();
        $(toolbarManager).click(handleAction);

        init();

    });

});
