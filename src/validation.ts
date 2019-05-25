import * as xlib from "xlib";
import __ = xlib.lolo;
import log = xlib.diagnostics.log;

import dns = require( "dns" );




/** array of all known disposable email domains, from:https://github.com/yzyjim/disposable-email-domain-list */
// tslint:disable-next-line: no-submodule-imports
const disposableEmailDomains: Set<string> = new Set( require( "disposable-email-domain-list/domains.json" ) );
const resolveMx = __.bb.promisify( dns.resolveMx );
const cachedMx = new xlib.collections.ExpiresMap<string, dns.MxRecord[]>( __.duration( { minutes: 10 } ) );

interface IValidityResult { isValid: boolean; reason?: string; }

/** returns a report on the validity of the email address (if MX records exist, if the domain is a disposable) */
export async function isEmailValid(
	email: string,
	options?: {
		/** set to true to check if valid mxRecords exist.  default FALSE because this is pretty slow (but we cache mxRecords found for 10 minutes to accelerate further requests of same domain) */
		checkMx?: boolean;
	}
): Promise<IValidityResult> {

	options = { ...options };

	let split = email.split( "@" );

	if ( split.length !== 2 ) {
		return { isValid: false, reason: "email invalid format" };
	}
	let domain = split[ 1 ].toLowerCase();

	if ( disposableEmailDomains.has( domain ) ) {
		return { isValid: false, reason: "disposable email address" };
	}
	if ( options.checkMx === true ) {
		try {



			let mxRecords = cachedMx.get( domain );
			if ( mxRecords === undefined ) {
				mxRecords = await resolveMx( domain );
				if ( mxRecords === undefined ) {
					cachedMx.set( domain, null );
				} else {
					cachedMx.set( domain, mxRecords );
				}
			}
			if ( mxRecords == null || mxRecords.length === 0 ) {
				return { isValid: false, reason: `no mxRecord` };
			}
		} catch ( _err ) {
			const err = __.diag.toError( _err );
			return { isValid: false, reason: `invalid mxRecord.  detail=${ err.message }` };
		}
	}
	return { isValid: true };

}



// async function _init() {




// }
// const _initPromise = _init();


