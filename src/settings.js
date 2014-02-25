define(function (require, exports) {
    'use strict';

    var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        Dialogs = brackets.getModule('widgets/Dialogs'),
        dialogTemplate = require('text!htmlContent/settings-dialog.html');

    var TERMINAL_SETTINGS_CLIENT_ID = 'bracketsTerminal.settings';

    var settings;
    
    var defaults = {
        port: 8080,
        fontSize: 15
    };

    var storage;

    var _init = function () {
        storage = PreferencesManager.getPreferenceStorage(TERMINAL_SETTINGS_CLIENT_ID, defaults);
        settings = storage.getAllValues();
    };

    var _handleSave = function () {
        var inputValues = $('.brackets-terminal-settings-dialog').find('input').serializeArray();
        inputValues.forEach(function (configElement) {
            settings[configElement.name] = configElement.value;
        });
        storage.setAllValues(settings);
        settings = storage.getAllValues();
        $('#brackets-terminal-save').off('click', _handleSave);
    };

    var _showDialog = function () {
        Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogTemplate, settings));
        $('#brackets-terminal-save').on('click', _handleSave);
    };

    var _set = function (key, value) {
        settings[key] = value;
        storage.setAllValues(settings);
        settings = storage.getAllValues();
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
