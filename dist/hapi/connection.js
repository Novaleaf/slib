//import refs = require("../refs");
"use strict";
const file = require("../file");
const xlib = require("xlib");
var Promise = xlib.promise.bluebird;
var log = new xlib.logging.Logger(__filename);
const Url = require("url");
var __ = xlib.lolo;
const hapiEco = require("./hapi-eco");
/////////////////////////////// HTTPS
//var _tlsOptions: { key: Buffer; cert: Buffer };
//if (__devSettings.isDevMode === true) {
//    //using dev certs valid for https://local.ldsconnect.org (which points to 127.0.0.1)
//    //from https://github.com/LDSorg/local.ldsconnect.org-certificates
//    _tlsOptions = {
//        key: nlib.fs.readFileSync(nlib.path.join(__dirname, "../../../", "secstore/certs/test/local.ldsconnect.org-certificates/server/my-server.key.pem")),
//        cert: nlib.fs.readFileSync(nlib.path.join(__dirname, "../../../", "secstore/certs/test/local.ldsconnect.org-certificates/server/my-server.crt.pem")),
//    }
//} else {
//    log.fatal("need lets encrypt https key");
//}
/**
 * helper will configure your http+https connections.  This does standard boilerplate for you, that's all.
 * @param server
 * @param options
 */
function initialize(server, _options) {
    let options;
    if (_options == null) {
        options = {};
    }
    else {
        options = _options;
    }
    options.isHttpsOnly = __.defaultIfNull(options.isHttpsOnly, false);
    options.httpPort = __.defaultIfNull(options.httpPort, 80);
    options.httpsPort = __.defaultIfNull(options.httpsPort, 443);
    let _tlsKeys = null;
    if (options.tls != null) {
        _tlsKeys = {
            key: file.fsPromise.readFileSync(options.tls.keyPath),
            cert: file.fsPromise.readFileSync(options.tls.certPath),
        };
    }
    //configure for http
    server.connection({ port: options.httpPort, routes: { log: true } });
    //configure for https
    if (_tlsKeys != null) {
        let httpsConnectionOptions = {
            port: options.httpsPort,
            tls: _tlsKeys,
        };
        server.connection(httpsConnectionOptions);
    }
    //redirect http requests if option is set.
    if (options.isHttpsOnly) {
        server.ext("onRequest", (request, reply) => {
            //log.info("info", request.info);
            //log.info("connection", request.connection);
            if (request.connection.info.port != options.httpsPort && request.path.indexOf("/metrics/") < 0) {
                //log.trace("redirecting to https");
                return reply.redirect(Url.format({
                    protocol: "https",
                    hostname: request.info.hostname,
                    pathname: request.url.pathname,
                    port: options.httpsPort.toString(10),
                }));
            }
            return reply.continue();
        });
    }
    if (options.disableSimpleHealthCheckEndpoint !== true) {
        let routeConfig = hapiEco.ezRouteConfigNoAuth("/metrics/simpleHealthCheck", (request, reply) => {
            return Promise.resolve("OK");
        }, ["GET", "POST"], {
            //payload: { output: "data", parse: "gunzip" },
            auth: false,
        });
        server.route(routeConfig);
    }
    //setup error listening
    server.on('request-error', function (request, err) {
        //console.log(err.data.stack);		
        log.error("nlib.hapi-eco.connection.server.on.request-error", { request: hapiEco.requestToJson(request, { verboseRequestLogs: true }) }, err);
        //console.log('Error response (500) sent for request: ' + request.id + ' because: ' + (err.trace || err.stack || err));
    });
    //server.route([
    //	{
    //		path: '/test/failure',
    //		method: ["GET", "POST"],
    //		config: {//payload: { output: "data", parse: "gunzip" },
    //			auth: false, //don't require login
    //		},
    //		handler: function (request: Hapi.Request, reply: Hapi.IReply) {
    //			log.debug(request.path + " endpoint invoked");
    //			reply("error now").code(500);
    //		}
    //	},
    //	{
    //		path: '/test/throws',
    //		method: ["GET", "POST"],
    //		config: {//payload: { output: "data", parse: "gunzip" },
    //			auth: false, //don't require login
    //		},
    //		handler: function (request: Hapi.Request, reply) {
    //			log.debug(request.path + " endpoint invoked");
    //			throw new Error('Thrown');
    //		}
    //	},
    //	{
    //		path: '/test/blackhole',
    //		method: ["GET", "POST"],
    //		config: {//payload: { output: "data", parse: "gunzip" },
    //			auth: false, //don't require login
    //		},
    //		handler: function (request: Hapi.Request, reply) {
    //			log.debug(request.path + " endpoint invoked");
    //			//throw new Error('Thrown');
    //		}
    //	},
    //	{
    //		path: '/test/minuteDelay',
    //		method: ["GET", "POST"],
    //		config: {//payload: { output: "data", parse: "gunzip" },
    //			auth: false, //don't require login
    //		},
    //		handler: function (request: Hapi.Request, reply) {
    //			log.debug(request.path + " endpoint invoked");
    //			//throw new Error('Thrown');
    //			setTimeout(() => {
    //				reply("minuteDelay"); },1000*60);
    //		}
    //	}
    //]);
}
exports.initialize = initialize;
//# sourceMappingURL=connection.js.map