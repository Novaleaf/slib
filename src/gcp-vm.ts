
import * as xlib from "xlib";
import __ = xlib.lolo;
import log = xlib.diagnostics.log;
import bb = xlib.promise.bluebird;


import * as shell from "./shell";



// /** waits for the machine to boot. */
// export async function waitUntilUp( options: { name: string; silent?: boolean; gcloudOverride?:string} ) {



// 	optionshelpers.comment( "wait for vm to bootup");
// 	while ( true ) {
// 		try {
// 			await helpers.exec( `${ gcloudComputeExe } ssh ${ tempDeploySshName } --strict-host-key-checking=no --command="echo instance now up"` );
// 			helpers.comment( "vm is now up" );
// 			break;
// 		} catch ( _err ) {
// 			helpers.echo( "... still not up ..." );
// 			await __.bb.delay( 2000 );
// 		}
// 	}

// }

