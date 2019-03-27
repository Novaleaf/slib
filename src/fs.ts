
import * as xlib from "xlib";
//import { fs } from "mz";
// tslint:disable-next-line: no-submodule-imports
export * from "mz/fs";


import * as glob from "glob";
//export { glob };
import * as os_fs from "fs";

export import path = require( "path" );



/** find files.  internally uses https://www.npmjs.com/package/glob */
export function find( pattern: string, options?: glob.IOptions & {/** by default we will normalize the path (remove/replace "..").  pass "true" to disble this */disableNormalization?: boolean; } ) {
	return new Promise<string[]>( ( resolve, reject ) => {
		glob.default( pattern, options, ( err: Error, files ) => {
			if ( err ) {
				reject( err );
				return;
			}
			if ( options && options.disableNormalization === true ) {
				resolve( files );
				return;
			}
			const normalizedFiles = files.map( path.normalize );
			resolve( normalizedFiles );
			return;
		} );
	} );
}

const pathSep = path.sep;



/** mkdir recursively */
import * as _mkdirp from "mkdirp";
/** Create each supplied directory including any necessary parent directories that don't yet exist..   internally uses https://www.npmjs.com/package/mkdirp 
	* @returns  first directory made that had to be created, if any. 
	@throws fs error if any encountered
*/

export async function mkdir_recursive( pathToCreate: string,
	/** If a directory needs to be created, set the mode as an octal permission string or number */
	mode?: string | number
) {
	const mkdirOptions: _mkdirp.Options = {
		mode,
		fs: {
			mkdir: os_fs.mkdir,
			stat: os_fs.stat,
		}
	};
	return new xlib.promise.bluebird<string>( ( resolve, reject ) => {
		_mkdirp.default( pathToCreate, mkdirOptions, ( err, made ) => {
			if ( err != null ) {
				reject( err );
			} else {
				resolve( made );
			}
			return;
		} );
	} );
}

/** delete files and folders using globs and promises.  https://www.npmjs.com/package/del */
export import del = require( "del" );

// import * as _del from "del";
// export { del };




// import xx = require( "xlib" );
// xx.


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

