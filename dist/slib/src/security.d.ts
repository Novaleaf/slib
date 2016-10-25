/// <reference types="node" />
import xlib = require("xlib");
import Promise = xlib.promise.bluebird;
/** definition of argon2 options, a KDF implementation */
export interface IArgon2Options {
    /** whether or not you want Argon2d (emphasis on gpu hardness over side-channel protection).  Generally you don't want to.   Default=false. */
    argon2d?: boolean;
    /** A time cost, which defines the amount of computation realized and therefore the execution time, given in number of iterations.  default = 3 */
    timeCost?: number;
    /** A memory cost, which defines the memory usage, given in kibibytes.  default = 12 (2^12kb) */
    memoryCost?: number;
    /** A parallelism degree, which defines the number of parallel threads. default = 1. */
    parallelism?: number;
}
/** definition of argon2, a KDF implementation */
export interface IArgon2 {
    encrypt(secret: string, salt: string, callback: (err: Error, hash: string) => void): void;
    encrypt(secret: string, salt: string, options: IArgon2Options, callback: (err: Error, hash: string) => void): void;
    encryptSync(secret: string, salt: string, options?: IArgon2Options): string;
    generateSalt(callback: (err: any, salt: string) => void): void;
    generateSaltSync(): string;
    verify(hash: string, secret: string, callback: (err: Error) => void): void;
    verifySync(hash: string, secret: string): boolean;
}
/** node's crypto library */
export import crypto = require("crypto");
/**
 *  old version of our KDF class using BCrypt.
 *  simple to use KDF.  modern, secure, and promise friendly.
 *  https://en.wikipedia.org/wiki/Key_derivation_function
 *  INTEROP DIFFERENCE: if interop is needed on different platforms, be sure you implement this logic: we Sha256 hash the input data, and use the base64 encoded version of that (44 digits) hash as input to bcrypt.  This keeps the input length under bcrypts 50 char max keyspace.  everything else is normal bcrypt.
 */
export declare class __OldKdf {
    private static _defaultRounds;
    /**
     * generate a combined "version+hash+salt" output 60 characters long.
     */
    static hashSync(data: string, rounds?: number): string;
    static hashAsync(data: string, 
        /** default=12.  A note about the cost. When you are hashing your data the module will go through a series of rounds to give you a secure hash. The value you submit there is not just the number of rounds that the module will go through to hash your data. The module will use the value you enter and go through 2^rounds iterations of processing.

From @garthk, on a 2GHz core you can roughly expect:

rounds=8 : ~40 hashes/sec
rounds=9 : ~20 hashes/sec
rounds=10: ~10 hashes/sec
rounds=11: ~5  hashes/sec
rounds=12: 2-3 hashes/sec
rounds=13: ~1 sec/hash
rounds=14: ~1.5 sec/hash
rounds=15: ~3 sec/hash
rounds=25: ~1 hour/hash
rounds=31: 2-3 days/hash */
        rounds?: number): Promise<string>;
    static compareSync(data: string, encrypted: string): boolean;
    static compareAsync(data: string, encrypted: string): Promise<boolean>;
}
/**
 * simple to use KDF.  modern, secure, gpu resistant, and promise friendly.
 *  https://en.wikipedia.org/wiki/Key_derivation_function
 *  Uses the Argon2 KDF algorithm internally.  For more info: https://www.npmjs.com/package/argon2
 *  Hash output is 100% compatible with Argon2,  is a string 90 characters long, and it is identifiable as being an Argon2 hash by it's prefix:  "$argon2".
 */
export declare class Kdf {
    private static _defaultOptions;
    /**
     * generate a combined "version+hash+salt" output 60 characters long.
     */
    static hashSync(inputSecret: string, options?: IArgon2Options): string;
    static hashAsync(inputSecret: string, options?: IArgon2Options): Promise<string>;
    static verifySync(inputSecret: string, kdfOutputHash: string): boolean;
    static verifyAsync(inputSecret: string, kdfOutputHash: string): Promise<void>;
}
/**
 * A realistic password strength estimator https://github.com/dropbox/zxcvbn
Could be run clientside, but is about 400KB in size, so probably not.  Idea?:  for client side, maybe try this if it's smaller: https://github.com/mozilla/fxa-password-strength-checker

zxcvbn is a password strength estimator inspired by password crackers. Through pattern matching and conservative entropy calculations, it recognizes and weighs 30k common passwords, common names and surnames according to US census data, popular English words from Wikipedia and US television and movies, and other common patterns like dates, repeats (aaa), sequences (abcd), keyboard patterns (qwertyuiop), and l33t speak.

Consider using zxcvbn as an algorithmic alternative to password composition policy — it is more secure, flexible, and usable when sites require a minimal complexity score in place of annoying rules like "passwords must contain three of {lower, upper, numbers, symbols}".

More secure: policies often fail both ways, allowing weak passwords (P@ssword1) and disallowing strong passwords.
More flexible: zxcvbn allows many password styles to flourish so long as it detects sufficient complexity — passphrases are rated highly given enough uncommon words, keyboard patterns are ranked based on length and number of turns, and capitalization adds more complexity when it's unpredictaBle.
More usable: Use zxcvbn to build simple, rule-free interfaces that give instant feedback. In addition to scoring, zxcvbn includes minimal, targeted verbal feedback that can help guide users towards less guessable passwords.
 */
export declare var passwordStrengthEstimator: {
    (password: string, 
        /** an array of strings that zxcvbn will treat as an extra dictionary. This can be whatever list of strings you like, but is meant for user inputs from other fields of the form, like name and email. That way a password that includes a user's personal information can be heavily penalized. This list is also good for site-specific vocabulary — Acme Brick Co. might want to include ['acme', 'brick', 'acmebrick', etc]. */
        userInputs?: string[]): {
        /** estimated guesses needed to crack password */
        guesses: number;
        /** order of magnitude of result.guesses */
        guesses_log10: number;
        /** # dictionary of back- of - the - envelope crack time
# estimations, in seconds, based on a few scenarios: */
        crack_time_seconds: {
            /**# online attack on a service that ratelimits password auth attempts.*/
            online_throttling_100_per_hour: number;
            /** # online attack on a service that doesn't ratelimit,
            # or where an attacker has outsmarted ratelimiting. */
            online_no_throttling_10_per_second: number;
            /** # offline attack.assumes multiple attackers,
            # proper user- unique salting, and a slow hash function
            # w / moderate work factor, such as bcrypt, scrypt, PBKDF2.*/
            offline_slow_hashing_1e4_per_second: number;
            /** # offline attack with user- unique salting but a fast hash
            # function like SHA- 1, SHA - 256 or MD5.A wide range of
            # reasonable numbers anywhere from one billion - one trillion
            # guesses per second, depending on number of cores and machines.
            # ballparking at 10B/ sec. */
            offline_fast_hashing_1e10_per_second: number;
        };
        /** # same keys as result.crack_time_seconds,
                      # with friendlier display string values:
                      # "less than a second", "3 hours", "centuries", etc.*/
        crack_time_display: {
            /**# online attack on a service that ratelimits password auth attempts.*/
            online_throttling_100_per_hour: string;
            /** # online attack on a service that doesn't ratelimit,
            # or where an attacker has outsmarted ratelimiting. */
            online_no_throttling_10_per_second: string;
            /** # offline attack.assumes multiple attackers,
            # proper user- unique salting, and a slow hash function
            # w / moderate work factor, such as bcrypt, scrypt, PBKDF2.*/
            offline_slow_hashing_1e4_per_second: string;
            /** # offline attack with user- unique salting but a fast hash
            # function like SHA- 1, SHA - 256 or MD5.A wide range of
            # reasonable numbers anywhere from one billion - one trillion
            # guesses per second, depending on number of cores and machines.
            # ballparking at 10B/ sec. */
            offline_fast_hashing_1e10_per_second: string;
        };
        /** Integer from 0-4 (useful for implementing a strength bar)
          0 # too guessable: risky password. (guesses < 10^3)

1 # very guessable: protection from throttled online attacks. (guesses < 10^6)

2 # somewhat guessable: protection from unthrottled online attacks. (guesses < 10^8)

3 # safely unguessable: moderate protection from offline slow-hash scenario. (guesses < 10^10)

4 # very unguessable: strong protection from offline slow-hash scenario. (guesses >= 10^10)
        */
        score: number;
        /** # verbal feedback to help choose better passwords. set when score <= 2. */
        feedback: {
            /** # explains what's wrong, eg. 'this is a top-10 common password'.
                          # not always set -- sometimes an empty string */
            warning: string;
            /** # a possibly-empty list of suggestions to help choose a less
                          # guessable password. eg. 'Add another word or two' */
            suggestions: string;
        };
        /** # the list of patterns that zxcvbn based the
              # guess calculation on.*/
        sequence: {}[];
        /** # how long it took zxcvbn to calculate an answer,
              # in milliseconds.*/
        calc_time: number;
    };
};
