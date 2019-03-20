import * as xlib from "xlib";
import * as _requestLib from "request";
import __ = xlib.lolo;

import * as http from "http";

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
	*/
	export async function getExternalIp(): Promise<string> {

		try {
			//request.get( "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", { headers: { "Metadata-Flavor": "Google" } } );
			//await request( "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", { headers: { "Metadata-Flavor": "Google" } } );
			//_requestLib( { uri: "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", resolveWithFullResponse: true, simple: false }, ( response: ) => { } );

			//GCP
			const result = await xlib.net.axios.default.get( "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip", { headers: { "Metadata-Flavor": "Google" } } );
			if ( result.status === 200 ) {
				return result.data;
			}
		} catch{ }
		try {
			//AWS
			const result = await xlib.net.axios.default.get( "http://169.254.169.254/latest/meta-data/public-ipv4" );
			if ( result.status === 200 ) {
				return result.data;
			}
		} catch{ }
		try {
			//Azure
			const result = await xlib.net.axios.default.get( "http://169.254.169.254/latest/meta-data/public-ipv4" );
			if ( result.status === 200 ) {
				return result.data;
			}
		} catch{ }

		//xlib.net.axios.default.get( "http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/publicIpAddress?api-version=2017-08-01&format=text", { headers: { Metadata: true } } );
		return __.bb.reject( new Error( "can not determine external ip address.  only GCP,AWS, and Azure are supported" ) );


	}
}
