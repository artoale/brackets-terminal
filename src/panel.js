define(function (require, exports, module) {
    'use strict';

    /* Brackets dependencies */
    var PanelManager = brackets.getModule('view/PanelManager'),

        /* Internal dependencies */
        tabTemplate = require('text!htmlContent/tab-header.html'),
        terminalTemplate = require('text!htmlContent/terminal.html'),
        panelTemplate = require('text!htmlContent/bottom-panel.html');

    var makePanel = function makePanel() {
        var _visible = false,
            _$panel,
            _brPanel,
            exportObj = {};

        var _createPanel = function () {
            _brPanel = PanelManager.createBottomPanel('bash.terminal', $(panelTemplate), 100);
            _$panel = _brPanel.$panel;
        };

        var _activateTab = function ($tab) {
            var selector = $tab.attr('href'),
                $target = _$panel.find(selector),
                $ul = $tab.closest('ul');
            _$panel.find('.terminal-tab.active').removeClass('active');
            $ul.find('> li.active').removeClass('active');
            $tab.parent().addClass('active');
            $target.addClass('active');
            $(exportObj).trigger('activate-tab', $target.data('id'));
        };

        var _registerTabHandler = function () {
            _$panel.find('.nav-tabs').on('click', '.tab-header', function () {
                _activateTab($(this));
            });
        };

        var _registerCommandHandler = function () {
            _$panel.find('#terminal-commands').on('click', 'a', function () {
                $(exportObj).trigger('command', $(this).data('command'));
            });
            _$panel.find('.close').on('click', function () {
                $(exportObj).trigger('close');
            });
        };
        
        var _registerResizeHandler = function () {
            _$panel.on('panelResizeEnd', function () {
                if (_visible) {
                    $(exportObj).trigger('resize');
                }
            });
        };

        var init = function () {
            _createPanel();
            _registerTabHandler();
            _registerCommandHandler();
            _registerResizeHandler();
        };

        //tab id == terminalId with '-' instead of / (eg -dev-tty-tty7)
        var addTab = function (terminalId) {
            var tabId = terminalId.replace(/\//g, '-'),
                html = Mustache.render(tabTemplate, {
                    id: tabId,
                    name: 'Terminal'
                }),
                content,
                $content;
            _$panel.find('.nav').append(html);
            content = Mustache.render(terminalTemplate, {
                terminalId: terminalId,
                tabId: tabId
            });
            $content = $(content);
            _$panel.find('.terminal-container').append($content);
            return $content;
        };

        var toggle = function toggle(forceShow) {
            if (_visible && forceShow === 'show') {
                return;
            }
            if (!_visible && forceShow === 'close') {
                return;
            }
            if (!_visible) {
                _brPanel.show();
                $(exportObj).trigger('shown');
                _visible = true;
            } else {
                _brPanel.hide();
                $(exportObj).trigger('hidden');
                _visible = false;
            }
        };


        exportObj.init = init;
        exportObj.toggle = toggle;
        exportObj.addTab = addTab;
        exportObj.$panel = _$panel;

        return exportObj;
    };

    module.exports = makePanel;
});
