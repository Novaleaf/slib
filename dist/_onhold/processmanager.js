//////////////////////////////
//////////disabling for now, re-enable when needed, and hopefully rxjs v5 has typescript support by then.
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
//import * as xlib from "xlib";
////import refs = require("./refs");
////import xlib = refs.xlib;
//import _ = xlib.lodash;
///** https://github.com/Reactive-Extensions/rx-node */
//var rxNode = require("rx-node");
//import moment = xlib.dateTime.moment;
//var log = new xlib.logging.Logger(__filename);
//import childProcess = require("child_process");
//import path = require("path");
//import fs = require("fs");
//import os = require("os");
//export enum ManagerStatus {
//	NotLaunched,
//	Launched,
//	Terminated,
//}
//export interface IProcessManagerStartOptions {
//	overrideArgs?: string[];
//	additionalPrefixArgs?: string[];
//	additionalSuffixArgs?: string[];
//}
///**
// * manages a single spawned subprocess, relaunching it if needed.
// * 
// */
//export class ProcessManager extends xlib.ClassBase {
//	public isReady: boolean = false;
//	private _autoRelaunch: boolean = true;
//	public process: childProcess.ChildProcess |null;
//	public log: {
//		exitCode: number | null;
//		startTime: moment.Moment;
//		endTime: moment.Moment | null;
//		data: string[];
//		errors: any[];
//	}[] = [];
//	constructor(public id: number, public options: ManagementOptions, public exePath: string, public args: string[], public onProcessExitCallback: (thisProcessManager: ProcessManager, exitCode: number|null, reasonOverride: string|null) => void) {
//		super();
//		this.isReady = false;
//		//increase max listeners to avoid node warning
//	}
//	protected _disposing() {
//		if (this.process != null) {
//			this.stop();
//		}
//	}
//	/** start a stopped instance, with options to provide additional commandline args to either put in front, or in back of default args (that were passed in via the constructor). */
//	public start(options: IProcessManagerStartOptions = {}) {
//		log.assert(this.process == null && this.isReady === false, "process already exists");
//		log.assert(fs.existsSync(this.exePath) === true, "exe '%s' does not exist", this.exePath);
//		var finalArgs = this.args;
//		if (options.overrideArgs != null) {
//			finalArgs = options.overrideArgs;
//		}
//		if (options.additionalPrefixArgs != null) {
//			finalArgs = options.additionalPrefixArgs.concat(finalArgs);
//		}
//		if (options.additionalSuffixArgs != null) {
//			finalArgs = finalArgs.concat(options.additionalSuffixArgs);
//		}
//		log.info("spawning", this.exePath, finalArgs);
//		var thisProcess = childProcess.spawn(this.exePath, finalArgs);
//		//pipe to stdout
//		//process.stdout.setMaxListeners(process.stdout.listeners.length + 1);
//		thisProcess.stdout.pipe(process.stdout);
//		//process.stderr.setMaxListeners(process.stdout.listeners.length + 1);
//		thisProcess.stderr.pipe(process.stderr);
//		//process.stdout.removel
//		//if (isWinDevEnv === true) {
//		//	//pipe t
//		//} else {
//		//}
//		if (this.options.highPriority !== true && xlib.environment.osName !== xlib.environment.OsName.win32) {
//			childProcess.spawn("renice", ["-n", "10", "-p", thisProcess.pid.toString(10)]);
//		}
//		var pid = thisProcess.pid;
//		log.assert(pid != null, "pid is null");
//		this.process = thisProcess;
//		this.process.stdout.setEncoding("utf8");
//		this.process.stdout.on("data", (data) => { this._processOnData(thisProcess, data.toString()); });
//        this.process.on("exit", (exitCode:number) => {
//			this._processOnExit(thisProcess, exitCode);
//		});
//        var pid = this.process == null ? 0 : this.process.pid
//		this.log.push({ exitCode: null, startTime: moment(), endTime: null, data: [], errors: [] });
//		this.isReady = true;
//	}
//	private _processOnExit(thisProcess: childProcess.ChildProcess, exitCode: number|null, reasonOverride: string|null = null) {
//		if (this.process == null || this.process.pid != thisProcess.pid) {
//			//log.assert(false, "process already exited");
//			return;
//		}
//		this.onProcessExitCallback(this, exitCode, reasonOverride);
//		this.isReady = false;
//		var currentLog = this.log[this.log.length - 1];
//		currentLog.exitCode = exitCode;
//		currentLog.endTime = moment();
//		var uptime = currentLog.endTime.diff(currentLog.startTime);
//		if (uptime < this.options.minimumUptime) {
//			log.error("Process did not stay up for minimum uptime.", moment().toISOString(), this.exePath, this.id, this.args, thisProcess.pid, exitCode, reasonOverride);
//		}
//		if (this.log.length > this.options.maxLogs) {
//			xlib.arrayHelper.removeAfter(this.log, this.options.maxLogs)
//		}
//		this.process = null;
//		if (this._autoRelaunch === true) {
//			this.start();
//		}
//	}
//	private _processOnData(thisProcess: childProcess.ChildProcess, data: string) {
//		if (this.process == null || this.process.pid != thisProcess.pid) {
//			//log.assert(false, "process already exited, can not processOnData");
//			return;
//		}
//		var currentLog = this.log[this.log.length - 1];
//		currentLog.data.push(data);
//	}
//	public stop(reasonOverride: string | null = null) {
//		if (this.process == null) {
//			throw log.error("can not terminate, already null");
//		}
//		//log.assert(this.process != null, "can not terminate, already null");
//		this._autoRelaunch = false;
//		var thisProcess = this.process;
//		this.process.kill();
//		this._processOnExit(thisProcess, null, reasonOverride);
//	}
//	/** restart a instance, with options to provide additional commandline args to either put in front, or in back of default args (that were passed in via the constructor). */
//	public stopAndRestart(stopReasonOverride: string|null = null, options?: IProcessManagerStartOptions) {
//		log.info("processManager.stopAndRestart", { stopReasonOverride, options });
//		var isAutoRelaunch = this._autoRelaunch;
//		this.stop(stopReasonOverride);
//		this.start(options);
//		this._autoRelaunch = isAutoRelaunch;
//	}
//}
//export interface ManagementOptions {
//	///** when relaunching, if there should be any delay.  default 0. */
//	//respawnDelay: number;
//	///** minimum uses before respawning.*/
//	//minUses: number;
//	///** maximum uses before respawning.  if zero, will never auto-respawn.*/
//	//maxUses: number;
//	/** default false.   true to be a high-priority process*/
//	highPriority: boolean;
//	/** maximum number of run logs to keep.*/
//	maxLogs: number;
//	/** minimum amount of time the app should stay up without crashing.  if this fails, we throw an error */
//	minimumUptime: number;
//	/** set to true to not throw errors, instead, logs to the 'error' variable. */
//	suppressErrorThrows: boolean;
//}
///** kills all instances of the processName */
//export function kill(processName: string) {
//	try {
//		if (xlib.environment.osName === xlib.environment.OsName.win32) {
//			childProcess.execSync(xlib.stringHelper.format("taskkill /F /IM %s", processName));
//		} else {
//			childProcess.execSync(xlib.stringHelper.format("killall -9 %s", processName));
//		}
//	} catch (ex) {
//		//noop if killall failed
//	}
//}
///** wrapper over nodejs's child_process.spawn() to allow auto-restarting buggy apps (when they crash)*/
//export class ChildProcessAutoRespawner extends xlib.ClassBase {
//	public exe: childProcess.ChildProcess;
//	public get isRunning(): boolean {
//		return this.exe != null;
//	}
//	constructor(public exePath: string, public args?: string[]) {
//		super();
//	}
//	protected _disposing() {
//		//overridden
//	}
//	public respawnsRemaining = 0;
//	public spawn(respawnCount = 10) {
//		log.info("spawning", this.exePath, this.args, respawnCount);
//		if (this.exe != null) {
//			log.assert(false, "process already running", this.exePath);
//			return;
//		}
//		this.respawnsRemaining = respawnCount;
//		var thisExe = childProcess.spawn(this.exePath, this.args);//, { env: null });
//		this.exe = thisExe;
//		var observer = xlib.promise.rx.Observer.create<Buffer>(
//			(buffer) => {
//				log.debug(buffer.toString());
//			},
//			(err) => {
//				log.debug(err);
//			},
//			() => {
//				log.debug("done");
//			});
//		var source = xlib.promise.rx.Observable.fromEvent<Buffer>(<any>this.exe, "data");
//		source.subscribe(observer);
//		rxNode.fromReadableStream(this.exe.stdout)
//			.subscribe((buffer) => { console.log(buffer.toString()); });
//		rxNode.fromReadableStream(this.exe.stderr)
//			.subscribe((buffer) => {
//				console.log("err!!");
//				console.log(buffer.toString());
//			});
//		thisExe.on("close", (code) => {
//			log.debug("closed with code ", code);
//			thisExe.removeAllListeners();
//			if (this.exe === thisExe) {
//				this.exe = null;
//				if (this.respawnsRemaining > 0) {
//					this.spawn(this.respawnsRemaining - 1);
//				} else {
//					log.warn("out of respawns", this.exePath);
//				}
//			}
//		});
//		this.exe.on("error", (code) => {
//			log.debug("error with code ", code);
//		});
//	}
//	public kill(signal?: string) {
//		if (this.exe == null) {
//			log.assert(false, "process already disposed", this.exePath);
//			return;
//		}
//		this.respawnsRemaining = 0;
//		this.exe.kill(signal);
//	}
//} 
//# sourceMappingURL=processmanager.js.map