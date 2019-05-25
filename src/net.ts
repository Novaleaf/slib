import * as xlib from "xlib";
import * as _requestLib from "request";
import __ = xlib.lolo;
import bb = __.bb;

import * as http from "http";
export import URL = require( "url" );






import * as __request from "request";
export { __request };

import zlib = require( "zlib" );
export type IRequestOptions = {
	// /** a boolean to set whether status codes other than 2xx should also reject the promise.   by default we set this to FALSE.  (the request module sets it to true by default) 		 * 
	// */
	// simple?: boolean;
	// // /**  a boolean to set whether the promise should be resolved with the full response or just the response body
	// //  * 
	// //  * For our simple type definitions, we require this to be set to TRUE
	// //  */
	// // resolveWithFullResponse: true;

	/** if not explicitly set,  we set ```requestLibOptions.encoding=null```.  So the response body is a Buffer.  pass ```true``` here to use the requestLib default, which is to convert to utf8 */
	_slibDisableDefaultEncoding?: boolean;

} & __request.Options;


/** if a technical failure is encountered when processing the request, this is the rejection type.   
 * Note that a response statusCode of 400+ is not a technical failure (it will be be returned normally)
    */
export class RequestException extends __.Ex {

	/** the classification of the technical failure.   check  [[message]] for more details.
	 * 
	 * 
	 * 
	 * ```ECONNRESET```: could not connect properly.   maybe port is not open.
	 * 
	 * ```ETIMEDOUT```: session timeout
	 * 
	 * ```ESOCKETTIMEDOUT```: timeout
	 * 
	 * ```Invalid protocol```: rejection before submitting your request.  unknown protocol specified (check url)
	 * 
	 * ```ENOTFOUND```: dns lookup failed, etc
	 * 
	 * ```EPROTO```: ssl handshake failure, invalid cert, etc
	 * 
	 * ```UNKNOWN```: some other technical failure, but a code was not generated.   check [[message]] for details
	 * 
	 * 
	 * ***IMPORTANT NOTE***: codes other than those specified may be returned (for various rare system level technical errors).
	 * such as this list from https://www.npmjs.com/package/core-error-predicates?activeTab=readme#networkerror: 
	 * 
    EADDRINFO
    EADDRNOTAVAIL
    EAFNOSUPPORT
    EALREADY
    ECONNABORTED
    ECONNREFUSED
    ECONNRESET
    EDESTADDRREQ
    EHOSTUNREACH
    EISCONN
    EMSGSIZE
    ENETDOWN
    ENETUNREACH
    ENONET
    ENOTCONN
    ENOTSOCK
    ENOTSUP
    EPIPE
    EPROTO
    EPROTONOSUPPORT
    EPROTOTYPE
    ETIMEDOUT
    EAIFAMNOSUPPORT
    EAISERVICE
    EAISOCKTYPE
    ESHUTDOWN
		ENOTFOUND		
	*/
	public code: "ETIMEDOUT" | "ECONNRESET" | "ESOCKETTIMEDOUT" | "Invalid protocol" | "ENOTFOUND" | "EPROTO" | "UNKNOWN"
		| "ECONNABORTED" | "ECONNREFUSED" | "ENONET"
		;

	/** Set to `true` if the timeout was a connection timeout, `false`  otherwise. */
	public connect: boolean;

	constructor( message: string, _innerErr: any, public response: __request.Response, public requestOptions: IRequestOptions ) {
		super( message, { innerError: _innerErr } );

		this.code = _innerErr.code;
		this.connect = _innerErr.connect === true;

		if ( this.code == null ) {
			if ( this.innerError.message != null && this.innerError.message.startsWith( "Invalid protocol" ) ) {
				this.code = "Invalid protocol";
			} else {
				this.code = "UNKNOWN";
			}
		}

	}

}


export interface IResponsePayload {
	response: __request.Response;
	body: Buffer;
}
/** make a network request.    Pass ```options.simple=false``` to get a normal response for non 2xx statusCodes.  
 * 
 * we wrap any errors returned from underlying calls inside a [[RequestException]] object and reject with that.
 * 
 * internally we use the ```request``` library.   https://www.npmjs.com/package/request.  
 * 
 * We switched from ```axios``` because it has persistant bugs around proxy and httpsAgent support.
 * 
 */
export async function request(
	/** ***IMPORTANT***. by default we set ```simple=false```, which means 4xx errors will not throw exceptions  */
	options: IRequestOptions
): Promise<IResponsePayload> {

	if ( options._slibDisableDefaultEncoding !== true && options.encoding === undefined ) {
		options.encoding = null;
	}


	// if ( options.headers != null ) {
	// 	_.forEach( options.headers, ( value, key ) => {
	// 		let lowerKey = key.toLowerCase();
	// 		switch ( lowerKey ) {
	// 			case "accept-encoding":
	// 				//user is allowing compression, so set our related option so compressed results are decompressed properly
	// 				options.gzip = true;
	// 				break;
	// 		}
	// 	} );
	// }


	let toReturn = new bb<{ response: __request.Response; body: Buffer; }>( ( resolve, reject ) => {

		__request.default( options, ( _err, response, body ) => {
			if ( _err != null ) {
				reject( new RequestException( "Request call resulted in error.", _err, response, options ) );
				return;
			}

			// https://stackoverflow.com/questions/10355856/how-to-append-binary-data-to-a-buffer-in-node-js
			// https://stackoverflow.com/questions/10207762/how-to-use-request-or-http-module-to-read-gzip-page-into-a-string
			// let bodyBuffer = Buffer.alloc( 0 );
			// let output: zlib.Gunzip | zlib.Inflate| __request.Response;
			// if ( options.gzip !== true ) {
			// 	if ( response.headers[ "content-encoding" ] === "gzip" ) {
			// 		output = zlib.createGunzip();
			// 		response.pipe( output );
			// 	} else if ( response.headers[ "content-encoding" ] === "deflate" ) {
			// 		output = zlib.createInflate();
			// 		response.pipe( output );
			// 	} else {
			// 		output = response;
			// 	}

			// 	output.on( "data", ( data: Buffer ) => {
			// 		bodyBuffer = Buffer.concat( [ bodyBuffer, data ] );
			// 	 } );



			// 	if ( decompressor != null ) {
			// 		response.pipe( decompressor );
			// 		let newBody: string = "";
			// 		decompressor.on( "data", ( data:Buffer ) => {

			// 			data = data.toString("utf-8")
			// 		 })
			// 	}

			// }


			resolve( { response, body } );
			return;
		} );

	} );


	//let toReturn = __requestPromiseAny.default( { simple: false, ...options, resolveWithFullResponse: true, } );
	return toReturn;
}

/** invokes [[request]]() but also ensures response body is of type ```application/json```, automatically parses it, and returns it as an extra parameter.
*
* additionally, if you submit an ```options.body``` as an object, we automatically convert it to a string for submission
*/
export async function requestJson<TResponseBody>( options: IRequestOptions & {
	/**optional.  pass TRUE to require the "content-type" header to be set to "application/json".  Default is FALSE.  */
	requireJsonHeader?: boolean;
} ) {

	if ( options.body != null && typeof ( options.body ) === "object" ) {
		//convert to string for sending
		options.body = JSON.stringify( options.body );
	}

	const payload = await request( options );
	if ( options.requireJsonHeader === true && __.str.indexOf( payload.response.headers[ "content-type" ], "application/json", true ) < 0 ) {
		throw new __.Ex( `xlib.net.requestJson(): wrong content type.   expected "application/json" but got ${ payload.response.headers[ "content-type" ] }` );
	}
	try {

		const body: TResponseBody = typeof ( payload.body.toString != null ) ? JSON.parse( payload.body.toString() ) : payload.body;
		return {
			response: payload.response,
			body,
		};
	} catch ( _err ) {
		throw new __.Ex( `xlib.net.requestJson(): can not parse response.body`, { innerError: _err } );
	}
}



// import * as types from "./types";


// type RequestResponse<TResponseBody = any> = types.PropsUnion<{ body: TResponseBody }, __request.Response>;


// // tslint:disable-next-line: no-submodule-imports
// const __requestPromiseAnyErrors: any = require( "request-promise-any/errors" );

// /** if the request has options.simple=true and a non 2xxx code is returned, this Error type will be thrown */
// declare class _StatusCodeError extends Error {
// 	/** the non 2xx statusCode returned. */
// 	statusCode: number;
// 	/** the body of the response */
// 	error: string;
// 	options: __request.Options;
// 	response: __request.Response;
// }	/** if the request fails for technical reasons, this Error type will be thrown */
// declare class _RequestError extends Error {
// 	/** the root cause passed by the request library */
// 	cause: Error;
// 	error: Error;
// 	options: __request.Options;
// 	response: __request.Response;
// }
// import requestErrors = require( "request-promise-any/errors" );
// StatusCodeError = requestErrors.StatusCodeError;


// //export import requestErrors = require( "request-promise-any/errors" );

// // tslint:disable-next-line: no-submodule-imports
//import { RequestError, StatusCodeError } from "request-promise-any/errors";
//export StatusCodeError;
// export const RequestError: typeof _RequestError = __requestPromiseAnyErrors.RequestError;
// export const StatusCodeError: typeof _StatusCodeError = __requestPromiseAnyErrors.StatusCodeError;


// export import requestErrors = require( "request-promise-any/errors" );

// export const testErr:typeof(requestErrors.RequestError);


// import * as __errors from "request-promise-any/errors";
// export const RequestError:_RequestError = __RequestError;

// export type RequestError = __rp.RequestError;
// export type StatusCodeError = __rp.StatusCodeError;



/**
 * Sames are Node's url.parse() just adds the 'username', 'password' and 'scheme' fields.
 * 
 * Note that `scheme` is always lower-cased (e.g. `ftp`).
 * @param url
 * @ignore
 */
export function parseUrl( url: string ) {
	let parsed: URL.UrlWithStringQuery & { username?: string; password?: string; scheme?: string; } = URL.parse( url );


	parsed.username = null;
	parsed.password = null;
	parsed.scheme = null;

	if ( parsed.auth != null ) {

		const matches = /^([^:]+)(:?)(.*)$/.exec( parsed.auth );
		if ( matches && matches.length === 4 ) {
			parsed.username = matches[ 1 ];
			if ( matches[ 2 ] === ':' ) { parsed.password = matches[ 3 ]; }
		}
	}

	if ( parsed.protocol != null ) {
		const _matches = /^([a-z0-9]+):$/i.exec( parsed.protocol );
		if ( _matches && _matches.length === 2 ) {
			parsed.scheme = _matches[ 1 ];
		}
	}

	// //Also this method makes sure "port" is a number rather than a string.
	// if (parsed.port) {
	// 		parsed.port = parseInt(parsed.port, 10);
	// }

	return parsed;
}

// /**  */
// export function request( options: _requestLib.Options & { throwOnError?: boolean;  } ) {

// 	//const finalOptions = { ...options, simple: false, resolveWithFullResponse: true };

// 	return new __.bb( ( resolve, reject, onCancel ) => {


// 		( _requestLib as any )( options, ( error: Error, response: _requestLib.Response, body: string | Buffer | {} ) => {


// 	 } );


// 	 } );

// }


/** vm specific network features.   These work on google cloud, but some work on other providers */
export namespace vm {
	/** External IP address of the VM.   Works on google cloud, AWS, or Azure.
	 * 
	 * solution from: https://stackoverflow.com/questions/23362887/can-you-get-external-ip-address-from-within-a-google-compute-vm-instance
	
	for example, on google you could do ```curl --header "Metadata-Flavor:Google" http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip```
	*/
	export async function getExternalIp(): Promise<string> {

		try {
			//request.get( "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", { headers: { "Metadata-Flavor": "Google" } } );
			//await request( "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", { headers: { "Metadata-Flavor": "Google" } } );
			//_requestLib( { uri: "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", resolveWithFullResponse: true, simple: false }, ( response: ) => { } );

			//GCP   //curl --header "Metadata-Flavor:Google" http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip
			const result = await request( { url: "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", headers: { "Metadata-Flavor": "Google" }, method: "GET" } );
			if ( result.response.statusCode === 200 ) {
				return result.body.toString();
			}
		} catch{ }
		try {
			//AWS or Azure
			const result = await request( { url: "http://169.254.169.254/latest/meta-data/public-ipv4", method: "GET" } );
			if ( result.response.statusCode === 200 ) {
				return result.body.toString();
			}
		} catch{ }
		// try {
		// 	//Azure
		// 	const result = await xlib.net.request( {url:"http://169.254.169.254/latest/meta-data/public-ipv4" , method:"GET" } );
		// 	if ( result.statusCode === 200 ) {
		// 		return result.data;
		// 	}
		// } catch{ }

		//xlib.net.axios.default.get( "http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/publicIpAddress?api-version=2017-08-01&format=text", { headers: { Metadata: true } } );
		return __.bb.reject( new Error( "can not determine external ip address.  only GCP,AWS, and Azure are supported" ) );


	}

	/**
 *  extract the final client ip address, for use either when using a "bare" server or when using Google Compute's HTTP Load Balancer.
 *  
 * @param req
 */
	export function extractClientIpBareOrGCloudHttpLoadBalancer(
		/** works directly with hapi's request object */
		req: { info: { remoteAddress: string; }; headers: Record<string, string>; },
		forwardingSteps = 2,
		proxyIfRemoteAddressStartsWith = "130.211",
		ipIfInvalid = "0.0.0.0" ) {

		if ( req.info.remoteAddress.indexOf( proxyIfRemoteAddressStartsWith ) === 0 ) {
			try {
				let xFF = req.headers[ 'x-forwarded-for' ];
				if ( xFF != null ) {
					let xFFSplit = xFF.split( ',' );
					let targetHop = xFFSplit.length - forwardingSteps;
					let ip = xFFSplit[ targetHop ];
					return ip;
				}
				return req.info.remoteAddress;
			} catch ( ex ) {
				return ipIfInvalid;
			}
		} else {
			return req.info.remoteAddress;
		}

	}
}
