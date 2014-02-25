define(function (require, exports, module) {
    'use strict';


    var CommandManager = brackets.getModule('command/CommandManager'),
        Menus = brackets.getModule('command/Menus'),
        AppInit = brackets.getModule('utils/AppInit'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),

        settings = require('src/settings'),
        panel = require('src/panel')(),
        toolbarManager = require('src/toolbarManager'),
        terminalManager = require('src/terminal')(),
        shortcut = require('src/shortcut')(terminalManager.command.bind(terminalManager));



    var TERMINAL_COMMAND_ID = 'artoale.terminal.open';

    var TERMINAL_SETTINGS_COMMAND_ID = 'artoale.terminal.settings';

    var openTerminalCommand = null;

    var currentTerminal = null;

    var createNewTerminal = function (terminalId) {
        var $terminal = panel.addTab(terminalId);
        terminalManager.open($terminal.get()[0], terminalId);
        $('.terminal').css('font-size', settings.get('fontSize') + 'px');
    };

    function resize() {
        terminalManager.handleResize(panel.$panel, currentTerminal);
    }

    function addToFontSize(amount) {
        var $terminal = $('.terminal'),
            fontsize = parseInt($terminal.css('font-size'), 10);
        fontsize = Math.max(fontsize + amount, 1);
        settings.set('fontSize', fontsize);
        $terminal.css('font-size', fontsize + 'px');
        resize();
    }

    function init() {

        toolbarManager.setStatus(toolbarManager.NOT_RUNNING);
        terminalManager.clear();
        terminalManager.startConnection('http://localhost:' + settings.get('port'));

        $(panel).on('close', function () {
            handleAction();
        });

        $(panel).on('command', function (evt, command) {
            if (command && typeof shortcut[command] === 'function' && currentTerminal) {
                shortcut[command](currentTerminal);
                return;
            }
            var action = command;
            if (action && action === 'font-plus') {
                addToFontSize(1);
            } else if (action && action === 'font-minus') {
                addToFontSize(-1);
            } else if (action && action === 'new-terminal') {
                terminalManager.createTerminal();
            }
        });
    }

    function handleAction(keepActive) {
        if (toolbarManager.status === toolbarManager.ACTIVE) {
            panel.toggle();
            toolbarManager.setStatus(toolbarManager.NOT_ACTIVE);
            terminalManager.blur(currentTerminal);
        } else if (toolbarManager.status === toolbarManager.NOT_ACTIVE) {
            panel.toggle();
//            resize(currentTerminal);
            terminalManager.focus(currentTerminal);
            toolbarManager.setStatus(toolbarManager.ACTIVE);
        } else if (toolbarManager.status === toolbarManager.NOT_CONNECTED || toolbarManager.status === toolbarManager.NOT_RUNNING) {
            init();
        } else if (toolbarManager.status === toolbarManager.CONNECTED) {
            //            console.log('CONNECTED ACTION');
            terminalManager.createTerminal();
        } else if (toolbarManager.status === toolbarManager.ERROR) {
            //            console.log('ERROR ACTION');
            //Nulla da fare, siamo nella cacca
        }
        if (keepActive) {
            toolbarManager.setStatus(toolbarManager.ACTIVE);
        }
    }

    var first = true;
    var killed = false;

    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, 'terminal.css');

        openTerminalCommand = CommandManager.register('Show terminal', TERMINAL_COMMAND_ID, function () {
            handleAction();
        });

        CommandManager.register('Brackets terminal settings', TERMINAL_SETTINGS_COMMAND_ID, function () {
            settings.showDialog();
        });

        panel.init();

        $(panel).on('resize', resize);

        $(panel).on('active-tab', function (evt, terminalId) {
            currentTerminal = terminalId;
            resize();
            terminalManager.focus(currentTerminal);
        });

        $(panel).on('shown', function () {
            openTerminalCommand.setChecked(true);
            if (!currentTerminal) {
                panel.$panel.find('.tab-header').first().click();
            }
        });

        $(panel).on('hidden', function () {
            openTerminalCommand.setChecked(false);
        });

        $(panel).on('close-tab', function (evt, terminalId) {
            terminalManager.destroy(terminalId);
        });


        $(panel).on('close-last', function () {
            currentTerminal = null;
            toolbarManager.setStatus(toolbarManager.NOT_ACTIVE);
            panel.toggle();
            terminalManager.createTerminal();
        });

        $('#sidebar').on('panelResizeEnd', resize);

        $(terminalManager).on('title', function (evt, terminalId, title) {
            var tabId  = terminalId.replace(/\//g, '-');
            panel.setTabTitle(tabId, title);
        });


        $(terminalManager).on('connected', function () {
            toolbarManager.setStatus(toolbarManager.CONNECTED);
            terminalManager.createTerminal();
            $(terminalManager).on('disconnected', function () {
                toolbarManager.setStatus(toolbarManager.NOT_CONNECTED);
            });
        });

        $(terminalManager).on('notConnected', function () {
            toolbarManager.setStatus(toolbarManager.NOT_RUNNING);
        });

//        $(terminalManager).on('killed', function () {
//            //ctrl+d or exit\n triggered terminal close
//            killed = true;
//            toolbarManager.setStatus(toolbarManager.CONNECTED);
//            panel.toggle('close');
//        });

        $(terminalManager).on('created', function (event, terminalId) {
            createNewTerminal(terminalId);
            first = false;
            if (toolbarManager.status !== toolbarManager.ACTIVE) {
                toolbarManager.setStatus(toolbarManager.NOT_ACTIVE);
            }
            if (killed) {
                killed = false;
                handleAction();
            }
        });

        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuItem(TERMINAL_COMMAND_ID, 'Ctrl-Shift-P');
        menu.addMenuItem(TERMINAL_SETTINGS_COMMAND_ID);

        toolbarManager.createIcon();
        $(toolbarManager).click(handleAction);

        init();
    });
});
