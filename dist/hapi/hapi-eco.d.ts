import xlib = require("xlib");
import Promise = xlib.promise.bluebird;
/** the main hapi library.  >=12.x  */
export import hapi = require("hapi");
/** http client features plugin for hapi.  NOTE: for general purpose use, don't use this, use Axiom instead. (xlib.net.axiom)  The main problem with wreck is it doesn't support browser use. */
export declare let wreck: any;
/**
 *  proxy plugin for hapi
 */
export declare let h2o2: any;
/**
 * Static file module for hapi.
see http://hapijs.com/tutorials/serving-files
register via: server.register(require('inert'), function (err) {
 */
export declare var inert: any;
/** plugin for hapi for JWT token based auth.  ```server.register(require("hapi-auth-jwt2"), (err) => { ... });``` //JWT token auth: https://www.npmjs.com/package/hapi-auth-jwt2
IMPORTANT NOTE: your auth-token cookie MUST be named "token" for this plugin to work.
*/
export declare var hapiAuthJwt2: any;
/** helper will configure your http+https connections.  This does standard boilerplate for you, that's all. */
export import connection = require("./connection");
/**
 *  GOOGLE CLOUD SPECIFIC FUNCTIONALITY!!!!   though this might be useful for other systems that use load balancers (proxy) too.
 *  will extract the final client ip address, for use either when using a "bare" server or when using Google Compute's HTTP Load Balancer.
 *  searches request headers for "x-forwarded-for" to determine the client's ip.
 *  THIS IS SECURITY SENSITIVE!!!  if you are not using a proxy but still use this function, a user can spoof this header to impersonate another ip address.   be careful in using this!  it is infrastructure dependent.
 *
 * @param request
 */
export declare function extractClientIpBareOrGCloudHttpLoadBalancer(request: hapi.Request, forwardingSteps?: number, proxyIfRemoteAddressStartsWith?: string, ipIfInvalid?: string): string;
/**
 * handles boilerplate for constructing a route that needs authentication.
 * @param path
 * @param handlerPromise
 * @param method
 * @param config
 */
export declare function ezRouteConfigAuthRequired<TPayloadOut, TJwtAuthPayload>(path: string, 
    /** you should send successful results via .reply().   failures are automatically handled when you return a rejected promise */
    handlerPromise: (request: hapi.Request, reply: hapi.IReply, credentials: TJwtAuthPayload) => Promise<TPayloadOut>, 
    /** default = ["POST"]*/
    method?: string[], 
    /** default = { payload: { output: "data", parse: "gunzip" } } */
    config?: {
    payload: {
        output: string;
        parse: string;
    };
}, 
    /** if false (the default) we return 200 success immediatly on HEAD requests.   however, you are supposed to return identical headers for GET and HEAD, so probably you want to set headers via your handler. */
    doHandlerOnHeadRequests?: boolean): hapi.IRouteConfiguration;
/**
 * construct a POJO object from the request, suitable for logging
 * @param request
 */
export declare function requestToJson(request: hapi.Request, options?: {
    verboseRequestLogs?: boolean;
}): {
    auth: {
        isAuthenticated: boolean;
        credentials: any;
        artifacts: any;
        mode: any;
        error: any;
    };
    connectionInfo: hapi.IServerConnectionInfo;
    method: string;
    hapiRequestLogs: string[];
    appState: any;
    domain: any;
    headers: hapi.IDictionary<string>;
    info: {
        acceptEncoding: string;
        cors: {
            isOriginMatch: boolean;
        };
        host: string;
        hostname: string;
        received: number;
        referrer: string;
        remoteAddress: string;
        remotePort: number;
        responded: number;
    };
    mime: string;
    orig: {
        params: any;
        query: any;
        payload: any;
    };
    params: hapi.IDictionary<string>;
    paramsArray: string[];
    path: string;
    payload: any;
    query: any;
    url: {
        auth: any;
        hash: any;
        host: any;
        hostname: any;
        href: string;
        path: string;
        pathname: string;
        port: any;
        protocol: any;
        query: hapi.IDictionary<string>;
        search: string;
        slashes: any;
    };
    responseStatusCode: number | null;
};
/**
 * handles boilerplate for constructing a route that needs authentication.
 * @param path
 * @param handlerPromise
 * @param method
 * @param config
 */
export declare function ezRouteConfigNoAuth<TPayloadOut>(path: string, 
    /** you should send successful results via .reply().   failures are automatically handled when you return a rejected promise */
    handlerPromise: (request: hapi.Request, reply: hapi.IReply) => Promise<TPayloadOut>, 
    /** default = ["POST"]*/
    method?: string[], 
    /** default = { payload: { output: "data", parse: "gunzip" },auth: false } */
    config?: hapi.IRouteAdditionalConfigurationOptions, 
    /** if false (the default) we return 200 success immediatly on HEAD requests.   however, you are supposed to return identical headers for GET and HEAD, so probably you want to set headers via your handler. */
    doHandlerOnHeadRequests?: boolean): hapi.IRouteConfiguration;
