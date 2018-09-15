import mz = require( "mz" );
import * as xlib from "xlib";


import { fs } from "mz";
export { fs };


import * as glob from "glob";
export { glob };




/** find files.  internally uses https://www.npmjs.com/package/glob */
export function find( pattern: string, options?: glob.IOptions & {/** by default we will normalize the path (remove/replace "..").  pass "true" to disble this */disableNormalization?: boolean } ) {
	return new Promise<string[]>( ( resolve, reject ) => {
		glob( pattern, options, ( err, files ) => {
			if ( err ) {
				return reject( err );
			}
			if ( options && options.disableNormalization === true ) {
				return resolve( files );
			}
			const normalizedFiles = files.map( path.normalize );
			return resolve( normalizedFiles );
		} );
	} );
}

export import path = require( "path" );

const pathSep = path.sep;




/** mkdir recursively */
import * as mkdirp from "mkdirp";
/** Create each supplied directory including any necessary parent directories that don't yet exist..   internally uses https://www.npmjs.com/package/mkdirp 
	* @returns  first directory made that had to be created, if any. 
	@throws fs error if any encountered
*/
export async function mkdir( pathToCreate: string,
	/** If a directory needs to be created, set the mode as an octal permission string or number */
	mode?: string | number
) {
	const mkdirOptions: mkdirp.Options = {
		mode,
		fs: {
			mkdir: fs.mkdir as any,
			stat: fs.stat as any,
		}
	};
	return new xlib.promise.bluebird<string>( ( resolve, reject ) => {
		mkdirp( pathToCreate, mkdirOptions, ( err, made ) => {
			return err ? reject( err ) : resolve( made );
		} );
	} );
}

import * as del from "del";
export { del };


// del()



// /** delete dir recursively */
// import * as rimraf from "rimraf";




// export function rmDirRecursiveAsync( path ): Promise<void> {
// 	var args = <any[]><any>arguments;

// 	return ( <any>Promise ).fromNode( ( cb ) => {
// 		return xlib.jsHelper.apply( rimraf, rimraf, args, null, [ cb ] );
// 	} );
// }
// }
// export function mkDirRecursiveAsync( path ): Promise<void> {
// 	var args = <any[]><any>arguments;

// 	return ( <any>Promise ).fromNode( ( cb ) => {
// 		return xlib.jsHelper.apply( mkdirp, mkdirp, args, null, [ cb ] );
// 	} );
// }

