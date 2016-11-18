"use strict";
const xlib = require("xlib");
/** cross platform base library */
exports.xlib = xlib;
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//node modules
exports.childProcess = require("child_process");
exports.path = require("path");
exports.os = require("os");
exports.stream = require("stream");
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//3rd party modules
///** https://github.com/Reactive-Extensions/rx-node */
//export var rxNode = require("rx-node");
/** the npm "commander" package.
for creating commandline apps */
exports.commander = require("commander");
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//slib custom modules
const file = require("./file");
exports.file = file;
//export import processManager = require("./processmanager");
/** web server needs */
exports.webserver = require("./webserver");
/** external services such as billing, database, email. */
exports.external = require("./external/_index");
exports.security = require("./security");
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//slib custom functions
/** get resident memory usage of a pid in bytes.   works on windows or linux */
function getMemoryUsage(pid) {
    switch (process.platform) {
        case "win32":
            var command = xlib.stringHelper.format('tasklist /fi "pid eq %s" /NH', pid); //output: devenv.exe                    5200 Console                    1  1,310,816 K
            var stdoutBuffer = exports.childProcess.execSync(command);
            var output = stdoutBuffer.toString().trim();
            var chunks = output.split(" ");
            var target = chunks[chunks.length - 2];
            target = xlib.stringHelper.replaceAll(target, ",", "");
            return parseInt(target, 10) * 1024;
        //break;
        default:
            var command = xlib.stringHelper.format("ps -p %s -o rss=", pid); //output: 72288
            var stdoutBuffer = exports.childProcess.execSync(command);
            var output = stdoutBuffer.toString().trim();
            return parseInt(output, 10) * 1024;
    }
}
exports.getMemoryUsage = getMemoryUsage;
/** get a list of all ip addresses of this server, synchronously.  after generating the ip's, will cache results for next time you call this method */
exports.getNetworkIPs = (function () {
    if (typeof (require) === "undefined" || typeof (process) === "undefined") {
        return;
    }
    var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;
    //var exec = require('child_process').exec;
    var cachedV4;
    var cachedV6;
    var command;
    var filter4RE;
    var filter6RE;
    switch (process.platform) {
        case 'win32':
            //case 'win64': // TODO: test
            command = 'c:/windows/System32/ipconfig.exe';
            filter4RE = /\bIPv[4][^:\r\n]+:\s*([^\s]+)/g;
            filter6RE = /\bIPv[6][^:\r\n]+:\s*([^\s]+)/g;
            break;
        case 'darwin':
            command = 'ifconfig';
            filter4RE = /\binet\s+([^\s]+)/g;
            filter6RE = /\binet6\s+([^\s]+)/g; // IPv6
            break;
        default:
            command = 'ifconfig';
            filter4RE = /\binet\b[^:]+:\s*([^\s]+)/g;
            filter6RE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
            break;
    }
    return function (bypassCache = false) {
        if (cachedV4 == null || bypassCache === true) {
            var stdoutBuffer = exports.childProcess.execSync(command);
            cachedV4 = [];
            cachedV6 = [];
            var ip;
            var stdout = stdoutBuffer.toString();
            //ipv4
            var matches4 = stdout.match(filter4RE) || [];
            for (var i = 0; i < matches4.length; i++) {
                ip = matches4[i].replace(filter4RE, '$1');
                if (!ignoreRE.test(ip)) {
                    cachedV4.push(ip);
                }
            }
            //ipv6
            var matches6 = stdout.match(filter6RE) || [];
            for (var i = 0; i < matches6.length; i++) {
                ip = matches6[i].replace(filter6RE, '$1');
                if (!ignoreRE.test(ip)) {
                    cachedV6.push(ip);
                }
            }
        }
        return { v4: cachedV4, v6: cachedV6 };
    };
})();
/** the npm "universal-analytics" package.  https://www.npmjs.com/package/universal-analytics
A node module for Google's Universal Analytics tracking
This module allows tracking data (or rather, users) from within a Node.js application. Tracking is initiated on the server side and, if required, does not require any more tracking in the browser.

universal-analytics currently supports the following tracking features:

Pageviews
Events
E-Commerce with transactions and items
Exceptions
User timings
*/
exports.googleUniversalAnalytics = require("universal-analytics");
//let log = new xlib.logging.Logger(__filename);
//log.info("hi thar from slib");
//export default "hi"; 
//# sourceMappingURL=_index.js.map