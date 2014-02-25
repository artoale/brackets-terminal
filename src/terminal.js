/*jshint devel:true */
define(function (require, exports, module) {
    'use strict';
    var terminalProto = {},
        io = require('vendor/socket-io'),
        Terminal = require('vendor/tty');

    terminalProto.connectHandler = function connectHandler() {
        $(this).trigger('connected');
        this.registerSocketHandler();
    };

    terminalProto.command = function (command) {
        this.socket.emit('data', this.id, command + '\n');
    };

    terminalProto.createHandler = function createHandler(err, data) {
        var term;
        if (err) {
            console.error(err);
        }

        term = new Terminal(data.cols, data.rows);
        this.terminals[data.id] = term;
        this.registerDataHandler(data.id);

        this.socket.on('kill', function () {
            this.clear();
            $(this).trigger('killed');
        }.bind(this));

        this.socket.on('disconnect', function () {
            this.clear();
            $(this).trigger('disconnected');
        }.bind(this));

        this.socket.on('reconnect_failed', function () {
            this.clear();
        });
        this.blurAll();
        $(this).trigger('created', data.id);
    };

    terminalProto.handleResize = function handleResize($bashPanel, terminalId) {
        var height = $bashPanel.height(),
            width = $bashPanel.width(),
            rows = 100,
            cols = 140,
            lineHeight,
            fontSize;
        //        if (this.terminal) {
        height -= $bashPanel.find('.toolbar').height() - 12; //5px top/bottom border to remove...+2 security margin :)
        width -= 12; // same here :)
        var $span = $('<span>X</span>');
        $span.css({
            position: 'absolute',
            left: -500
        });
        $span.appendTo($bashPanel.find('.terminal').get()[0]);
        fontSize = $span.width();
        lineHeight = $span.height();
        $span.remove();
        lineHeight = parseInt(lineHeight, 10) + 1;
        fontSize = parseInt(fontSize, 10);
        rows = Math.floor(height / lineHeight);
        cols = Math.floor(width / fontSize);

        this.socket.emit('resize', terminalId, cols, rows);
        
        if (this.terminals[terminalId]) {
            this.terminals[terminalId].resize(cols, rows);
            this.terminals[terminalId].showCursor(this.terminals[terminalId].x, this.terminals[terminalId].y);
        }

    };
    terminalProto.focus = function (terminalId) {
        if (this.terminals[terminalId]) {
            this.terminals[terminalId].focus();
        }
    };

    terminalProto.blurAll = function () {
        for (var termId in this.terminals) {
            this.terminals[termId].blur();
        }
    };
    terminalProto.blur = function (terminalId) {
        if (this.terminals[terminalId]) {
            this.terminals[terminalId].blur();
        }
    };
    terminalProto.registerDataHandler = function (terminalId) {
        var that = this;
        var emit = function (id) {
            return function (data) {
                that.socket.emit('data', id, data);
            };
        };
        this.terminals[terminalId].on('data', emit(terminalId));
    };

    terminalProto.registerSocketHandler = function () {
        this.socket.on('data', function (id, data) {
            this.terminals[id].write(data);
        }.bind(this));
    };

    terminalProto.open = function open(element, termId) {
        if (this.terminals[termId]) {
            this.terminals[termId].open(element);
        }
    };

    terminalProto.clear = function () {
        //        this.id = undefined;
    };

    terminalProto.clearHandler = function () {
        if (this.socket) {
            this.socket.removeAllListeners('connect');
            this.socket.removeAllListeners('reconnect');
            this.socket.removeAllListeners('error');
            this.socket.removeAllListeners('disconnect');
            this.socket.removeAllListeners('data');
        }
    };

    terminalProto.startConnection = function startConnection(host) {
        if (typeof host !== 'string') {
            host = 'http://localhost:8080';
        }
        if (this.socket) {
            if (!this.socket.socket.connected) {
                this.socket.socket.connect();
            }
            return;
        }
        this.socket = io.connect(host, {
            force: true
        });
        this.socket.on('error', function () {
            this.clear();
            $(this).trigger('notConnected');
        }.bind(this));
        this.socket.on('connect', this.connectHandler.bind(this));
    };


    terminalProto.createTerminal = function (cols, rows) {
        if (!this.socket.socket.connected) {
            throw new Error('Unable to create terminal without a connection');
        }
        this.terminals = this.terminals || {};

        cols = cols || 80;
        rows = rows || 24;
        this.socket.emit('create', cols, rows, this.createHandler.bind(this));
    };

    module.exports = function () {
        return Object.create(terminalProto);
    };
});