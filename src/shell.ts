
import * as xlib from "xlib";
import __ = xlib.lolo;
import log = xlib.diagnostics.log;
import * as readline from "readline";

/** cross platform shell commands.  not promise based unfortunately  */
import shelljs = require( "shelljs" );




const chalk = xlib.util.stringHelper.Chalk.default;

/** ask a question on the console, and awaits a typed answer (followed by the ```ENTER``` key) */
export async function question( query: string, options: { /** by default we don't allow blank answers.   set this to ```""``` to allow blank */ defaultIfBlank?: string; forceLowercase?: boolean; } = {} ): Promise<string> {

	if ( query.trim().endsWith( ":" ) !== true ) {
		query = "\n" + query.trim() + ": ";
	}
	options = { ...options };

	while ( true ) {
		let answer = await __question( chalk.yellow( query ) );
		if ( options.forceLowercase === true ) {
			answer = answer.toLowerCase();
		}
		if ( __.str.isNullOrEmpty( answer ) === false ) {
			return answer;
		} else {
			//blank answer
			if ( options.defaultIfBlank != null ) {
				//default answer
				answer = options.defaultIfBlank;
				return answer;
			} else {
				comment( "blank answers are not allowed for this question." );
				continue;
			}
		}

	}
}
/** bare-bones question prompt. as this isn't very user friendly, generally you should NOT use this directly.  instead use ```askQuestion()``` or ```askQuestionChoices()``` */
export async function __question( query: string ): Promise<string> {
	return new __.bb<string>( async ( resolve, reject ) => {
		const __readStdin = readline.createInterface( { input: process.stdin, output: process.stdout } );
		__readStdin.question( query, ( answer ) => {
			__readStdin.close();
			resolve( answer );
		} );
	} );
}


/** ask a question, offering explicit choices the user can select from.   default choices are [y,n] with no blank options allowed. */
export async function questionChoices( query: string, options?: { choices?: string[]; defaultIfBlank?: string | number; preserveCase?: boolean; numericSelect?: boolean; } ) {

	options = { choices: [ "y", "n" ], ...options };

	const baseOptions = {
		...options,
		forceLowercase: options.preserveCase !== true,
		defaultIfBlank: options.defaultIfBlank == null ? null : options.defaultIfBlank.toString(),
	};

	function showNumericChoices() {
		let toReturn = "";
		for ( let i = 0; i < options.choices.length; i++ ) {
			toReturn += `${ chalk.bgYellow.black( ( i + 1 ).toString() ) }. ${ options.choices[ i ] }\n`;
		}
		return toReturn;
	}
	function showDefaultChoice() {
		if ( options.defaultIfBlank == null ) {
			return "";
		}
		return " " + chalk.bgGreen.black( options.defaultIfBlank.toString() );
	}

	function showChoiceSummary() {

		if ( options.numericSelect === true ) {
			return `[${ chalk.bgYellow.black( "1" ) }-${ chalk.bgYellow.black( ( options.choices.length ).toString() ) }]${ showDefaultChoice() }`;
		} else {
			return `[${ options.choices.map( ( val ) => chalk.bgYellow.black( val ) ).join() }]${ showDefaultChoice() }`;
		}

	}


	while ( true ) {
		let answer: string;
		if ( options.numericSelect === true ) {
			answer = await ( question( `${ query } \n${ showNumericChoices() } ${ showChoiceSummary() }`, baseOptions ) );
			//if user selected a number, pick that choice
			let asNum = __.num.parseInt( answer, 0 );
			if ( asNum >= 1 && asNum <= options.choices.length ) {
				answer = options.choices[ asNum - 1 ];
			}
		} else {
			answer = await ( question( `${ query } ${ showChoiceSummary() }`, baseOptions ) );
		}
		if ( options.choices.includes( answer ) ) {
			return answer;
		} else {
			comment( `invalid choice.  you must choose from ${ showChoiceSummary() }  you choose "${ chalk.bgRed.white( answer ) }"` );
		}
	}


}


/** execute a command to the native shell */
export async function exec( cmd: string, options?: {
	/** what exitCode to expect (default 0)   if this code isn't recieved, an error is thrown.   set to ```null``` to ignore */
	exitCode?: number;
	shellOptions?: shelljs.ExecOptions;
	// /** if exitCode doesn't match the expectedExitCode, throw this error.   If you pass an Exception object, we will attach a descriptive innerError if one is not set. */
	// toThrow?: Error | __.diag.Exception;
} ): Promise<{ shellCmd: string; code: number; stdout: string; stderr: string; }> {

	options = { exitCode: 0, ...options };

	shelljs.echo( chalk.bold.red( "shell.exec: " ) + chalk.italic.gray( cmd ) );

	//log.info( `about to exec "${ cmd }".  It's output is:`);
	let toReturn = new __.bb<{ shellCmd: string; code: number; stdout: string; stderr: string; }>( ( resolve, reject ) => {
		shelljs.exec(cmd, options as any, ( code: number, stdout: string, stderr: string ) => {

			//normalize params
			code = code == null ? -1 : code;
			stdout = stdout == null ? "" : stdout.trim();
			stderr = stderr == null ? "" : stderr.trim();

			shelljs.echo( chalk.bold.red( "shell.exec,exitCode: " ) + chalk.italic.gray( `${ code } (expected ${ options.exitCode })` ) );

			if ( options.exitCode != null ) {
				if ( code !== options.exitCode ) {
					const wrongErrorCodeEx = new Error( `WRONG ERRORCODE.  Expected "${ options.exitCode }" but got "${ code }" when running "shell.exec('${ cmd }')"` );
					reject( wrongErrorCodeEx );
					return;
				}
			}
			let toResolve = { shellCmd: cmd, code, stdout, stderr };
			resolve( toResolve );
			return;
		} );
	} );

	return toReturn;

}

/** write a section (heading) to console.out */
export function section( ...args: any[] ) {
	let strs = args.map( ( arg ) => typeof ( arg ) === "string" ? arg : JSON.stringify( arg, undefined, "	" ) );
	shelljs.echo( chalk.bold.red( "===== " ) + chalk.italic.black.bgYellow( ...strs ) + chalk.bold.red( " =====" ) );
}

/** write a comment (minor text) to console.out */
export function comment( ...args: any[] ) {
	let strs = args.map( ( arg ) => typeof ( arg ) === "string" ? arg : JSON.stringify( arg, undefined, "	" ) );
	shelljs.echo( chalk.bold.red( "comment: " ) + chalk.italic.gray( ...strs ) );
}
/** write plain text to console.out */
export function echo( ...args: any[] ) {
	let strs = args.map( ( arg ) => typeof ( arg ) === "string" ? arg : JSON.stringify( arg ) );
	shelljs.echo( ...strs );
}


