/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    'use strict';


    var CommandManager = brackets.getModule('command/CommandManager'),
        Menus = brackets.getModule('command/Menus'),
        PanelManager = brackets.getModule('view/PanelManager'),
        AppInit = brackets.getModule('utils/AppInit'),
        Strings = brackets.getModule('strings'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        Resizer = brackets.getModule('utils/Resizer'),

        panelTemplate = require('text!htmlContent/bottom-panel.html'),
        tabTemplate = require('text!htmlContent/tab-header.html'),
        settings = require('src/settings'),
        toolbarManager = require('src/toolbarManager'),
        terminalManager = require('src/terminal')(),
        shortcut = require('src/shortcut')(terminalManager.command.bind(terminalManager));

    var $bashPanel;


    var currentTerminal = null;

    var TERMINAL_COMMAND_ID = 'artoale.terminal.open';
    var TERMINAL_SETTINGS_COMMAND_ID = 'artoale.terminal.settings';

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
            $bashPanel.find('.terminal').css('font-size', settings.get('fontSize'));
            _visible = true;
        } else {
            Resizer.hide($bashPanel);
            openTerminalCommand.setChecked(false);
            _visible = false;
        }
    }

    function addTabHeader(tabId) {
        var html = Mustache.render(tabTemplate, {
            id: tabId.replace(/\//g, '-'),
            name: 'Terminal'
        });
        $bashPanel.find('.nav').append(html);
    }

    function showTab($this) {
        var $ul = $this.closest('ul'),
            selector,
            $target,
            $parent;

        selector = $this.attr('href');
        if ($this.parent('li').hasClass('active')) {
            return;
        }
        $target = $(selector);
        $parent = $target.parent();
        var $active = $parent.find('> .active');
        $ul.find('> li.active').removeClass('active');
        $active.removeClass('active');
        $this.parent().addClass('active');
        $target.addClass('active');
        currentTerminal = $target.data('id');
    }

    function renderHtml(html) {
        return $bashPanel.find('.terminal-container').append(html);
    }


    var createNewTerminal = function (terminalId) {
        renderHtml('<div class="terminal-tab" data-id="' + terminalId + '" id="' + terminalId.replace(/\//g, '-') + '"></div>');
        var $terminal = $('#' + terminalId.replace(/\//g, '-'));
        //        terminalManager.createTerminal();
        terminalManager.open($terminal.get()[0], terminalId);
        addTabHeader(terminalId);
    };

    function resize() {
        if (_visible) {
            terminalManager.handleResize($bashPanel, currentTerminal);
        }
    }

    function init() {
        var $terminal;
        toolbarManager.setStatus(toolbarManager.NOT_RUNNING);
        terminalManager.clear();
        terminalManager.startConnection('http://localhost:' + settings.get('port'));

        $bashPanel.find('.close').on('click', function () {
            handleAction();
        });


        $bashPanel.find('#terminal-commands').on('click', 'a', function () {
            $terminal = $bashPanel.find('.terminal');
            var command = $(this).data('command'),
                fontsize = '';

            if (command && typeof shortcut[command] === 'function') {
                shortcut[command]();
                return;
            }

            var action = $(this).data('action');
            if (action && action === 'font-plus') {
                fontsize = parseInt($terminal.css('font-size'), 10);
                fontsize += 1;
                settings.set('fontSize', fontsize);
                $terminal.css('font-size', fontsize + 'px');
                resize();
            } else if (action && action === 'font-minus') {
                fontsize = parseInt($terminal.css('font-size'), 10);
                fontsize = Math.max(fontsize - 1, 1);
                settings.set('fontSize', fontsize);
                $terminal.css('font-size', fontsize + 'px');
                resize();
            } else if (action && action === 'new-terminal') {
                terminalManager.createTerminal();
            }
        });

    }

    function handleAction() {
        if (toolbarManager.status === toolbarManager.ACTIVE) {
            togglePanel();
            toolbarManager.setStatus(toolbarManager.NOT_ACTIVE);
            terminalManager.blur(currentTerminal);
        } else if (toolbarManager.status === toolbarManager.NOT_ACTIVE) {
            togglePanel();
            resize(currentTerminal);
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

        Mustache.render(panelTemplate, Strings);
        PanelManager.createBottomPanel('bash.terminal', $(panelTemplate), 100);

        $bashPanel = $('#brackets-terminal');


        $('#sidebar').on('panelResizeEnd', resize);
        $bashPanel.on('panelResizeEnd', resize);
        $(terminalManager).on('connected', function () {
            toolbarManager.setStatus(toolbarManager.CONNECTED);
            terminalManager.createTerminal();
            $(terminalManager).on('disconnected', function () {
                toolbarManager.setStatus(toolbarManager.NOT_CONNECTED);
            });
        });

        $bashPanel.on('click', '.tab-header', function () {
            showTab($(this));
        });

        $(terminalManager).on('notConnected', function () {
            toolbarManager.setStatus(toolbarManager.NOT_RUNNING);
        });

        $(terminalManager).on('killed', function () {
            //ctrl+d or exit\n triggered terminal close
            killed = true;
            toolbarManager.setStatus(toolbarManager.CONNECTED);
            togglePanel('close');
        });
        $(terminalManager).on('created', function (event, terminalId) {
            createNewTerminal(terminalId);
            first = false;
            toolbarManager.setStatus(toolbarManager.NOT_ACTIVE);
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