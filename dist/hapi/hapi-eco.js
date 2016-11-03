"use strict";
const xlib = require("xlib");
var log = new xlib.logging.Logger(__filename);
//import Url = require("url");
/** the main hapi library.  >=12.x  */
exports.hapi = require("hapi");
/** http client features plugin for hapi.  NOTE: for general purpose use, don't use this, use Axiom instead. (xlib.net.axiom)  The main problem with wreck is it doesn't support browser use. */
exports.wreck = require("wreck");
/**
 *  proxy plugin for hapi
 */
exports.h2o2 = require("h2o2");
/**
 * Static file module for hapi.
see http://hapijs.com/tutorials/serving-files
register via: server.register(require('inert'), function (err) {
 */
exports.inert = require("inert");
/** plugin for hapi for JWT token based auth.  ```server.register(require("hapi-auth-jwt2"), (err) => { ... });``` //JWT token auth: https://www.npmjs.com/package/hapi-auth-jwt2
IMPORTANT NOTE: your auth-token cookie MUST be named "token" for this plugin to work.
*/
exports.hapiAuthJwt2 = require("hapi-auth-jwt2");
var __ = xlib.lolo;
/** helper will configure your http+https connections.  This does standard boilerplate for you, that's all. */
exports.connection = require("./connection");
/**
 *  GOOGLE CLOUD SPECIFIC FUNCTIONALITY!!!!   though this might be useful for other systems that use load balancers (proxy) too.
 *  will extract the final client ip address, for use either when using a "bare" server or when using Google Compute's HTTP Load Balancer.
 *  searches request headers for "x-forwarded-for" to determine the client's ip.
 *  THIS IS SECURITY SENSITIVE!!!  if you are not using a proxy but still use this function, a user can spoof this header to impersonate another ip address.   be careful in using this!  it is infrastructure dependent.
 *
 * @param request
 */
function extractClientIpBareOrGCloudHttpLoadBalancer(request, forwardingSteps = 2, proxyIfRemoteAddressStartsWith = "130.211", ipIfInvalid = "0.0.0.0") {
    if (request.info.remoteAddress.indexOf(proxyIfRemoteAddressStartsWith) === 0) {
        try {
            let xFF = request.headers['x-forwarded-for'];
            if (xFF != null) {
                let xFFSplit = xFF.split(',');
                let targetHop = xFFSplit.length - forwardingSteps;
                let ip = xFFSplit[targetHop];
                return ip;
            }
            return request.info.remoteAddress;
        }
        catch (ex) {
            return ipIfInvalid;
        }
    }
    else {
        return request.info.remoteAddress;
    }
    ////from http://stackoverflow.com/questions/29496257/knowing-request-ip-in-hapi-js-restful-api
    //var xFF = request.headers['x-forwarded-for'];
    //var xFFSplit = xFF.split(',')
    //var targetHop = xFFSplit.length - forwardingSteps;
    //var ip = xFF ? xFFSplit[targetHop] : request.info.remoteAddress;
    //return ip;
}
exports.extractClientIpBareOrGCloudHttpLoadBalancer = extractClientIpBareOrGCloudHttpLoadBalancer;
/**
 * handles boilerplate for constructing a route that needs authentication.
 * @param path
 * @param handlerPromise
 * @param method
 * @param config
 */
function ezRouteConfigAuthRequired(path, 
    /** you should send successful results via .reply().   failures are automatically handled when you return a rejected promise */
    handlerPromise, 
    /** default = ["POST"]*/
    method = ["POST"], 
    /** default = { payload: { output: "data", parse: "gunzip" } } */
    config = {
        payload: { output: "data", parse: "gunzip" }
    }, 
    /** if false (the default) we return 200 success immediatly on HEAD requests.   however, you are supposed to return identical headers for GET and HEAD, so probably you want to set headers via your handler. */
    doHandlerOnHeadRequests = false) {
    let toReturn = {
        method,
        path,
        config,
        handler: (request, reply) => {
            log.debug("ezRouteConfigAuthRequired got request", { path, request: requestToJson(request) });
            if (request.method === "head" && doHandlerOnHeadRequests === false) {
                reply("");
                return;
            }
            let credentials = request.auth.credentials;
            handlerPromise(request, reply, credentials)
                .then((promisePayload) => {
                //success
                if (reply._replied == null) {
                    throw log.error("the IReply._replied property is/was an undocumented feature of Hapi 8.x, which informs the state of the reply.   it is now missing!??  figure out a replacement");
                }
                if (reply._replied !== true) {
                    //response not yet set
                    if (request.method === "head") {
                        reply("");
                    }
                    else {
                        let response = reply(promisePayload);
                    }
                }
            }, (errExecutingHandler) => {
                let replyBody = {
                    message: "Error invoking endpoint path=" + request.url.path,
                    statusCode: 500,
                };
                if (errExecutingHandler["statusCode"] != null) {
                    replyBody.statusCode = errExecutingHandler["statusCode"];
                }
                if (__.isLogDebug === true) {
                    replyBody["devMode_error"] = __.JSONX.inspectJSONify(errExecutingHandler, undefined, undefined, true);
                }
                log.warn(replyBody, errExecutingHandler);
                var response = reply(replyBody).code(replyBody.statusCode);
            })
                .catch((err) => {
                console.log("ERROR in hapi eco", err.toString());
            });
        },
    };
    return toReturn;
}
exports.ezRouteConfigAuthRequired = ezRouteConfigAuthRequired;
;
/**
 * construct a POJO object from the request, suitable for logging
 * @param request
 */
function requestToJson(request, options = {}) {
    let hapiRequestLogs;
    try {
        if (options.verboseRequestLogs === true) {
            hapiRequestLogs = request.getLog();
        }
        else {
            hapiRequestLogs = ["verbose logs disabled in requestToJson(options)"];
        }
    }
    catch (ex) {
        hapiRequestLogs = ["unable to get hapi request logs.  you must set server.connection({ routes: { log: true }as any }); to enable them."];
    }
    return {
        auth: request.auth,
        connectionInfo: request.connection.info,
        method: request.method,
        hapiRequestLogs: hapiRequestLogs,
        appState: request.app,
        domain: request.domain,
        headers: request.headers,
        info: request.info,
        mime: request.mime,
        orig: request.orig,
        params: request.params,
        paramsArray: request.paramsArray,
        path: request.path,
        payload: __.JSONX.inspectJSONify(request.payload),
        query: request.query,
        url: request.url,
        responseStatusCode: request.response == null ? null : request.response.statusCode,
    };
}
exports.requestToJson = requestToJson;
/**
 * handles boilerplate for constructing a route that needs authentication.
 * @param path
 * @param handlerPromise
 * @param method
 * @param config
 */
function ezRouteConfigNoAuth(path, 
    /** you should send successful results via .reply().   failures are automatically handled when you return a rejected promise */
    handlerPromise, 
    /** default = ["POST"]*/
    method = ["POST"], 
    /** default = { payload: { output: "data", parse: "gunzip" },auth: false } */
    config = {
        payload: { output: "data", parse: "gunzip" },
        auth: false,
    }, 
    /** if false (the default) we return 200 success immediatly on HEAD requests.   however, you are supposed to return identical headers for GET and HEAD, so probably you want to set headers via your handler. */
    doHandlerOnHeadRequests = false) {
    let toReturn = {
        method,
        path,
        config,
        handler: (request, reply) => {
            log.debug("ezRouteConfigNoAuth got request", { path, request: requestToJson(request) });
            if (request.method === "head" && doHandlerOnHeadRequests === false) {
                reply("");
                return;
            }
            handlerPromise(request, reply)
                .then((promisePayload) => {
                //success
                if (reply._replied !== true) {
                    //response not yet set
                    if (request.method === "head") {
                        reply("");
                    }
                    else {
                        let response = reply(promisePayload);
                    }
                }
            }, (errExecutingHandler) => {
                let replyBody = {
                    message: "ENDPOINT ERROR:" + request.url.path,
                    statusCode: 500,
                };
                if (errExecutingHandler["statusCode"] != null) {
                    replyBody.statusCode = errExecutingHandler["statusCode"];
                    replyBody.message = "ENDPOINT ERROR:" + errExecutingHandler.message;
                }
                if (__.isLogDebug === true) {
                    replyBody["devMode_error"] = __.JSONX.inspectJSONify(errExecutingHandler, undefined, undefined, true);
                }
                log.error(replyBody, errExecutingHandler);
                var response = reply(replyBody).code(replyBody.statusCode);
            });
        },
    };
    return toReturn;
}
exports.ezRouteConfigNoAuth = ezRouteConfigNoAuth;
;
//# sourceMappingURL=hapi-eco.js.map