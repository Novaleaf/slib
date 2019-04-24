import * as xlib from "xlib";


/** promise fs based api and related quality-of-life helper functions */
export import fs = require( "./fs" );

/** ask questions on the console, and cross platform shell commands.   
 * 
 * uses https://www.npmjs.com/package/shelljs internally, but does not expose it because it doesn't use promises */
export import shell = require( "./shell" );

/** re2 is a safe, linear time regexp implementation.  https://www.npmjs.com/package/re2  */
export const re2: typeof RegExp = require( "re2" );


export import net = require( "./net" );
//fs.d
//const floatPromise = fs.del() "" );
//fs.del.default()

export import node = require( "./node" );



