import * as xlib from "xlib";

/** cross platform base library.  npm xlib to use by itself */
export {
	/** cross platform base library */
	xlib
};





////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//node modules
export import childProcess = require("child_process");
export import path = require("path");

export import os = require("os");

export import stream = require("stream");



////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//3rd party modules


///** https://github.com/Reactive-Extensions/rx-node */
//export var rxNode = require("rx-node");

/** the npm "commander" package.
for creating commandline apps */
export import commander = require("commander");


////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//slib custom modules

import * as file from "./file";
export { file };




//export import processManager = require("./processmanager");



/** web server needs */
export import webserver = require("./webserver");


/** external services such as billing, database, email. */
export import external = require("./external/_index");


export import security = require("./security");


////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//slib custom functions
/** get resident memory usage of a pid in bytes.   works on windows or linux */
export function getMemoryUsage(pid: number): number {
	switch (process.platform) {
		case "win32":
			var command = xlib.stringHelper.format('tasklist /fi "pid eq %s" /NH', pid);  //output: devenv.exe                    5200 Console                    1  1,310,816 K
			var stdoutBuffer = <Buffer><any>childProcess.execSync(command);
			var output = stdoutBuffer.toString().trim();
			var chunks = output.split(" ");
			var target = chunks[chunks.length - 2];
			target = xlib.stringHelper.replaceAll(target, ",", "");
			return parseInt(target, 10) * 1024;
		//break;
		default:
			var command = xlib.stringHelper.format("ps -p %s -o rss=", pid); //output: 72288
			var stdoutBuffer = <Buffer><any>childProcess.execSync(command);
			var output = stdoutBuffer.toString().trim();
			return parseInt(output, 10) * 1024;
		//break;
	}
}
/** get a list of all ip addresses of this server, synchronously.  after generating the ip's, will cache results for next time you call this method */
export var getNetworkIPs = (function () {
	if (typeof (require) === "undefined" || typeof (process) === "undefined") {
		return;
	}
	var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;

	//var exec = require('child_process').exec;
	var cachedV4: string[];
	var cachedV6: string[];
	var command: string;
	var filter4RE: RegExp;
	var filter6RE: RegExp;

	switch (process.platform) {
		case 'win32':
			//case 'win64': // TODO: test
			command = 'c:/windows/System32/ipconfig.exe';
			filter4RE = /\bIPv[4][^:\r\n]+:\s*([^\s]+)/g;
			filter6RE = /\bIPv[6][^:\r\n]+:\s*([^\s]+)/g;
			break;
		case 'darwin':
			command = 'ifconfig';
			filter4RE = /\binet\s+([^\s]+)/g;
			filter6RE = /\binet6\s+([^\s]+)/g; // IPv6
			break;
		default:
			command = 'ifconfig';
			filter4RE = /\binet\b[^:]+:\s*([^\s]+)/g;
			filter6RE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
			break;
	}
	return function (bypassCache: boolean = false) {

		if (cachedV4 == null || bypassCache === true) {


			var stdoutBuffer = <Buffer><any>childProcess.execSync(command);


			cachedV4 = [];
			cachedV6 = [];
			var ip:any;

			var stdout = stdoutBuffer.toString();

			//ipv4
			var matches4 = stdout.match(filter4RE) || [];
			for (var i = 0; i < matches4.length; i++) {
				ip = matches4[i].replace(filter4RE, '$1')
				if (!ignoreRE.test(ip)) {
					cachedV4.push(ip);
				}
			}

			//ipv6
			var matches6 = stdout.match(filter6RE) || [];
			for (var i = 0; i < matches6.length; i++) {
				ip = matches6[i].replace(filter6RE, '$1')
				if (!ignoreRE.test(ip)) {
					cachedV6.push(ip);
				}
			}
		}
		return { v4: cachedV4, v6: cachedV6 };
	};
})();




export interface IUniversalAnalytics {
	(trackerId: string): IUniversalAnalyticsVisitor;
	(trackerId: string, userUuid: string): IUniversalAnalyticsVisitor;
	(trackerId: string, userId: string, options: {
		/**Starting with Universal Analytics, a UUID v4 is the preferred user ID format. It is therefor necessary to provide a UUID of such type to universal-analytics. However you can force custom user ID, passing strictCidFormat: false in the options*/
		strictCidFormat?: boolean;
		/**If you want to use Google Analytics in https protocol, just include it in the options https: true, by default will use http*/
		https?: boolean;
	}): IUniversalAnalyticsVisitor;
}
export interface IUniversalAnalyticsVisitor {
	debug(): IUniversalAnalyticsVisitor;

	send(): void;

	pageview(path: string): IUniversalAnalyticsVisitor;
	pageview(path: string, callback?: (err: any) => void): void;
	pageview(params: Object): IUniversalAnalyticsVisitor;
	pageview(params: Object, callback?: (err: any) => void): void;
	pageview(path: string, hostname: string): IUniversalAnalyticsVisitor;
	pageview(path: string, hostname: string, callback?: (err: any) => void): void;
	pageview(path: string, title: string, hostname: string): IUniversalAnalyticsVisitor;
	pageview(path: string, title: string, hostname: string, callback?: (err: any) => void): void;


	event(category: string, action: string): IUniversalAnalyticsVisitor;
	event(category: string, action: string, callback?: (err: any) => void): void;
	event(category: string, action: string, label: string): IUniversalAnalyticsVisitor;
	event(category: string, action: string, label: string, callback?: (err: any) => void): void;
	event(category: string, action: string, label: string, value: any): IUniversalAnalyticsVisitor;
	event(category: string, action: string, label: string, value: any, callback?: (err: any) => void): void;
	event(category: string, action: string, label: string, value: any, params: Object, callback?: (err: any) => void): void;
	event(params: Object): IUniversalAnalyticsVisitor;
	event(params: Object, callback: (err: any) => void): void;


	transaction(id: string): IUniversalAnalyticsVisitor;
	transaction(id: string, callback: (err: any) => void): void;
	transaction(id: string, revenue: number): IUniversalAnalyticsVisitor;
	transaction(id: string, revenue: number, callback: (err: any) => void): void;
	transaction(id: string, revenue: number, shipping: number): IUniversalAnalyticsVisitor;
	transaction(id: string, revenue: number, shipping: number, callback: (err: any) => void): void;
	transaction(id: string, revenue: number, shipping: number, taxping: number): IUniversalAnalyticsVisitor;
	transaction(id: string, revenue: number, shipping: number, taxping: number, callback: (err: any) => void): void;
	transaction(id: string, revenue: number, shipping: number, taxping: number, affiliation: string): IUniversalAnalyticsVisitor;
	transaction(id: string, revenue: number, shipping: number, taxping: number, affiliation: string, callback: (err: any) => void): void;
	transaction(params: Object): IUniversalAnalyticsVisitor;
	transaction(params: Object, callback: (err: any) => void): void;


	item(price: number): IUniversalAnalyticsVisitor;
	item(price: number, callback: (err: any) => void): void;
	item(price: number, quantity: number): IUniversalAnalyticsVisitor;
	item(price: number, quantity: number, callback: (err: any) => void): void;
	item(price: number, quantity: number, sku: number): IUniversalAnalyticsVisitor;
	item(price: number, quantity: number, sku: number, callback: (err: any) => void): void;
	item(price: number, quantity: number, sku: number, name: string): IUniversalAnalyticsVisitor;
	item(price: number, quantity: number, sku: number, name: string, callback: (err: any) => void): void;
	item(price: number, quantity: number, sku: number, name: string, variation: string): IUniversalAnalyticsVisitor;
	item(price: number, quantity: number, sku: number, name: string, variation: string, callback: (err: any) => void): void;
	item(price: number, quantity: number, sku: number, name: string, variation: string, params: Object): IUniversalAnalyticsVisitor;
	item(price: number, quantity: number, sku: number, name: string, variation: string, params: Object, callback: (err: any) => void): void;
	item(params: Object): IUniversalAnalyticsVisitor;
	item(params: Object, callback: (err: any) => void): void;


	exception(description: string): IUniversalAnalyticsVisitor;
	exception(description: string, callback: (err: any) => void): void;
	exception(description: string, fatal: boolean): IUniversalAnalyticsVisitor;
	exception(description: string, fatal: boolean, callback: (err: any) => void): void;
	exception(params: Object): IUniversalAnalyticsVisitor;
	exception(params: Object, callback: (err: any) => void): void;


	timing(category: string): IUniversalAnalyticsVisitor;
	timing(category: string, callback: (err: any) => void): void;
	timing(category: string, variable: string): IUniversalAnalyticsVisitor;
	timing(category: string, variable: string, callback: (err: any) => void): void;
	timing(category: string, variable: string, time: number): IUniversalAnalyticsVisitor;
	timing(category: string, variable: string, time: number, callback: (err: any) => void): void;
	timing(category: string, variable: string, time: number, label: string): IUniversalAnalyticsVisitor;
	timing(category: string, variable: string, time: number, label: string, callback: (err: any) => void): void;
	timing(params: Object): IUniversalAnalyticsVisitor;
	timing(params: Object, callback: (err: any) => void): void;


	middleware(accountID: string, options?: any): any;
}
/** the npm "universal-analytics" package.  https://www.npmjs.com/package/universal-analytics
A node module for Google's Universal Analytics tracking
This module allows tracking data (or rather, users) from within a Node.js application. Tracking is initiated on the server side and, if required, does not require any more tracking in the browser.

universal-analytics currently supports the following tracking features:

Pageviews
Events
E-Commerce with transactions and items
Exceptions
User timings
*/
export var googleUniversalAnalytics: IUniversalAnalytics = require("universal-analytics");




//let log = new xlib.logging.Logger(__filename);

//log.info("hi thar from slib");


//export default "hi";