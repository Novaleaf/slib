import slib = require( "../_entrypoint" );
import xlib = require( "xlib" );
import log = xlib.diagnostics.log;
import __ = xlib.lolo;

// tslint:disable-next-line: no-submodule-imports
import { it1, it2 } from "xlib/built/_test/mocha-helper";


describe( "saas-abuse tests", () => {
	describe( "UseLimitFraudCheck", () => {
		let useLimitFraudCheck: slib.patterns.saas_abuse.UseLimitFraudCheck;
		let checkOptions = {
			maxValidUses: 5,
			blacklistDuration: 5000,
			blacklistImmediateUses: 10,
			obfuscateBlacklistDelayMs: 500,
			sampleWindowMs: __.duration( { seconds: 5 } ),
		};
		before( () => {
			useLimitFraudCheck = new slib.patterns.saas_abuse.UseLimitFraudCheck( checkOptions );
		} );

		it( "basic-stress", function basicStress() {
			//! 5 users rapidly accessing the same resource should be ok.

			let users = [ 1, 2, 3, 4, 5 ];
			let resource = "basic-valid";
			for ( let i = 0; i < 1000; i++ ) {
				let user = users[ __.num.randomInt( 0, users.length ) ].toString();
				let { isAbuse, preventAccess } = useLimitFraudCheck.checkUse( user, resource );
				log.throwCheck( preventAccess === false && isAbuse === false, `${ resource } use checks should always succeed.  failied try "${ i }" for user "${ user }"` );
			}

		} );

		it( "async limit of valid use", async function asyncLimitOfValidUse() {
			//! this asynchronously schedules a number of test passes, all meant to pass legit use limits, but just bairly;
			let allAsyncTries: PromiseLike<any>[] = [];
			let start = __.utc();
			let passes = [ "a", "b", "c" ];
			let isFailed = false;

			for ( const pass of passes ) {
				//load up OK use tests
				//for ( let i = 0; i < 10; i++ ) {

				let max = 10;

				let tryPromise = new __.bb<void>( ( resolve, reject ) => {

					function scheduleTry( i: number ) {
						setTimeout( () => {
							if ( isFailed === true ) {
								//another try of this test failed, so stop.
								resolve();
								return;
							}
							try {
								log.info( `resource "${ pass }-valid" try ${ i } at ${ __.utc().diff( start ).as( "milliseconds" ) }ms ` );
								let useInfo = useLimitFraudCheck.checkUse( i.toString(), `${ pass }-valid` );
								log.throwCheck( useInfo.isAbuse === false && useInfo.preventAccess === false, `a-valid use checks should always succeed.  failied try ${ i }` );

								if ( i < max ) {
									scheduleTry( i + 1 );
								} else {
									resolve();
								}

							} catch ( _err ) {
								isFailed = true;
								reject( _err );
								return;
							}



						}, 1000 ); //trigger one request every seconds  (max valid is 5 requests in 5 seconds)
					}
					scheduleTry( 0 );

				} );
				allAsyncTries.push( tryPromise );
				//}
			}

			return __.bb.all( allAsyncTries );



		} ).timeout( 12000 );

		it( "async verify blacklist and blacklist expire", async function asyncVerifyBlacklistAndBlacklistExpire() {

			let start = __.utc();
			let resource = "verlify-blacklisted";
			for ( let i = 0; i < useLimitFraudCheck.options.maxValidUses; i++ ) {
				let { isAbuse, preventAccess } = useLimitFraudCheck.checkUse( i.toString(), resource );
				log.throwCheck( preventAccess === false, `these first tries should succeed.  failied try "${ i }"` );
			}
			//next should not fail, but the resource should be flagged for blacklisting soon
			{
				log.info( `verify blacklist will start, but hasn't yet, then will sleep for ${ useLimitFraudCheck.options.obfuscateBlacklistDelayMs.valueOf() }ms` );
				let resourceInfo = useLimitFraudCheck._storage.get( resource );
				log.throwCheck( resourceInfo.blacklistExpires == null && resourceInfo.blacklistStarts == null, "should not yet be blacklisted" );
				let useInfo = useLimitFraudCheck.checkUse( "b", resource );
				log.throwCheck( useInfo.preventAccess === false && useInfo.isAbuse === true, `${ resource } should not fail, but be blacklisted soon` );
				log.throwCheck( resourceInfo.blacklistExpires == null && resourceInfo.blacklistStarts != null, "should be blacklisted soon" );
				log.throwCheck( resourceInfo.blacklistStarts.valueOf() > __.utc().valueOf(), "expected to be blacklisted soon, but not yet" );
				await __.bb.delay( useLimitFraudCheck.options.obfuscateBlacklistDelayMs.valueOf() );
				let finishBlacklistDelay = Math.max( checkOptions.sampleWindowMs.valueOf(), checkOptions.blacklistDuration.valueOf() );
				log.info( `verify blacklist has started, then sleep for ${ finishBlacklistDelay / 1000 } seconds` );
				useInfo = useLimitFraudCheck.checkUse( "b", resource );
				log.throwCheck( useInfo.preventAccess === true && useInfo.isAbuse === true, `we waited for the blacklistDelay.  ${ resource } should now be blacklisted` );
				await __.bb.delay( finishBlacklistDelay );
				log.info( `verify resource is not blacklisted anymore` );
				useInfo = useLimitFraudCheck.checkUse( "b", resource );
				log.throwCheck( useInfo.preventAccess === false && useInfo.isAbuse === false, `${ resource } should not fail, no longer blacklisted` );
				log.throwCheck( resourceInfo.blacklistExpires == null && resourceInfo.blacklistStarts == null && resourceInfo.requests.size === 1, "resource info unexpected", { resourceInfo } );
			}
		} ).timeout( Math.max( checkOptions.sampleWindowMs.valueOf(), checkOptions.blacklistDuration.valueOf() ) + checkOptions.obfuscateBlacklistDelayMs.valueOf() + 1000 );

	} );


	describe( "net request lib tests", () => {


		it1( async function testRequestLib_basicE2e() {
			const response = await slib.net.request( { url: "http://example.com" } );
			log.throwCheck( xlib.reflection.getTypeName( response.body ) === "Buffer", "body not Buffer" );
			log.throwCheck( ( response.body.toString() ).includes( "Example Domain" ), "expect example.com to include 'Example Domain'" );
		} );

		it1( async function testRequestLib_technicalFailure_invalidProtocol() {
			let caughtErr = false;
			try {
				await slib.net.request( { url: "hXXPTT://lkajsfduiasreiul.coiaoidfal" } );
			} catch ( _err ) {
				caughtErr = true;
				log.info( "verified error thrown as expected by invalid reqeust() call", { _err, type: xlib.reflection.getTypeName( _err ) } );

				log.throwCheck( _err instanceof slib.net.RequestException, "not instance of RequestError" );
				let err: slib.net.RequestException = _err;

				log.throwCheck( err.code === "Invalid protocol", `unknown err.code`, err );

				// if ( _err instanceof xlib.net.RequestError ) {

				// }
			}
			log.throwCheck( caughtErr === true, "error was not thrown by request() as we expected" );
		} );

		it1( async function testRequestLib_technicalFailure_ENOTFOUND() {
			let caughtErr = false;
			try {
				await slib.net.request( { url: "http://lkajsfduiasreiul.coiaoidfal" } );
			} catch ( _err ) {
				caughtErr = true;
				log.info( "verified error thrown as expected by invalid reqeust() call", { _err, type: xlib.reflection.getTypeName( _err ) } );

				log.throwCheck( _err instanceof slib.net.RequestException, "not instance of RequestError" );
				let err: slib.net.RequestException = _err;

				log.throwCheck( err.code === "ENOTFOUND", `unknown err.code`, err );

				// if ( _err instanceof xlib.net.RequestError ) {

				// }
			}
			log.throwCheck( caughtErr === true, "error was not thrown by request() as we expected" );
		} );

		it1( async function testRequestLib_404() {
			let caughtErr = false;
			let payload = await slib.net.request( { url: "http://www.example.com/blalkjaseursj" } );

			log.throwCheck( payload.response.statusCode === 404, "response should be 404 not found", payload.response.statusCode );

		} );
		it1( async function testRequestLib_technicalFailure_ECONNRESET() {
			let caughtErr = false; let payload: any;
			try {
				payload = await slib.net.request( { url: "https://www.novaleaf.com" } );
			} catch ( _err ) {
				caughtErr = true;
				log.info( "verified error thrown as expected by invalid reqeust() call", { _err, type: xlib.reflection.getTypeName( _err ) } );

				log.throwCheck( _err instanceof slib.net.RequestException, "not instance of RequestError" );
				let err: slib.net.RequestException = _err;

				log.throwCheck( err.code === "ECONNRESET", `unknown err.code`, err );

				// if ( _err instanceof xlib.net.RequestError ) {

				// }
			}
			log.throwCheck( caughtErr === true, "error was not thrown by request() as we expected", payload );
		} );



	} );
} );

describe( "valididty_module", () => {

	it2( async function checkValidEmails() {

		{
			let email = "jasons@novaleaf.com";
			let result = await slib.validation.isEmailValid( email );
			log.throwCheck( result.isValid === true, "should succeed", { email, result } );
		}
		{
			let email = "jasons@novaleaf.com";
			let result = await slib.validation.isEmailValid( email, { checkMx: true } );
			log.throwCheck( result.isValid === true, "should succeed", { email, result } );
		}
		{
			let email = "someone@domain-dowsnt-exist-alskjdfadd.com";
			let result = await slib.validation.isEmailValid( email );
			log.throwCheck( result.isValid === true, "should succeed", { email, result } );
		}
		{
			let email = "someone@domain-dowsnt-exist-alskjdfadd.com";
			let result = await slib.validation.isEmailValid( email, { checkMx: true } );
			log.throwCheck( result.isValid === false, "should fail, invalid mx", { email, result } );
		}
		{
			let email = "someone@sharklasers.com";
			let result = await slib.validation.isEmailValid( email );
			log.throwCheck( result.isValid === false, "should fail, disposable email", { email, result } );
		}

	} );

} );
