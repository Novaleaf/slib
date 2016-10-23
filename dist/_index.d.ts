import * as xlib from "xlib";
/** cross platform base library.  npm xlib to use by itself */
export { xlib };
export import childProcess = require("child_process");
export import path = require("path");
export import os = require("os");
export import stream = require("stream");
/** the npm "commander" package.
for creating commandline apps */
export import commander = require("commander");
import * as file from "./file";
export { file };
/** web server needs */
export import webserver = require("./webserver");
/** external services such as billing, database, email. */
export import external = require("./external/_index");
export import security = require("./security");
/** get resident memory usage of a pid in bytes.   works on windows or linux */
export declare function getMemoryUsage(pid: number): number;
/** get a list of all ip addresses of this server, synchronously.  after generating the ip's, will cache results for next time you call this method */
export declare var getNetworkIPs: ((bypassCache?: boolean) => {
    v4: string[];
    v6: string[];
}) | undefined;
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
export declare var googleUniversalAnalytics: IUniversalAnalytics;
