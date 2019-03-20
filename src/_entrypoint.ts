import * as xlib from "xlib";
import * as io from "./io";
export { io };

/** re2 is a safe, linear time regexp implementation.  https://www.npmjs.com/package/re2  */
export const re2: typeof RegExp = require( "re2" );
