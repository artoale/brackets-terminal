define(function (require, exports) {
    'use strict';

    var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        Mustache = brackets.getModule('thirdparty/mustache/mustache'),
        Dialogs = brackets.getModule('widgets/Dialogs'),
        dialogTemplate = require('text!htmlContent/settings-dialog.html');

    var TERMINAL_SETTINGS_CLIENT_ID = 'bracketsTerminal',
        SETTINGS = 'settings';
    
    var defaults = {
        port: 8080,
        fontSize: 15
    };

    var prefs = PreferencesManager.getExtensionPrefs(TERMINAL_SETTINGS_CLIENT_ID);
    prefs.definePreference('settings', 'object', undefined, {
        keys: {
            port: {
                type: 'number',
                initial: defaults.port
            },
            fontSize: {
                type: 'number',
                initial: defaults.fontSize
            }
        }
    });
    
    function _getAllValues() {
        var settings = prefs.get(SETTINGS) || defaults;
        
        Object.keys(defaults).forEach(function (key) {
            var value = settings[key];
            if (typeof value === 'undefined') {
                value = defaults[key];
            }
            settings[key] = value;
        });

        return settings;
    }
    
    function _setAllValues(newSettings) {
        var oldSettings = prefs.get(SETTINGS);
        
        Object.keys(defaults).forEach(function (key) {
            var value = newSettings[key];
            if (typeof value === 'undefined') {
                newSettings[key] = oldSettings[key];
            }
        });

        prefs.set(SETTINGS, newSettings);
    }
    
    var settings;

    var _init = function () {
        settings = _getAllValues();
    };

    var _handleSave = function () {
        var inputValues = $('.brackets-terminal-settings-dialog').find('input').serializeArray();
        inputValues.forEach(function (configElement) {
            settings[configElement.name] = configElement.value;
        });
        _setAllValues(settings);
        settings = _getAllValues();
        $('#brackets-terminal-save').off('click', _handleSave);
    };

    var _showDialog = function () {
        Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogTemplate, settings));
        $('#brackets-terminal-save').on('click', _handleSave);
    };

    var _set = function (key, value) {
        settings[key] = value;
        _setAllValues(settings);
        settings = _getAllValues();
    };

    var _getAll = function () {
        return settings;
    };

    var _get = function (key) {
        return settings[key];
    };

    _init();

    exports.showDialog = _showDialog;
    exports.set = _set;
    exports.getAll = _getAll;
    exports.get = _get;
});
