/*globals define, $*/
define(function (require, exports, module) {

    var terminalProto = {},
        io = require('vendor/socket-io'),
        Terminal = require('vendor/tty');

    terminalProto.connectHandler = function connectHandler() {
        $(this).trigger('connected');
        this.createTerminal();
    };


    terminalProto.createHandler = function createHandler(err, data) {
        if (err) {
            console.error(err);
        }
        this.id = data.id;
        this.shellName = data.process;

        this.socket.on('kill', function () {
            this.clear();
            $(this).trigger('killed');
        }.bind(this));

        this.socket.on('disconnect', function () {
            this.clear();
            $(this).trigger('disconnected');
            //            this.socket.on('reconnect', this.connectHandler.bind(this));
        }.bind(this));

        this.socket.on('reconnect_failed', function () {
            this.clear();
            //            this.clearHandler();
        });

        $(this).trigger('created', this.terminal);
    };

    terminalProto.handleResize = function handleResize($bashPanel) {
        var height = $bashPanel.height(),
            width = $bashPanel.width(),
            rows = 100,
            cols = 140,
            lineHeight,
            fontSize;
        if (this.terminal) {
            height -= $bashPanel.find('.toolbar').height() - 12; //5px top/bottom border to remove...+2 security margin :)
            width -= 12; // same here :)
            lineHeight = $bashPanel.find('.terminal').css('line-height');
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
            this.socket.emit('resize', this.id, cols, rows);
            this.terminal.showCursor(this.terminal.x, this.terminal.y);
            this.terminal.resize(cols, rows);
        }
    };

    terminalProto.focus = function () {
        this.terminal.focus();
    };
    terminalProto.blur = function () {
        this.terminal.blur();
    };
    terminalProto.registerDataHandler = function () {
        this.terminal.on('data', function (data) {
            this.socket.emit('data', this.id, data);
        }.bind(this));

        this.socket.on('data', function (id, data) {
            this.terminal.write(data);
        }.bind(this));
    };

    terminalProto.open = function open(element) {
        this.terminal.open(element);
    };

    terminalProto.clear = function () {
        //        if (this.terminal) {
        //            this.terminal.removeAllListeners('data');
        //            this.terminal.destroy();
        //        }
        //        this.terminal = undefined;
        this.id = undefined;
        //        if (this.socket) {
        //            this.socket.removeAllListeners('data');
        //        }
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
            } else {
//                $(this).trigger('connected');
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
        cols = cols || 80;
        rows = rows || 24;
        if (!this.terminal) {
            this.terminal = new Terminal(cols, rows);
            this.registerDataHandler();
        }
        this.socket.emit('create', cols, rows, this.createHandler.bind(this));
    };

    module.exports = function () {
        return Object.create(terminalProto);
    };
});
