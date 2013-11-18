/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var ProjectManager = brackets.getModule("project/ProjectManager");

    module.exports = function (execute) {
        var clean = function () {
            execute('clear');
        };

        var cd = function () {
            var projectRoot = ProjectManager.getProjectRoot().fullPath;
            execute('cd "' + projectRoot + '"');
        };


        return {
            clean: clean,
            cd: cd,

        };
    };


});
