"use strict";
var fsPromise = require("fs-extra-promise");
exports.fsPromise = fsPromise;
//import * as xlib from "xlib";
//let Promise = xlib.promise.bluebird;
///** mkdir recursively */
//import mkdirp = require("mkdirp");
///** delete dir recursively */
//import rimraf = require("rimraf");
//export module extras {
//	/** from: http://www.geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/ */
//	export function rmDirRecursiveSync(path) {
//		if (raw.existsSync(path)) {
//			raw.readdirSync(path).forEach(function (file, index) {
//				var curPath = path + "/" + file;
//				if (raw.lstatSync(curPath).isDirectory()) { // recurse
//					rmDirRecursiveSync(curPath);
//				} else { // delete file
//					raw.unlinkSync(curPath);
//				}
//			});
//			raw.rmdirSync(path);
//		}
//	}
//	//unified.rmDirRecursiveSync = rmDirRecursiveSync;
//	export function rmDirRecursiveAsync(path): Promise<void> {
//		var args = <any[]><any>arguments;
//		return (<any>Promise).fromNode((cb) => {
//			return xlib.jsHelper.apply(rimraf, rimraf, args, null, [cb]);
//		});
//	}
//	//unified.rmDirRecursiveAsync = rmDirRecursiveAsync;
//	/** from: https://gist.github.com/danherbert-epam/3960169 */
//	export function mkDirRecursiveSync(path) {
//		var dirs = path.split(pathSep);
//		var root = "";
//		while (dirs.length > 0) {
//			var dir = dirs.shift();
//			if (dir === "") {// If directory starts with a /, the first path will be an empty string.
//				root = pathSep;
//			}
//			if (!raw.existsSync(root + dir)) {
//				raw.mkdirSync(root + dir);
//			}
//			root += dir + pathSep;
//		}
//	}
//	//unified.mkDirRecursiveSync = mkDirRecursiveSync;
//	export function mkDirRecursiveAsync(path): Promise<void> {
//		var args = <any[]><any>arguments;
//		return (<any>Promise).fromNode((cb) => {
//			return xlib.jsHelper.apply(mkdirp, mkdirp, args, null, [cb]);
//		});
//	}
//	//unified.mkDirRecursiveAsync = mkDirRecursiveAsync;
//	export function existsAsync(path): Promise<boolean> {
//		return new Promise<boolean>((resolve, reject) => {
//			raw.exists(path, (result) => {
//				resolve(Promise.resolve(result));
//			});
//		});
//	}
//	//unified.existsAsync = existsAsync;
//}
//# sourceMappingURL=file.js.map