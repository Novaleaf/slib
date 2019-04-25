import slib = require( "../_entrypoint" );
import xlib = require( "xlib" );
import log = xlib.diagnostics.log;
import __ = xlib.lolo;



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
				let isBlacklisted = useLimitFraudCheck.isBlacklisted( user, resource );
				log.throwCheck( isBlacklisted === false, `${ resource } use checks should always succeed.  failied try "${ i }" for user "${ user }"` );
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
								let isBlacklisted = useLimitFraudCheck.isBlacklisted( i.toString(), `${ pass }-valid` );
								log.throwCheck( isBlacklisted === false, `a-valid use checks should always succeed.  failied try ${ i }` );

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
				let isBlacklisted = useLimitFraudCheck.isBlacklisted( i.toString(), resource );
				log.throwCheck( isBlacklisted === false, `these first tries should succeed.  failied try "${ i }"` );
			}
			//next should not fail, but the resource should be flagged for blacklisting soon
			{
				log.info( `verify blacklist will start, but hasn't yet, then will sleep for ${ useLimitFraudCheck.options.obfuscateBlacklistDelayMs.valueOf() }ms` );
				let resourceInfo = useLimitFraudCheck._storage.get( resource );
				log.throwCheck( resourceInfo.blacklistExpires == null && resourceInfo.blacklistStarts == null, "should not yet be blacklisted" );
				let isBlacklisted = useLimitFraudCheck.isBlacklisted( "b", resource );
				log.throwCheck( isBlacklisted === false, `${ resource } should not fail, but be blacklisted soon` );
				log.throwCheck( resourceInfo.blacklistExpires == null && resourceInfo.blacklistStarts != null, "should be blacklisted soon" );
				log.throwCheck( resourceInfo.blacklistStarts.valueOf() > __.utc().valueOf(), "expected to be blacklisted soon, but not yet" );
				await __.bb.delay( useLimitFraudCheck.options.obfuscateBlacklistDelayMs.valueOf() );
				let finishBlacklistDelay = Math.max( checkOptions.sampleWindowMs.valueOf(), checkOptions.blacklistDuration.valueOf() );
				log.info( `verify blacklist has started, then sleep for ${ finishBlacklistDelay / 1000 } seconds` );
				isBlacklisted = useLimitFraudCheck.isBlacklisted( "b", resource );
				log.throwCheck( isBlacklisted === true, `we waited for the blacklistDelay.  ${ resource } should now be blacklisted` );
				await __.bb.delay( finishBlacklistDelay );
				log.info( `verify resource is not blacklisted anymore` );
				isBlacklisted = useLimitFraudCheck.isBlacklisted( "b", resource );
				log.throwCheck( isBlacklisted === false, `${ resource } should not fail, no longer blacklisted` );
				log.throwCheck( resourceInfo.blacklistExpires == null && resourceInfo.blacklistStarts == null && resourceInfo.requests.size === 1, "resource info unexpected", { resourceInfo } );
			}
		} ).timeout( Math.max( checkOptions.sampleWindowMs.valueOf(), checkOptions.blacklistDuration.valueOf() ) + checkOptions.obfuscateBlacklistDelayMs.valueOf() + 1000 );

	} );




} );
