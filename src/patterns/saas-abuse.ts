import * as xlib from "xlib";
import * as _requestLib from "request";
import __ = xlib.lolo;



/** This is a specialized class used for commercial SAAS projects that have a free usage tier, and need to protect against abusive free-tier users.
 * 
 * tracks a given resource, ensuring that multiple (free tier) userIds/ip's are not accessing it to get around free usage limits.  
 * 
 * once the abuse threshhold is passed, future requests to the resource are blacklisted.*/
export class UseLimitFraudCheck {

	constructor( public options: {
		/** the maximum number of usages from seperate userIds to allow during a sample window.   example = 5 */
		maxValidUses: number;
		/** how long to track usages.   only usages in this interval are considered.  example = 5min. */
		sampleWindowMs: number | xlib.time.luxon.Duration;
		/** if max uses is reached, we will blacklist.   but delay by this long to make the blacklist reason less obvious.  example = 5min. */
		obfuscateBlacklistDelayMs: number | xlib.time.luxon.Duration;
		/** if this number of uses is reached while we are obfuscating (delay blacklisting) we will blacklist immediately.  example value=10 */
		blacklistImmediateUses: number;
		/** once blacklisted, how long you want the blacklist to take effect.  example value=1day */
		blacklistDuration: number | xlib.time.luxon.Duration;
	} ) { }



	/** @hidden
	 * 
	 * ```Do not use.   exposed for debugging purposes only.```
	 * 
	 * stores all resources and their associated tracking data.  key = resource 
	 * 
	 */
	public _storage = new Map<string, IResourceInfo>();


	/** private helper that cleans up an entry in our _storage Map. */
	private _doHousekeeping( resource: string ) {
		let resourceInfo = this._storage.get( resource );
		if ( resourceInfo == null ) {
			return;
		}
		let now = __.utc();
		//clean expired tracks

		let windowStart = now.minus( this.options.sampleWindowMs );
		for ( const [ userId, lastUse ] of resourceInfo.requests ) {
			if ( lastUse.valueOf() < windowStart.valueOf() ) {
				//old, remove as it's expired
				resourceInfo.requests.delete( userId );
			}
		}
		//clean up starts maybe
		if ( resourceInfo.blacklistStarts != null && resourceInfo.blacklistStarts.valueOf() < now.valueOf() ) {
			const newExpires = resourceInfo.blacklistStarts.plus( this.options.blacklistDuration );
			if ( resourceInfo.blacklistExpires == null || resourceInfo.blacklistExpires.valueOf() < newExpires.valueOf() ) {
				resourceInfo.blacklistExpires = newExpires;
			}
			resourceInfo.blacklistStarts = null;
		}

		//clean up expires maybe
		if ( resourceInfo.blacklistExpires != null && resourceInfo.blacklistExpires.valueOf() < now.valueOf() ) {
			resourceInfo.blacklistExpires = null;
		}

		//delete from storage if not blacklisted and empty
		if ( resourceInfo.requests.size === 0 && resourceInfo.blacklistExpires == null && resourceInfo.blacklistStarts == null ) {
			this._storage.delete( resource );
		}

	}

	public checkUse( userId: string, resource: string ): {
		/** true if we detect abusive behaviour from this ```userKey```'s access of the ```resource```, 
		 * regardless of if the accesss should be blocked */
		isAbuse: boolean;
		/** ```false``` if you should allow usage to the resource (such as non-fraud access, or fraud usage is detected but we are in our obfuscation grace period).
		 * 
		 * An example would be to allow the abuse call, but penalize in cost.
		 * 
		 * ```true``` means deny the usage (and inform the use as such.  EG HTTP 403 error)
		 *  */
		preventAccess: boolean;
	} {

		let now = __.utc();
		const _storage = this._storage;
		//get proper domain bucket
		let resourceInfo: IResourceInfo;
		if ( _storage.has( resource ) ) {
			resourceInfo = _storage.get( resource );
		} else {
			resourceInfo = { requests: new Map() };
			_storage.set( resource, resourceInfo );
		}

		try {


			//if blacklist is in effect, lets just stop now.
			if ( resourceInfo.blacklistExpires != null ) {
				if ( resourceInfo.blacklistExpires.valueOf() > now.valueOf() ) {
					return { isAbuse: true, preventAccess: true };
				} else {
					//expired, clear it.
					resourceInfo.blacklistExpires = null;
				}
			}
			if ( resourceInfo.blacklistStarts != null && resourceInfo.blacklistStarts.plus( this.options.blacklistDuration ) <= now ) {
				//expired, clear it
				resourceInfo.blacklistStarts = null;
			}



			//track
			resourceInfo.requests.set( userId, now.toJSDate() );

			//count all calls to the domain in last 5 min
			//let shouldBlacklist = false;
			let requestsInSampleWindow = 0;
			let sampleWindowStart = now.minus( this.options.sampleWindowMs );
			resourceInfo.requests.forEach( ( lastUse, otherUserId ) => {
				if ( lastUse.valueOf() >= sampleWindowStart.valueOf() ) {
					requestsInSampleWindow++;
				} else {
					//old, remove as it's expired
					resourceInfo.requests.delete( otherUserId );
				}
			} );

			//determine if request should be blacklisted
			if ( requestsInSampleWindow >= this.options.blacklistImmediateUses ) {
				//too many abuses, blacklist ASAP
				//shouldBlacklist = true;
				resourceInfo.blacklistStarts = now;

			} else if ( resourceInfo.blacklistStarts == null && requestsInSampleWindow > this.options.maxValidUses ) {
				//abused and not yet scheduled for blacklist. blacklist in 5
				resourceInfo.blacklistStarts = now.plus( this.options.obfuscateBlacklistDelayMs );
			}

			if ( resourceInfo.blacklistStarts != null && resourceInfo.blacklistStarts.valueOf() <= now.valueOf() ) {
				//time to start the blacklist				
				resourceInfo.blacklistExpires = resourceInfo.blacklistStarts.plus( this.options.blacklistDuration );
				resourceInfo.blacklistStarts = null;
			}

			//check if blacklisted
			if ( resourceInfo.blacklistExpires != null ) {
				if ( resourceInfo.blacklistExpires.valueOf() > now.valueOf() ) {
					return { isAbuse: true, preventAccess: true };
				}
			}

			if ( resourceInfo.blacklistStarts != null ) {
				return { isAbuse: true, preventAccess: false };
			}

			return { isAbuse: false, preventAccess: false };

		} finally {

			//set cleanup 5 minutes from now.
			if ( resourceInfo.cleanupTimeoutHandle != null ) {
				//there was already a cleanup scheduled.    stop it (rescheduled on the line after)
				clearTimeout( resourceInfo.cleanupTimeoutHandle );
			}
			resourceInfo.cleanupTimeoutHandle = setTimeout( () => {
				//do a cleanup pass for this domain
				this._doHousekeeping( resource );
				resourceInfo.cleanupTimeoutHandle = null;
			}, this.options.sampleWindowMs.valueOf() + 5 ); //schedule for 5ms after sample window ends

		}

	}

}


/** if this account is a free account (unpaid registered or demo):  then track the request domain.  if more than 5 free accounts request the same domain in less than 5 minutes, blacklist the domain for all free users for 24hrs.   					 */
interface IResourceInfo {
	/**freebee requests to this domain in the last 5 minutes */
	requests: Map<string, Date>;
	/** we blacklist for 24hrs (GCP preemptive instances have a lifespan of less than that) */
	blacklistExpires?: xlib.time.luxon.DateTime;
	/** obfuscate blacklisting: once we decide to blacklist, we delay by 5 minutes or 10 accounts, whichever occurs first */
	blacklistStarts?: xlib.time.luxon.DateTime;
	/** callback used to cleanup after 5 minutes of the last request. */
	cleanupTimeoutHandle?: any;
}


