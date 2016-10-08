//import refs = require("../refs");

import file = require("../../file");


import xlib = require("xlib");

import Promise = xlib.promise.bluebird;

import Hapi = require("hapi");

var log = new xlib.logging.Logger(__filename);

import Url = require("url");

import __ = xlib.lolo;

import hapiEco = require("./hapi-eco");




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
export function initialize(server: Hapi.Server, _options?: {
    tls?: {
        keyPath: string;
        certPath: string;
    };
	/**if true, any requests other than those that contain "/metrics/" in the path will be redirected to HTTPS*/
    isHttpsOnly?: boolean;
    httpPort?: number;
    httpsPort?: number;
	/** if false (the default), will construct a "/metrics/simpleHealthCheck" endpoint that returns "OK" */
	disableSimpleHealthCheckEndpoint?: boolean;
}) {

	let options: {
		tls?: {
			keyPath: string;
			certPath: string;
		};
		/**if true, any requests other than those that contain "/metrics/" in the path will be redirected to HTTPS*/
		isHttpsOnly: boolean;
		httpPort: number;
		httpsPort: number;
		/** if false (the default), will construct a "/metrics/simpleHealthCheck" endpoint that returns "OK" */
		disableSimpleHealthCheckEndpoint?: boolean;
	};

	if (_options == null) {
		options = {} as any;
	} else {
		options = _options as any;
	}
    options.isHttpsOnly = __.defaultIfNull(options.isHttpsOnly, false);
    options.httpPort = __.defaultIfNull(options.httpPort, 80);
    options.httpsPort = __.defaultIfNull(options.httpsPort, 443);


    let _tlsKeys: { key: Buffer; cert: Buffer } | null= null;
    if (options.tls != null) {
        _tlsKeys = {
			key: file.fsPromise.readFileSync(options.tls.keyPath),
			cert: file.fsPromise.readFileSync(options.tls.certPath),
        };
    }

    //configure for http
    server.connection({ port: options.httpPort });

    //configure for https
    if (_tlsKeys != null) {

        let httpsConnectionOptions: Hapi.IServerConnectionOptions = {
            port: options.httpsPort,
            tls: _tlsKeys,

        };
        server.connection(httpsConnectionOptions);
    }

    //redirect http requests if option is set.


	if (options.isHttpsOnly) {
		server.ext("onRequest", (request, reply) => {  //taken from http://stackoverflow.com/questions/28650829/hapijs-using-both-http-and-https-on-one-connection

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
		}, ["GET", "POST"]
			, {
				//payload: { output: "data", parse: "gunzip" },
				auth: false, //don't require login
			}
		);

		server.route(routeConfig);
	}

	//setup error listening
	server.on('request-error', function (request: Hapi.Request, err:Error) {
		//console.log(err.data.stack);		
		log.error("nlib.hapi-eco.connection.server.on.request-error", { request: hapiEco.requestToJson(request) }, err);
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