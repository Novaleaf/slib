"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//"use strict";
//import refs = require("./refs");
//import xlib = refs.xlib;
var xlib = require("xlib");
var Promise = xlib.promise.bluebird;
/**
 *  An Argon2 library for Node (KDF implementation)
Bindings to the reference Argon2 implementation.
Suggest you use our managed ```Kdf``` class instead.
 */
var _argon2 = require("argon2");
/** node's crypto library */
exports.crypto = require("crypto");
///**
// *  old version of our KDF class using BCrypt.
// *  simple to use KDF.  modern, secure, and promise friendly.
// *  https://en.wikipedia.org/wiki/Key_derivation_function
// *  INTEROP DIFFERENCE: if interop is needed on different platforms, be sure you implement this logic: we Sha256 hash the input data, and use the base64 encoded version of that (44 digits) hash as input to bcrypt.  This keeps the input length under bcrypts 50 char max keyspace.  everything else is normal bcrypt.
// */
//export class __OldKdf {
//    private static _defaultRounds = 12;
//    /**
//     * generate a combined "version+hash+salt" output 60 characters long.
//     */
//    public static hashSync(data: string,
//        rounds = __OldKdf._defaultRounds): string {
//        var salt = _bcrypt.genSaltSync(rounds);
//        var dataHash = crypto.createHash("sha256").update(data).digest().toString("base64");
//        //console.log("SHA256 KEYSPACE = " + dataHash.length);
//        return _bcrypt.hashSync(dataHash, salt);
//    }
//    public static hashAsync(
//        data: string,
//        /** default=12.  A note about the cost. When you are hashing your data the module will go through a series of rounds to give you a secure hash. The value you submit there is not just the number of rounds that the module will go through to hash your data. The module will use the value you enter and go through 2^rounds iterations of processing.
//From @garthk, on a 2GHz core you can roughly expect:
//rounds=8 : ~40 hashes/sec
//rounds=9 : ~20 hashes/sec
//rounds=10: ~10 hashes/sec
//rounds=11: ~5  hashes/sec
//rounds=12: 2-3 hashes/sec
//rounds=13: ~1 sec/hash
//rounds=14: ~1.5 sec/hash
//rounds=15: ~3 sec/hash
//rounds=25: ~1 hour/hash
//rounds=31: 2-3 days/hash */
//        rounds = __OldKdf._defaultRounds): Promise<string> {
//        var promise = new Promise<string>((callback, reject) => {
//            var dataHash = crypto.createHash("sha256").update(data).digest().toString("base64");
//            _bcrypt.hash(dataHash, rounds, (err, encrypted) => {
//                if (err != null) {
//                    return reject(err);
//                }
//                return callback(encrypted);
//            });
//        });
//        return promise;
//    }
//    public static compareSync(data: string, encrypted: string): boolean {
//        return _bcrypt.compareSync(data, encrypted);
//    }
//    public static compareAsync(data: string, encrypted: string): Promise<boolean> {
//        var promise = new Promise<boolean>((callback, reject) => {
//            var dataHash = crypto.createHash("sha256").update(data).digest().toString("base64");
//            _bcrypt.compare(dataHash, encrypted, (err, isSame) => {
//                if (err != null) {
//                    return reject(err);
//                }
//                return callback(isSame);
//            });
//        });
//        return promise;
//    }
//}
/**
 * simple to use KDF.  modern, secure, gpu resistant, and promise friendly.
 *  https://en.wikipedia.org/wiki/Key_derivation_function
 *  Uses the Argon2 KDF algorithm internally.  For more info: https://www.npmjs.com/package/argon2
 *  Hash output is 100% compatible with Argon2,  is a string 90 characters long, and it is identifiable as being an Argon2 hash by it's prefix:  "$argon2".
 */
var Kdf = (function () {
    function Kdf() {
    }
    /**
     * generate a combined "version+hash+salt" output 60 characters long.
     */
    Kdf.hashSync = function (inputSecret, options) {
        if (options === void 0) { options = Kdf._defaultOptions; }
        var salt = _argon2.generateSaltSync();
        return _argon2.encryptSync(inputSecret, salt, options);
    };
    Kdf.hashAsync = function (inputSecret, options) {
        if (options === void 0) { options = Kdf._defaultOptions; }
        var promise = new Promise(function (callback, reject) {
            _argon2.generateSalt(function (saltErr, salt) {
                if (saltErr != null) {
                    return reject(saltErr);
                }
                _argon2.encrypt(inputSecret, salt, options, function (encryptErr, hash) {
                    if (encryptErr != null) {
                        return reject(encryptErr);
                    }
                    return callback(hash);
                });
            });
        });
        return promise;
    };
    Kdf.verifySync = function (inputSecret, kdfOutputHash) {
        return _argon2.verifySync(kdfOutputHash, inputSecret);
    };
    Kdf.verifyAsync = function (inputSecret, kdfOutputHash) {
        var promise = new Promise(function (callback, reject) {
            _argon2.verify(kdfOutputHash, inputSecret, function (err) {
                if (err != null) {
                    return reject(err);
                }
                callback();
            });
        });
        return promise;
    };
    return Kdf;
}());
Kdf._defaultOptions = { argon2d: false, memoryCost: 12, parallelism: 2, timeCost: 10 };
exports.Kdf = Kdf;
/**
 * A realistic password strength estimator https://github.com/dropbox/zxcvbn
Could be run clientside, but is about 400KB in size, so probably not.  Idea?:  for client side, maybe try this if it's smaller: https://github.com/mozilla/fxa-password-strength-checker

zxcvbn is a password strength estimator inspired by password crackers. Through pattern matching and conservative entropy calculations, it recognizes and weighs 30k common passwords, common names and surnames according to US census data, popular English words from Wikipedia and US television and movies, and other common patterns like dates, repeats (aaa), sequences (abcd), keyboard patterns (qwertyuiop), and l33t speak.

Consider using zxcvbn as an algorithmic alternative to password composition policy — it is more secure, flexible, and usable when sites require a minimal complexity score in place of annoying rules like "passwords must contain three of {lower, upper, numbers, symbols}".

More secure: policies often fail both ways, allowing weak passwords (P@ssword1) and disallowing strong passwords.
More flexible: zxcvbn allows many password styles to flourish so long as it detects sufficient complexity — passphrases are rated highly given enough uncommon words, keyboard patterns are ranked based on length and number of turns, and capitalization adds more complexity when it's unpredictaBle.
More usable: Use zxcvbn to build simple, rule-free interfaces that give instant feedback. In addition to scoring, zxcvbn includes minimal, targeted verbal feedback that can help guide users towards less guessable passwords.
 */
exports.passwordStrengthEstimator = require("zxcvbn");
//# sourceMappingURL=security.js.map