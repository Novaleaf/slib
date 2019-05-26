import * as xlib from "xlib";
import __ = xlib.lolo;
import log = xlib.diagnostics.log;

import dns = require( "dns" );




/** array of all known disposable email domains, from:https://github.com/yzyjim/disposable-email-domain-list */
// tslint:disable-next-line: no-submodule-imports
const disposableEmailDomains: Set<string> = new Set( require( "disposable-email-domain-list/domains.json" ) );
const resolveMx = __.bb.promisify( dns.resolveMx );
const cachedMx = new xlib.collections.ExpiresMap<string, dns.MxRecord[]>( __.duration( { minutes: 30 } ) );

export interface IValidityResult {
	isValid: boolean;
	reason?: "email, invalid address" | "email, disposable domain" | "email, disposable domain via mxRecord" | "email, invalid mxRecord";
	details?: string;
}

/** returns a report on the validity of the email address (if MX records exist, if the domain is a disposable) */
export async function isEmailValid(
	email: string,
	options?: {
		/** set to true to check if valid mxRecords exist, and also checks the mxRecord against known disposable email providers.  
		 * default FALSE because this is pretty slow (100ms) but we cache mxRecords found for 30 minutes to accelerate further requests of same domain */
		checkMx?: boolean;
	}
): Promise<IValidityResult> {

	options = { ...options };

	let split = email.split( "@" );

	if ( split.length !== 2 ) {
		return { isValid: false, reason: "email, invalid address", details: "error parsing email address" };
	}
	let domain = split[ 1 ].toLowerCase();

	//search root domains in case they are using wildcards
	function checkDomainPartsForDisposable( _domain: string ): IValidityResult {
		let domainParts = domain.split( "." );
		while ( domainParts.length > 1 ) {
			const toCheck = domainParts.join( "." );
			if ( disposableEmailDomains.has( domain ) ) {
				return { isValid: false, reason: "email, disposable domain" };
			}
			domainParts.shift();
		}
		return { isValid: true };
	}
	{
		let disposableResult = checkDomainPartsForDisposable( domain );
		if ( disposableResult.isValid !== true ) {
			return disposableResult;
		}
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
				return { isValid: false, reason: "email, invalid mxRecord", details: "no dns.mxRecord" };
			}

			for ( const mxRec of mxRecords ) {
				let disposableResult = checkDomainPartsForDisposable( mxRec.exchange );
				if ( disposableResult.isValid !== true ) {
					return { isValid: false, reason: "email, disposable domain via mxRecord", details: disposableResult.details };
				}
			}


		} catch ( _err ) {
			const err = __.diag.toError( _err );
			return { isValid: false, reason: "email, invalid mxRecord", details: err.message };
		}
	}
	return { isValid: true };

}



// async function _init() {




// }
// const _initPromise = _init();


