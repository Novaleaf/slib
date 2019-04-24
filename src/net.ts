import * as xlib from "xlib";
import * as _requestLib from "request";
import __ = xlib.lolo;

import * as http from "http";
export import URL = require( "url" );

/**
 * Sames are Node's url.parse() just adds the 'username', 'password' and 'scheme' fields.
 * 
 * Note that `scheme` is always lower-cased (e.g. `ftp`).
 * @param url
 * @ignore
 */
export function parseUrl( url: string ) {
	var parsed: URL.UrlWithStringQuery & { username?: string; password?: string; scheme?: string; } = URL.parse( url );


	parsed.username = null;
	parsed.password = null;
	parsed.scheme = null;

	if ( parsed.auth != null ) {

		const matches = /^([^:]+)(:?)(.*)$/.exec( parsed.auth );
		if ( matches && matches.length === 4 ) {
			parsed.username = matches[ 1 ];
			if ( matches[ 2 ] === ':' ) parsed.password = matches[ 3 ];
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
};

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
			const result = await xlib.net.request( { url: "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", headers: { "Metadata-Flavor": "Google" }, method: "GET" } );
			if ( result.statusCode === 200 ) {
				return result.body;
			}
		} catch{ }
		try {
			//AWS or Azure
			const result = await xlib.net.request( { url: "http://169.254.169.254/latest/meta-data/public-ipv4", method: "GET" } );
			if ( result.statusCode === 200 ) {
				return result.body;
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
 * @param request
 */
	export function extractClientIpBareOrGCloudHttpLoadBalancer(
		/** works directly with hapi's request object */
		request: { info: { remoteAddress: string; }; headers: Record<string, string>; },
		forwardingSteps = 2,
		proxyIfRemoteAddressStartsWith = "130.211",
		ipIfInvalid = "0.0.0.0" ) {

		if ( request.info.remoteAddress.indexOf( proxyIfRemoteAddressStartsWith ) === 0 ) {
			try {
				let xFF = request.headers[ 'x-forwarded-for' ];
				if ( xFF != null ) {
					let xFFSplit = xFF.split( ',' );
					let targetHop = xFFSplit.length - forwardingSteps;
					let ip = xFFSplit[ targetHop ];
					return ip;
				}
				return request.info.remoteAddress;
			} catch ( ex ) {
				return ipIfInvalid;
			}
		} else {
			return request.info.remoteAddress;
		}

	}
}
