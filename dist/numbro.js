(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.numbro = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v8.0.1
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2018 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,

    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
      ROUNDING_MODE = 4,                       // 0 to 8

      // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

      // The exponent value at and beneath which toString returns exponential notation.
      // Number type: -7
      TO_EXP_NEG = -7,                         // 0 to -MAX

      // The exponent value at and above which toString returns exponential notation.
      // Number type: 21
      TO_EXP_POS = 21,                         // 0 to MAX

      // RANGE : [MIN_EXP, MAX_EXP]

      // The minimum exponent value, beneath which underflow to zero occurs.
      // Number type: -324  (5e-324)
      MIN_EXP = -1e7,                          // -1 to -MAX

      // The maximum exponent value, above which overflow to Infinity occurs.
      // Number type:  308  (1.7976931348623157e+308)
      // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
      MAX_EXP = 1e7,                           // 1 to MAX

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                    // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',      // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * n {number|string|BigNumber} A numeric value.
     * [b] {number} The base of n. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(n, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor usage without new.
      if (!(x instanceof BigNumber)) {

        // Don't throw on constructor call without new (#81).
        // '[BigNumber Error] Constructor call without new: {n}'
        //throw Error(bignumberError + ' Constructor call without new: ' + n);
        return new BigNumber(n, b);
      }

      if (b == null) {

        // Duplicate.
        if (n instanceof BigNumber) {
          x.s = n.s;
          x.e = n.e;
          x.c = (n = n.c) ? n.slice() : n;
          return;
        }

        isNum = typeof n == 'number';

        if (isNum && n * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / n < 0 ? (n = -n, -1) : 1;

          // Faster path for integers.
          if (n === ~~n) {
            for (e = 0, i = n; i >= 10; i /= 10, e++);
            x.e = e;
            x.c = [n];
            return;
          }

          str = String(n);
        } else {
          str = String(n);
          if (!isNumeric.test(str)) return parseNumeric(x, str, isNum);
          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');
        str = String(n);

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10) {
          x = new BigNumber(n instanceof BigNumber ? n : str);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        isNum = typeof n == 'number';

        if (isNum) {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (n * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / n < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + n);
          }

          // Prevent later check for length on converted number.
          isNum = false;
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(n), isNum, b);
          }
        }

        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      str = str.slice(i, ++len);

      if (str) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (n > MAX_SAFE_INTEGER || n !== mathfloor(n))) {
            throw Error
             (tooManyDigits + (x.s * n));
        }

        e = e - i - 1;

         // Overflow?
        if (e > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            str = str.slice(i);
            i = LOG_BASE - str.length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

    BigNumber.ROUND_UP = 0;
    BigNumber.ROUND_DOWN = 1;
    BigNumber.ROUND_CEIL = 2;
    BigNumber.ROUND_FLOOR = 3;
    BigNumber.ROUND_HALF_UP = 4;
    BigNumber.ROUND_HALF_DOWN = 5;
    BigNumber.ROUND_HALF_EVEN = 6;
    BigNumber.ROUND_HALF_CEIL = 7;
    BigNumber.ROUND_HALF_FLOOR = 8;
    BigNumber.EUCLID = 9;


    /*
     * Configure infrequently-changing library-wide settings.
     *
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if only one character,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * v {any}
     */
    BigNumber.isBigNumber = function (v) {
      return v instanceof BigNumber || v && v._isBigNumber === true || false;
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, P.lt);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, P.gt);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

              // 53 bits:
              // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
              // 11111 11111111 11111111 11111111 11100000 00000000 00000000
              // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
              //                                     11111 11111111 11111111
              // 0x20000 is 2^21.
              v = a[i] * 0x20000 + (a[i + 1] >>> 11);

              // Rejection sampling:
              // 0 <= v < 9007199254740992
              // Probability that v >= 9e15, is
              // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

        // Caller is convertBase.
        } else {
          q.e = e;
          q.r = +more;
        }

        return q;
      };
    })();


    /*
     * Return a string representing the value of BigNumber n in fixed-point or exponential
     * notation rounded to the specified decimal places or significant digits.
     *
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && ne <= TO_EXP_NEG
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    function maxOrMin(args, method) {
      var n,
        i = 1,
        m = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        n = new BigNumber(args[i]);

        // If any number is NaN, return NaN.
        if (!n.s) {
          m = n;
          break;
        } else if (method.call(m, n)) {
          m = n;
        }
      }

      return m;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
      } else {
        n.e = e;
        n.c = c;
      }

      return n;
    }


    // Handle values that fail the validity test in BigNumber.
    parseNumeric = (function () {
      var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
          x.c = x.e = null;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.c = x.e = x.s = null;
        }
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
      var d, i, j, k, n, ni, rd,
        xc = x.c,
        pows10 = POWS_TEN;

      // if x is not Infinity or NaN...
      if (xc) {

        // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
        // n is a base 1e14 number, the value of the element of array x.c containing rd.
        // ni is the index of n within x.c.
        // d is the number of digits of n.
        // i is the index of rd within n including leading zeros.
        // j is the actual index of rd within n (if < 0, rd is a leading zero).
        out: {

          // Get the number of digits of the first element of xc.
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = n / pows10[d - j - 1] % 10 | 0;
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
                n = rd = 0;
                d = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              n = k = xc[ni];

              // Get the number of digits of n.
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
     * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
    };


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber minus the value of
     * BigNumber(y, b).
     */
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
     * BigNumber(y, b). The result depends on the value of MODULO_MODE.
     */
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
      var x = new BigNumber(this);
      x.s = -x.s || null;
      return x;
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber plus the value of
     * BigNumber(y, b).
     */
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
     *  sqrt(-0) = -0
     *
     * Return a new BigNumber whose value is the square root of the value of this BigNumber,
     * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, r, rep, t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5');

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '1e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              dp += 4;
              s += 4;
              rep = 1;
            } else {

              // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
              // result. If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounding
     * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
     * but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) i = g1, g1 = g2, g2 = i, len -= i;

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
    };


    /*
     * Return a string representing the value of this BigNumber rounded to sd significant digits
     * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
     * necessary to represent the integer part of the value in fixed-point notation, then use
     * exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        str = coeffToString(n.c);

        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(str, e)
           : toFixedPoint(str, e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(str, e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol') {
      P[Symbol.toStringTag] = 'BigNumber';
      // Node.js v10.12.0+
      P[Symbol.for('nodejs.util.inspect.custom')] = P.valueOf;
    }

    if (configObject != null) BigNumber.set(configObject);

    return BigNumber;
  }


  // PRIVATE HELPER FUNCTIONS


  function bitFloor(n) {
    var i = n | 0;
    return n > 0 || n === i ? i : i - 1;
  }


  // Return a coefficient array as a string of base 10 digits.
  function coeffToString(a) {
    var s, z,
      i = 1,
      j = a.length,
      r = a[0] + '';

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== (n < 0 ? mathceil(n) : mathfloor(n))) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
  }
})(this);

},{}],2:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
module.exports = {
  languageTag: "en-US",
  delimiters: {
    thousands: ",",
    decimal: "."
  },
  abbreviations: {
    thousand: "k",
    million: "m",
    billion: "b",
    trillion: "t"
  },
  spaceSeparated: false,
  ordinal: function ordinal(number) {
    var b = number % 10;
    return ~~(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
  },
  currency: {
    symbol: "$",
    position: "prefix",
    code: "USD"
  },
  currencyFormat: {
    thousandSeparated: true,
    totalLength: 4,
    spaceSeparated: true,
    spaceSeparatedCurrency: true
  },
  formats: {
    fourDigits: {
      totalLength: 4,
      spaceSeparated: true
    },
    fullWithTwoDecimals: {
      output: "currency",
      thousandSeparated: true,
      mantissa: 2
    },
    fullWithTwoDecimalsNoCurrency: {
      thousandSeparated: true,
      mantissa: 2
    },
    fullWithNoDecimals: {
      output: "currency",
      thousandSeparated: true,
      mantissa: 0
    }
  }
};

},{}],3:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var globalState = require("./globalState");

var validating = require("./validating");

var parsing = require("./parsing");

var binarySuffixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
var decimalSuffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
var bytes = {
  general: {
    scale: 1024,
    suffixes: decimalSuffixes,
    marker: "bd"
  },
  binary: {
    scale: 1024,
    suffixes: binarySuffixes,
    marker: "b"
  },
  decimal: {
    scale: 1000,
    suffixes: decimalSuffixes,
    marker: "d"
  }
};
var defaultOptions = {
  totalLength: 0,
  characteristic: 0,
  forceAverage: false,
  average: false,
  mantissa: -1,
  optionalMantissa: true,
  thousandSeparated: false,
  spaceSeparated: false,
  negative: "sign",
  forceSign: false,
  roundingFunction: Math.round
};
/**
 * Entry point. Format the provided INSTANCE according to the PROVIDEDFORMAT.
 * This method ensure the prefix and postfix are added as the last step.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {NumbroFormat|string} [providedFormat] - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */

function _format(instance) {
  var providedFormat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var numbro = arguments.length > 2 ? arguments[2] : undefined;

  if (typeof providedFormat === "string") {
    providedFormat = parsing.parseFormat(providedFormat);
  }

  var valid = validating.validateFormat(providedFormat);

  if (!valid) {
    return "ERROR: invalid format";
  }

  var prefix = providedFormat.prefix || "";
  var postfix = providedFormat.postfix || "";
  var output = formatNumbro(instance, providedFormat, numbro);
  output = insertPrefix(output, prefix);
  output = insertPostfix(output, postfix);
  return output;
}
/**
 * Format the provided INSTANCE according to the PROVIDEDFORMAT.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatNumbro(instance, providedFormat, numbro) {
  switch (providedFormat.output) {
    case "currency":
      {
        providedFormat = formatOrDefault(providedFormat, globalState.currentCurrencyDefaultFormat());
        return formatCurrency(instance, providedFormat, globalState, numbro);
      }

    case "percent":
      {
        providedFormat = formatOrDefault(providedFormat, globalState.currentPercentageDefaultFormat());
        return formatPercentage(instance, providedFormat, globalState, numbro);
      }

    case "byte":
      providedFormat = formatOrDefault(providedFormat, globalState.currentByteDefaultFormat());
      return formatByte(instance, providedFormat, globalState, numbro);

    case "time":
      providedFormat = formatOrDefault(providedFormat, globalState.currentTimeDefaultFormat());
      return formatTime(instance, providedFormat, globalState, numbro);

    case "ordinal":
      providedFormat = formatOrDefault(providedFormat, globalState.currentOrdinalDefaultFormat());
      return formatOrdinal(instance, providedFormat, globalState, numbro);

    case "number":
    default:
      return formatNumber({
        instance: instance,
        providedFormat: providedFormat,
        numbro: numbro
      });
  }
}
/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1000).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getDecimalByteUnit(instance) {
  var data = bytes.decimal;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Get the binary byte unit (MiB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getBinaryByteUnit(instance) {
  var data = bytes.binary;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getByteUnit(instance) {
  var data = bytes.general;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Return the value and the suffix computed in byte.
 * It uses the SUFFIXES and the SCALE provided.
 *
 * @param {number} value - Number to format
 * @param {[String]} suffixes - List of suffixes
 * @param {number} scale - Number in-between two units
 * @return {{value: Number, suffix: String}}
 */


function getFormatByteUnits(value, suffixes, scale) {
  var suffix = suffixes[0];
  var abs = Math.abs(value);

  if (abs >= scale) {
    for (var power = 1; power < suffixes.length; ++power) {
      var min = Math.pow(scale, power);
      var max = Math.pow(scale, power + 1);

      if (abs >= min && abs < max) {
        suffix = suffixes[power];
        value = value / min;
        break;
      }
    } // values greater than or equal to [scale] YB never set the suffix


    if (suffix === suffixes[0]) {
      value = value / Math.pow(scale, suffixes.length - 1);
      suffix = suffixes[suffixes.length - 1];
    }
  }

  return {
    value: value,
    suffix: suffix
  };
}
/**
 * Format the provided INSTANCE as bytes using the PROVIDEDFORMAT, and STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatByte(instance, providedFormat, state, numbro) {
  var base = providedFormat.base || "binary";
  var baseInfo = bytes[base];

  var _getFormatByteUnits = getFormatByteUnits(instance._value, baseInfo.suffixes, baseInfo.scale),
      value = _getFormatByteUnits.value,
      suffix = _getFormatByteUnits.suffix;

  var output = formatNumber({
    instance: numbro(value),
    providedFormat: providedFormat,
    state: state,
    defaults: state.currentByteDefaultFormat()
  });
  var abbreviations = state.currentAbbreviations();
  return "".concat(output).concat(abbreviations.spaced ? " " : "").concat(suffix);
}
/**
 * Format the provided INSTANCE as an ordinal using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */


function formatOrdinal(instance, providedFormat, state) {
  var ordinalFn = state.currentOrdinal();
  var options = Object.assign({}, defaultOptions, providedFormat);
  var output = formatNumber({
    instance: instance,
    providedFormat: providedFormat,
    state: state
  });
  var ordinal = ordinalFn(instance._value);
  return "".concat(output).concat(options.spaceSeparated ? " " : "").concat(ordinal);
}
/**
 * Format the provided INSTANCE as a time HH:MM:SS.
 *
 * @param {Numbro} instance - numbro instance to format
 * @return {string}
 */


function formatTime(instance) {
  var hours = Math.floor(instance._value / 60 / 60);
  var minutes = Math.floor((instance._value - hours * 60 * 60) / 60);
  var seconds = Math.round(instance._value - hours * 60 * 60 - minutes * 60);
  return "".concat(hours, ":").concat(minutes < 10 ? "0" : "").concat(minutes, ":").concat(seconds < 10 ? "0" : "").concat(seconds);
}
/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatPercentage(instance, providedFormat, state, numbro) {
  var prefixSymbol = providedFormat.prefixSymbol;
  var output = formatNumber({
    instance: numbro(instance._value * 100),
    providedFormat: providedFormat,
    state: state
  });
  var options = Object.assign({}, defaultOptions, providedFormat);

  if (prefixSymbol) {
    return "%".concat(options.spaceSeparated ? " " : "").concat(output);
  }

  return "".concat(output).concat(options.spaceSeparated ? " " : "", "%");
}
/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */


function formatCurrency(instance, providedFormat, state) {
  var currentCurrency = state.currentCurrency();
  var options = Object.assign({}, defaultOptions, providedFormat);
  var decimalSeparator = undefined;
  var space = "";
  var average = !!options.totalLength || !!options.forceAverage || options.average;
  var position = providedFormat.currencyPosition || currentCurrency.position;
  var symbol = providedFormat.currencySymbol || currentCurrency.symbol;
  var spaceSeparatedCurrency = options.spaceSeparatedCurrency !== void 0 ? options.spaceSeparatedCurrency : options.spaceSeparated;

  if (spaceSeparatedCurrency) {
    space = " ";
  }

  if (position === "infix") {
    decimalSeparator = space + symbol + space;
  }

  var output = formatNumber({
    instance: instance,
    providedFormat: providedFormat,
    state: state,
    decimalSeparator: decimalSeparator
  });

  if (position === "prefix") {
    if (instance._value < 0 && options.negative === "sign") {
      output = "-".concat(space).concat(symbol).concat(output.slice(1));
    } else if (instance._value > 0 && options.forceSign) {
      output = "+".concat(space).concat(symbol).concat(output.slice(1));
    } else {
      output = symbol + space + output;
    }
  }

  if (!position || position === "postfix") {
    space = average ? "" : space;
    output = output + space + symbol;
  }

  return output;
}
/**
 * Compute the average value out of VALUE.
 * The other parameters are computation options.
 *
 * @param {number} value - value to compute
 * @param {string} [forceAverage] - forced unit used to compute
 * @param {{}} abbreviations - part of the language specification
 * @param {boolean} spaceSeparated - `true` if a space must be inserted between the value and the abbreviation
 * @param {number} [totalLength] - total length of the output including the characteristic and the mantissa
 * @return {{value: number, abbreviation: string, mantissaPrecision: number}}
 */


function computeAverage(_ref) {
  var value = _ref.value,
      forceAverage = _ref.forceAverage,
      abbreviations = _ref.abbreviations,
      _ref$spaceSeparated = _ref.spaceSeparated,
      spaceSeparated = _ref$spaceSeparated === void 0 ? false : _ref$spaceSeparated,
      _ref$totalLength = _ref.totalLength,
      totalLength = _ref$totalLength === void 0 ? 0 : _ref$totalLength;
  var abbreviation = "";
  var abs = Math.abs(value);
  var mantissaPrecision = -1;

  if (abs >= Math.pow(10, 12) && !forceAverage || forceAverage === "trillion") {
    // trillion
    abbreviation = abbreviations.trillion;
    value = value / Math.pow(10, 12);
  } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !forceAverage || forceAverage === "billion") {
    // billion
    abbreviation = abbreviations.billion;
    value = value / Math.pow(10, 9);
  } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !forceAverage || forceAverage === "million") {
    // million
    abbreviation = abbreviations.million;
    value = value / Math.pow(10, 6);
  } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !forceAverage || forceAverage === "thousand") {
    // thousand
    abbreviation = abbreviations.thousand;
    value = value / Math.pow(10, 3);
  }

  var optionalSpace = spaceSeparated ? " " : "";

  if (abbreviation) {
    abbreviation = optionalSpace + abbreviation;
  }

  if (totalLength) {
    var characteristic = value.toString().split(".")[0];
    mantissaPrecision = Math.max(totalLength - characteristic.length, 0);
  }

  return {
    value: value,
    abbreviation: abbreviation,
    mantissaPrecision: mantissaPrecision
  };
}
/**
 * Compute an exponential form for VALUE, taking into account CHARACTERISTIC
 * if provided.
 * @param {number} value - value to compute
 * @param {number} [characteristicPrecision] - optional characteristic length
 * @return {{value: number, abbreviation: string}}
 */


function computeExponential(_ref2) {
  var value = _ref2.value,
      _ref2$characteristicP = _ref2.characteristicPrecision,
      characteristicPrecision = _ref2$characteristicP === void 0 ? 0 : _ref2$characteristicP;

  var _value$toExponential$ = value.toExponential().split("e"),
      _value$toExponential$2 = _slicedToArray(_value$toExponential$, 2),
      numberString = _value$toExponential$2[0],
      exponential = _value$toExponential$2[1];

  var number = +numberString;

  if (!characteristicPrecision) {
    return {
      value: number,
      abbreviation: "e".concat(exponential)
    };
  }

  var characteristicLength = 1; // see `toExponential`

  if (characteristicLength < characteristicPrecision) {
    number = number * Math.pow(10, characteristicPrecision - characteristicLength);
    exponential = +exponential - (characteristicPrecision - characteristicLength);
    exponential = exponential >= 0 ? "+".concat(exponential) : exponential;
  }

  return {
    value: number,
    abbreviation: "e".concat(exponential)
  };
}
/**
 * Return a string of NUMBER zero.
 *
 * @param {number} number - Length of the output
 * @return {string}
 */


function zeroes(number) {
  var result = "";

  for (var i = 0; i < number; i++) {
    result += "0";
  }

  return result;
}
/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 * This method is for large/small numbers only (a.k.a. including a "e").
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @return {string}
 */


function toFixedLarge(value, precision) {
  var result = value.toString();

  var _result$split = result.split("e"),
      _result$split2 = _slicedToArray(_result$split, 2),
      base = _result$split2[0],
      exp = _result$split2[1];

  var _base$split = base.split("."),
      _base$split2 = _slicedToArray(_base$split, 2),
      characteristic = _base$split2[0],
      _base$split2$ = _base$split2[1],
      mantissa = _base$split2$ === void 0 ? "" : _base$split2$;

  if (+exp > 0) {
    result = characteristic + mantissa + zeroes(exp - mantissa.length);
  } else {
    var prefix = ".";

    if (+characteristic < 0) {
      prefix = "-0".concat(prefix);
    } else {
      prefix = "0".concat(prefix);
    }

    var suffix = (zeroes(-exp - 1) + Math.abs(characteristic) + mantissa).substr(0, precision);

    if (suffix.length < precision) {
      suffix += zeroes(precision - suffix.length);
    }

    result = prefix + suffix;
  }

  if (+exp > 0 && precision > 0) {
    result += ".".concat(zeroes(precision));
  }

  return result;
}
/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @param {function} roundingFunction - rounding function to be used
 * @return {string}
 */


function toFixed(value, precision) {
  var roundingFunction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Math.round;

  if (value.toString().indexOf("e") !== -1) {
    return toFixedLarge(value, precision);
  }

  return (roundingFunction(+"".concat(value, "e+").concat(precision)) / Math.pow(10, precision)).toFixed(precision);
}
/**
 * Return the current OUTPUT with a mantissa precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalMantissa - if `true`, the mantissa is omitted when it's only zeroes
 * @param {number} precision - desired precision of the mantissa
 * @param {boolean} trim - if `true`, trailing zeroes are removed from the mantissa
 * @return {string}
 */


function setMantissaPrecision(output, value, optionalMantissa, precision, trim, roundingFunction) {
  if (precision === -1) {
    return output;
  }

  var result = toFixed(value, precision, roundingFunction);

  var _result$toString$spli = result.toString().split("."),
      _result$toString$spli2 = _slicedToArray(_result$toString$spli, 2),
      currentCharacteristic = _result$toString$spli2[0],
      _result$toString$spli3 = _result$toString$spli2[1],
      currentMantissa = _result$toString$spli3 === void 0 ? "" : _result$toString$spli3;

  if (currentMantissa.match(/^0+$/) && (optionalMantissa || trim)) {
    return currentCharacteristic;
  }

  var hasTrailingZeroes = currentMantissa.match(/0+$/);

  if (trim && hasTrailingZeroes) {
    return "".concat(currentCharacteristic, ".").concat(currentMantissa.toString().slice(0, hasTrailingZeroes.index));
  }

  return result.toString();
}
/**
 * Return the current OUTPUT with a characteristic precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalCharacteristic - `true` if the characteristic is omitted when it's only zeroes
 * @param {number} precision - desired precision of the characteristic
 * @return {string}
 */


function setCharacteristicPrecision(output, value, optionalCharacteristic, precision) {
  var result = output;

  var _result$toString$spli4 = result.toString().split("."),
      _result$toString$spli5 = _slicedToArray(_result$toString$spli4, 2),
      currentCharacteristic = _result$toString$spli5[0],
      currentMantissa = _result$toString$spli5[1];

  if (currentCharacteristic.match(/^-?0$/) && optionalCharacteristic) {
    if (!currentMantissa) {
      return currentCharacteristic.replace("0", "");
    }

    return "".concat(currentCharacteristic.replace("0", ""), ".").concat(currentMantissa);
  }

  if (currentCharacteristic.length < precision) {
    var missingZeros = precision - currentCharacteristic.length;

    for (var i = 0; i < missingZeros; i++) {
      result = "0".concat(result);
    }
  }

  return result.toString();
}
/**
 * Return the indexes where are the group separations after splitting
 * `totalLength` in group of `groupSize` size.
 * Important: we start grouping from the right hand side.
 *
 * @param {number} totalLength - total length of the characteristic to split
 * @param {number} groupSize - length of each group
 * @return {[number]}
 */


function indexesOfGroupSpaces(totalLength, groupSize) {
  var result = [];
  var counter = 0;

  for (var i = totalLength; i > 0; i--) {
    if (counter === groupSize) {
      result.unshift(i);
      counter = 0;
    }

    counter++;
  }

  return result;
}
/**
 * Replace the decimal separator with DECIMALSEPARATOR and insert thousand
 * separators.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} thousandSeparated - `true` if the characteristic must be separated
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @return {string}
 */


function replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator) {
  var delimiters = state.currentDelimiters();
  var thousandSeparator = delimiters.thousands;
  decimalSeparator = decimalSeparator || delimiters.decimal;
  var thousandsSize = delimiters.thousandsSize || 3;
  var result = output.toString();
  var characteristic = result.split(".")[0];
  var mantissa = result.split(".")[1];
  var hasNegativeSign = value < 0 && characteristic.indexOf("-") === 0;

  if (thousandSeparated) {
    if (hasNegativeSign) {
      // Remove the negative sign
      characteristic = characteristic.slice(1);
    }

    var indexesToInsertThousandDelimiters = indexesOfGroupSpaces(characteristic.length, thousandsSize);
    indexesToInsertThousandDelimiters.forEach(function (position, index) {
      characteristic = characteristic.slice(0, position + index) + thousandSeparator + characteristic.slice(position + index);
    });

    if (hasNegativeSign) {
      // Add back the negative sign
      characteristic = "-".concat(characteristic);
    }
  }

  if (!mantissa) {
    result = characteristic;
  } else {
    result = characteristic + decimalSeparator + mantissa;
  }

  return result;
}
/**
 * Insert the provided ABBREVIATION at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} abbreviation - abbreviation to append
 * @return {*}
 */


function insertAbbreviation(output, abbreviation) {
  return output + abbreviation;
}
/**
 * Insert the positive/negative sign according to the NEGATIVE flag.
 * If the value is negative but still output as 0, the negative sign is removed.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {string} negative - flag for the negative form ("sign" or "parenthesis")
 * @return {*}
 */


function insertSign(output, value, negative) {
  if (value === 0) {
    return output;
  }

  if (+output === 0) {
    return output.replace("-", "");
  }

  if (value > 0) {
    return "+".concat(output);
  }

  if (negative === "sign") {
    return output;
  }

  return "(".concat(output.replace("-", ""), ")");
}
/**
 * Insert the provided PREFIX at the start of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} prefix - abbreviation to prepend
 * @return {*}
 */


function insertPrefix(output, prefix) {
  return prefix + output;
}
/**
 * Insert the provided POSTFIX at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} postfix - abbreviation to append
 * @return {*}
 */


function insertPostfix(output, postfix) {
  return output + postfix;
}
/**
 * Format the provided INSTANCE as a number using the PROVIDEDFORMAT,
 * and the STATE.
 * This is the key method of the framework!
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} [providedFormat] - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @param {{}} defaults - Set of default values used for formatting
 * @return {string}
 */


function formatNumber(_ref3) {
  var instance = _ref3.instance,
      providedFormat = _ref3.providedFormat,
      _ref3$state = _ref3.state,
      state = _ref3$state === void 0 ? globalState : _ref3$state,
      decimalSeparator = _ref3.decimalSeparator,
      _ref3$defaults = _ref3.defaults,
      defaults = _ref3$defaults === void 0 ? state.currentDefaults() : _ref3$defaults;
  var value = instance._value;

  if (value === 0 && state.hasZeroFormat()) {
    return state.getZeroFormat();
  }

  if (!isFinite(value)) {
    return value.toString();
  }

  var options = Object.assign({}, defaultOptions, defaults, providedFormat);
  var totalLength = options.totalLength;
  var characteristicPrecision = totalLength ? 0 : options.characteristic;
  var optionalCharacteristic = options.optionalCharacteristic;
  var forceAverage = options.forceAverage;
  var average = !!totalLength || !!forceAverage || options.average; // default when averaging is to chop off decimals

  var mantissaPrecision = totalLength ? -1 : average && providedFormat.mantissa === undefined ? 0 : options.mantissa;
  var optionalMantissa = totalLength ? false : providedFormat.optionalMantissa === undefined ? mantissaPrecision === -1 : options.optionalMantissa;
  var trimMantissa = options.trimMantissa;
  var thousandSeparated = options.thousandSeparated;
  var spaceSeparated = options.spaceSeparated;
  var negative = options.negative;
  var forceSign = options.forceSign;
  var exponential = options.exponential;
  var roundingFunction = options.roundingFunction;
  var abbreviation = "";

  if (average) {
    var data = computeAverage({
      value: value,
      forceAverage: forceAverage,
      abbreviations: state.currentAbbreviations(),
      spaceSeparated: spaceSeparated,
      totalLength: totalLength
    });
    value = data.value;
    abbreviation += data.abbreviation;

    if (totalLength) {
      mantissaPrecision = data.mantissaPrecision;
    }
  }

  if (exponential) {
    var _data = computeExponential({
      value: value,
      characteristicPrecision: characteristicPrecision
    });

    value = _data.value;
    abbreviation = _data.abbreviation + abbreviation;
  }

  var output = setMantissaPrecision(value.toString(), value, optionalMantissa, mantissaPrecision, trimMantissa, roundingFunction);
  output = setCharacteristicPrecision(output, value, optionalCharacteristic, characteristicPrecision);
  output = replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator);

  if (average || exponential) {
    output = insertAbbreviation(output, abbreviation);
  }

  if (forceSign || value < 0) {
    output = insertSign(output, value, negative);
  }

  return output;
}
/**
 * If FORMAT is non-null and not just an output, return FORMAT.
 * Return DEFAULTFORMAT otherwise.
 *
 * @param providedFormat
 * @param defaultFormat
 */


function formatOrDefault(providedFormat, defaultFormat) {
  if (!providedFormat) {
    return defaultFormat;
  }

  var keys = Object.keys(providedFormat);

  if (keys.length === 1 && keys[0] === "output") {
    return defaultFormat;
  }

  return providedFormat;
}

module.exports = function (numbro) {
  return {
    format: function format() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _format.apply(void 0, args.concat([numbro]));
    },
    getByteUnit: function getByteUnit() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return _getByteUnit.apply(void 0, args.concat([numbro]));
    },
    getBinaryByteUnit: function getBinaryByteUnit() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _getBinaryByteUnit.apply(void 0, args.concat([numbro]));
    },
    getDecimalByteUnit: function getDecimalByteUnit() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return _getDecimalByteUnit.apply(void 0, args.concat([numbro]));
    },
    formatOrDefault: formatOrDefault
  };
};

},{"./globalState":4,"./parsing":8,"./validating":10}],4:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var enUS = require("./en-US");

var validating = require("./validating");

var parsing = require("./parsing");

var state = {};
var currentLanguageTag = undefined;
var languages = {};
var zeroFormat = null;
var globalDefaults = {};

function chooseLanguage(tag) {
  currentLanguageTag = tag;
}

function currentLanguageData() {
  return languages[currentLanguageTag];
}
/**
 * Return all the register languages
 *
 * @return {{}}
 */


state.languages = function () {
  return Object.assign({}, languages);
}; //
// Current language accessors
//

/**
 * Return the current language tag
 *
 * @return {string}
 */


state.currentLanguage = function () {
  return currentLanguageTag;
};
/**
 * Return the current language currency data
 *
 * @return {{}}
 */


state.currentCurrency = function () {
  return currentLanguageData().currency;
};
/**
 * Return the current language abbreviations data
 *
 * @return {{}}
 */


state.currentAbbreviations = function () {
  return currentLanguageData().abbreviations;
};
/**
 * Return the current language delimiters data
 *
 * @return {{}}
 */


state.currentDelimiters = function () {
  return currentLanguageData().delimiters;
};
/**
 * Return the current language ordinal function
 *
 * @return {function}
 */


state.currentOrdinal = function () {
  return currentLanguageData().ordinal;
}; //
// Defaults
//

/**
 * Return the current formatting defaults.
 * Use first uses the current language default, then fallback to the globally defined defaults.
 *
 * @return {{}}
 */


state.currentDefaults = function () {
  return Object.assign({}, currentLanguageData().defaults, globalDefaults);
};
/**
 * Return the ordinal default-format.
 * Use first uses the current language ordinal default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentOrdinalDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().ordinalFormat);
};
/**
 * Return the byte default-format.
 * Use first uses the current language byte default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentByteDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().byteFormat);
};
/**
 * Return the percentage default-format.
 * Use first uses the current language percentage default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentPercentageDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().percentageFormat);
};
/**
 * Return the currency default-format.
 * Use first uses the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentCurrencyDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().currencyFormat);
};
/**
 * Return the time default-format.
 * Use first uses the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentTimeDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().timeFormat);
};
/**
 * Set the global formatting defaults.
 *
 * @param {{}|string} format - formatting options to use as defaults
 */


state.setDefaults = function (format) {
  format = parsing.parseFormat(format);

  if (validating.validateFormat(format)) {
    globalDefaults = format;
  }
}; //
// Zero format
//

/**
 * Return the format string for 0.
 *
 * @return {string}
 */


state.getZeroFormat = function () {
  return zeroFormat;
};
/**
 * Set a STRING to output when the value is 0.
 *
 * @param {{}|string} string - string to set
 */


state.setZeroFormat = function (string) {
  return zeroFormat = typeof string === "string" ? string : null;
};
/**
 * Return true if a format for 0 has been set already.
 *
 * @return {boolean}
 */


state.hasZeroFormat = function () {
  return zeroFormat !== null;
}; //
// Getters/Setters
//

/**
 * Return the language data for the provided TAG.
 * Return the current language data if no tag is provided.
 *
 * Throw an error if the tag doesn't match any registered language.
 *
 * @param {string} [tag] - language tag of a registered language
 * @return {{}}
 */


state.languageData = function (tag) {
  if (tag) {
    if (languages[tag]) {
      return languages[tag];
    }

    throw new Error("Unknown tag \"".concat(tag, "\""));
  }

  return currentLanguageData();
};
/**
 * Register the provided DATA as a language if and only if the data is valid.
 * If the data is not valid, an error is thrown.
 *
 * When USELANGUAGE is true, the registered language is then used.
 *
 * @param {{}} data - language data to register
 * @param {boolean} [useLanguage] - `true` if the provided data should become the current language
 */


state.registerLanguage = function (data) {
  var useLanguage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!validating.validateLanguage(data)) {
    throw new Error("Invalid language data");
  }

  languages[data.languageTag] = data;

  if (useLanguage) {
    chooseLanguage(data.languageTag);
  }
};
/**
 * Set the current language according to TAG.
 * If TAG doesn't match a registered language, another language matching
 * the "language" part of the tag (according to BCP47: https://tools.ietf.org/rfc/bcp/bcp47.txt).
 * If none, the FALLBACKTAG is used. If the FALLBACKTAG doesn't match a register language,
 * `en-US` is finally used.
 *
 * @param tag
 * @param fallbackTag
 */


state.setLanguage = function (tag) {
  var fallbackTag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : enUS.languageTag;

  if (!languages[tag]) {
    var suffix = tag.split("-")[0];
    var matchingLanguageTag = Object.keys(languages).find(function (each) {
      return each.split("-")[0] === suffix;
    });

    if (!languages[matchingLanguageTag]) {
      chooseLanguage(fallbackTag);
      return;
    }

    chooseLanguage(matchingLanguageTag);
    return;
  }

  chooseLanguage(tag);
};

state.registerLanguage(enUS);
currentLanguageTag = enUS.languageTag;
module.exports = state;

},{"./en-US":2,"./parsing":8,"./validating":10}],5:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Load languages matching TAGS. Silently pass over the failing load.
 *
 * We assume here that we are in a node environment, so we don't check for it.
 * @param {[String]} tags - list of tags to load
 * @param {Numbro} numbro - the numbro singleton
 */
function _loadLanguagesInNode(tags, numbro) {
  tags.forEach(function (tag) {
    var data = undefined;

    try {
      data = require("../languages/".concat(tag));
    } catch (e) {
      console.error("Unable to load \"".concat(tag, "\". No matching language file found.")); // eslint-disable-line no-console
    }

    if (data) {
      numbro.registerLanguage(data);
    }
  });
}

module.exports = function (numbro) {
  return {
    loadLanguagesInNode: function loadLanguagesInNode(tags) {
      return _loadLanguagesInNode(tags, numbro);
    }
  };
};

},{}],6:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var BigNumber = require("bignumber.js");
/**
 * Add a number or a numbro to N.
 *
 * @param {Numbro} n - augend
 * @param {number|Numbro} other - addend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _add(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.plus(otherValue).toNumber();
  return n;
}
/**
 * Subtract a number or a numbro from N.
 *
 * @param {Numbro} n - minuend
 * @param {number|Numbro} other - subtrahend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _subtract(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.minus(otherValue).toNumber();
  return n;
}
/**
 * Multiply N by a number or a numbro.
 *
 * @param {Numbro} n - multiplicand
 * @param {number|Numbro} other - multiplier
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _multiply(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.times(otherValue).toNumber();
  return n;
}
/**
 * Divide N by a number or a numbro.
 *
 * @param {Numbro} n - dividend
 * @param {number|Numbro} other - divisor
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _divide(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.dividedBy(otherValue).toNumber();
  return n;
}
/**
 * Set N to the OTHER (or the value of OTHER when it's a numbro instance).
 *
 * @param {Numbro} n - numbro instance to mutate
 * @param {number|Numbro} other - new value to assign to N
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _set(n, other, numbro) {
  var value = other;

  if (numbro.isNumbro(other)) {
    value = other._value;
  }

  n._value = value;
  return n;
}
/**
 * Return the distance between N and OTHER.
 *
 * @param {Numbro} n
 * @param {number|Numbro} other
 * @param {numbro} numbro - numbro singleton
 * @return {number}
 */


function _difference(n, other, numbro) {
  var clone = numbro(n._value);

  _subtract(clone, other, numbro);

  return Math.abs(clone._value);
}

module.exports = function (numbro) {
  return {
    add: function add(n, other) {
      return _add(n, other, numbro);
    },
    subtract: function subtract(n, other) {
      return _subtract(n, other, numbro);
    },
    multiply: function multiply(n, other) {
      return _multiply(n, other, numbro);
    },
    divide: function divide(n, other) {
      return _divide(n, other, numbro);
    },
    set: function set(n, other) {
      return _set(n, other, numbro);
    },
    difference: function difference(n, other) {
      return _difference(n, other, numbro);
    }
  };
};

},{"bignumber.js":1}],7:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var VERSION = "2.1.2";

var globalState = require("./globalState");

var validator = require("./validating");

var loader = require("./loading")(numbro);

var unformatter = require("./unformatting");

var formatter = require("./formatting")(numbro);

var manipulate = require("./manipulating")(numbro);

var parsing = require("./parsing");

var Numbro =
/*#__PURE__*/
function () {
  function Numbro(number) {
    _classCallCheck(this, Numbro);

    this._value = number;
  }

  _createClass(Numbro, [{
    key: "clone",
    value: function clone() {
      return numbro(this._value);
    }
  }, {
    key: "format",
    value: function format() {
      var _format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return formatter.format(this, _format);
    }
  }, {
    key: "formatCurrency",
    value: function formatCurrency(format) {
      if (typeof format === "string") {
        format = parsing.parseFormat(format);
      }

      format = formatter.formatOrDefault(format, globalState.currentCurrencyDefaultFormat());
      format.output = "currency";
      return formatter.format(this, format);
    }
  }, {
    key: "formatTime",
    value: function formatTime() {
      var format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      format.output = "time";
      return formatter.format(this, format);
    }
  }, {
    key: "binaryByteUnits",
    value: function binaryByteUnits() {
      return formatter.getBinaryByteUnit(this);
    }
  }, {
    key: "decimalByteUnits",
    value: function decimalByteUnits() {
      return formatter.getDecimalByteUnit(this);
    }
  }, {
    key: "byteUnits",
    value: function byteUnits() {
      return formatter.getByteUnit(this);
    }
  }, {
    key: "difference",
    value: function difference(other) {
      return manipulate.difference(this, other);
    }
  }, {
    key: "add",
    value: function add(other) {
      return manipulate.add(this, other);
    }
  }, {
    key: "subtract",
    value: function subtract(other) {
      return manipulate.subtract(this, other);
    }
  }, {
    key: "multiply",
    value: function multiply(other) {
      return manipulate.multiply(this, other);
    }
  }, {
    key: "divide",
    value: function divide(other) {
      return manipulate.divide(this, other);
    }
  }, {
    key: "set",
    value: function set(input) {
      return manipulate.set(this, normalizeInput(input));
    }
  }, {
    key: "value",
    value: function value() {
      return this._value;
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      return this._value;
    }
  }]);

  return Numbro;
}();
/**
 * Make its best to convert input into a number.
 *
 * @param {numbro|string|number} input - Input to convert
 * @return {number}
 */


function normalizeInput(input) {
  var result = input;

  if (numbro.isNumbro(input)) {
    result = input._value;
  } else if (typeof input === "string") {
    result = numbro.unformat(input);
  } else if (isNaN(input)) {
    result = NaN;
  }

  return result;
}

function numbro(input) {
  return new Numbro(normalizeInput(input));
}

numbro.version = VERSION;

numbro.isNumbro = function (object) {
  return object instanceof Numbro;
}; //
// `numbro` static methods
//


numbro.language = globalState.currentLanguage;
numbro.registerLanguage = globalState.registerLanguage;
numbro.setLanguage = globalState.setLanguage;
numbro.languages = globalState.languages;
numbro.languageData = globalState.languageData;
numbro.zeroFormat = globalState.setZeroFormat;
numbro.defaultFormat = globalState.currentDefaults;
numbro.setDefaults = globalState.setDefaults;
numbro.defaultCurrencyFormat = globalState.currentCurrencyDefaultFormat;
numbro.validate = validator.validate;
numbro.loadLanguagesInNode = loader.loadLanguagesInNode;
numbro.unformat = unformatter.unformat;
module.exports = numbro;

},{"./formatting":3,"./globalState":4,"./loading":5,"./manipulating":6,"./parsing":8,"./unformatting":9,"./validating":10}],8:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Parse the format STRING looking for a prefix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parsePrefix(string, result) {
  var match = string.match(/^{([^}]*)}/);

  if (match) {
    result.prefix = match[1];
    return string.slice(match[0].length);
  }

  return string;
}
/**
 * Parse the format STRING looking for a postfix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parsePostfix(string, result) {
  var match = string.match(/{([^}]*)}$/);

  if (match) {
    result.postfix = match[1];
    return string.slice(0, -match[0].length);
  }

  return string;
}
/**
 * Parse the format STRING looking for the output value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseOutput(string, result) {
  if (string.indexOf("$") !== -1) {
    result.output = "currency";
    return;
  }

  if (string.indexOf("%") !== -1) {
    result.output = "percent";
    return;
  }

  if (string.indexOf("bd") !== -1) {
    result.output = "byte";
    result.base = "general";
    return;
  }

  if (string.indexOf("b") !== -1) {
    result.output = "byte";
    result.base = "binary";
    return;
  }

  if (string.indexOf("d") !== -1) {
    result.output = "byte";
    result.base = "decimal";
    return;
  }

  if (string.indexOf(":") !== -1) {
    result.output = "time";
    return;
  }

  if (string.indexOf("o") !== -1) {
    result.output = "ordinal";
  }
}
/**
 * Parse the format STRING looking for the thousand separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseThousandSeparated(string, result) {
  if (string.indexOf(",") !== -1) {
    result.thousandSeparated = true;
  }
}
/**
 * Parse the format STRING looking for the space separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseSpaceSeparated(string, result) {
  if (string.indexOf(" ") !== -1) {
    result.spaceSeparated = true;
    result.spaceSeparatedCurrency = true;
  }
}
/**
 * Parse the format STRING looking for the total length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseTotalLength(string, result) {
  var match = string.match(/[1-9]+[0-9]*/);

  if (match) {
    result.totalLength = +match[0];
  }
}
/**
 * Parse the format STRING looking for the characteristic length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseCharacteristic(string, result) {
  var characteristic = string.split(".")[0];
  var match = characteristic.match(/0+/);

  if (match) {
    result.characteristic = match[0].length;
  }
}
/**
 * Parse the format STRING looking for the mantissa length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseMantissa(string, result) {
  var mantissa = string.split(".")[1];

  if (mantissa) {
    var match = mantissa.match(/0+/);

    if (match) {
      result.mantissa = match[0].length;
    }
  }
}
/**
 * Parse the format STRING looking for the average value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseAverage(string, result) {
  if (string.indexOf("a") !== -1) {
    result.average = true;
  }
}
/**
 * Parse the format STRING looking for a forced average precision. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseForceAverage(string, result) {
  if (string.indexOf("K") !== -1) {
    result.forceAverage = "thousand";
  } else if (string.indexOf("M") !== -1) {
    result.forceAverage = "million";
  } else if (string.indexOf("B") !== -1) {
    result.forceAverage = "billion";
  } else if (string.indexOf("T") !== -1) {
    result.forceAverage = "trillion";
  }
}
/**
 * Parse the format STRING finding if the mantissa is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseOptionalMantissa(string, result) {
  if (string.match(/\[\.]/)) {
    result.optionalMantissa = true;
  } else if (string.match(/\./)) {
    result.optionalMantissa = false;
  }
}
/**
 * Parse the format STRING finding if the characteristic is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseOptionalCharacteristic(string, result) {
  if (string.indexOf(".") !== -1) {
    var characteristic = string.split(".")[0];
    result.optionalCharacteristic = characteristic.indexOf("0") === -1;
  }
}
/**
 * Parse the format STRING looking for the negative format. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseNegative(string, result) {
  if (string.match(/^\+?\([^)]*\)$/)) {
    result.negative = "parenthesis";
  }

  if (string.match(/^\+?-/)) {
    result.negative = "sign";
  }
}
/**
 * Parse the format STRING finding if the sign is mandatory. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseForceSign(string, result) {
  if (string.match(/^\+/)) {
    result.forceSign = true;
  }
}
/**
 * Parse the format STRING and accumulating the values ie RESULT.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {NumbroFormat} - format
 */


function parseFormat(string) {
  var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (typeof string !== "string") {
    return string;
  }

  string = parsePrefix(string, result);
  string = parsePostfix(string, result);
  parseOutput(string, result);
  parseTotalLength(string, result);
  parseCharacteristic(string, result);
  parseOptionalCharacteristic(string, result);
  parseAverage(string, result);
  parseForceAverage(string, result);
  parseMantissa(string, result);
  parseOptionalMantissa(string, result);
  parseThousandSeparated(string, result);
  parseSpaceSeparated(string, result);
  parseNegative(string, result);
  parseForceSign(string, result);
  return result;
}

module.exports = {
  parseFormat: parseFormat
};

},{}],9:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var allSuffixes = [{
  key: "ZiB",
  factor: Math.pow(1024, 7)
}, {
  key: "ZB",
  factor: Math.pow(1000, 7)
}, {
  key: "YiB",
  factor: Math.pow(1024, 8)
}, {
  key: "YB",
  factor: Math.pow(1000, 8)
}, {
  key: "TiB",
  factor: Math.pow(1024, 4)
}, {
  key: "TB",
  factor: Math.pow(1000, 4)
}, {
  key: "PiB",
  factor: Math.pow(1024, 5)
}, {
  key: "PB",
  factor: Math.pow(1000, 5)
}, {
  key: "MiB",
  factor: Math.pow(1024, 2)
}, {
  key: "MB",
  factor: Math.pow(1000, 2)
}, {
  key: "KiB",
  factor: Math.pow(1024, 1)
}, {
  key: "KB",
  factor: Math.pow(1000, 1)
}, {
  key: "GiB",
  factor: Math.pow(1024, 3)
}, {
  key: "GB",
  factor: Math.pow(1000, 3)
}, {
  key: "EiB",
  factor: Math.pow(1024, 6)
}, {
  key: "EB",
  factor: Math.pow(1000, 6)
}, {
  key: "B",
  factor: 1
}];
/**
 * Generate a RegExp where S get all RegExp specific characters escaped.
 *
 * @param {string} s - string representing a RegExp
 * @return {string}
 */

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
/**
 * Recursively compute the unformatted value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */


function computeUnformattedValue(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (!isNaN(+inputString)) {
    return +inputString;
  }

  var stripped = ""; // Negative

  var newInput = inputString.replace(/(^[^(]*)\((.*)\)([^)]*$)/, "$1$2$3");

  if (newInput !== inputString) {
    return -1 * computeUnformattedValue(newInput, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
  } // Byte


  for (var i = 0; i < allSuffixes.length; i++) {
    var suffix = allSuffixes[i];
    stripped = inputString.replace(suffix.key, "");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * suffix.factor;
    }
  } // Percent


  stripped = inputString.replace("%", "");

  if (stripped !== inputString) {
    return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) / 100;
  } // Ordinal


  var possibleOrdinalValue = parseFloat(inputString);

  if (isNaN(possibleOrdinalValue)) {
    return undefined;
  }

  var ordinalString = ordinal(possibleOrdinalValue);

  if (ordinalString && ordinalString !== ".") {
    // if ordinal is "." it will be caught next round in the +inputString
    stripped = inputString.replace(new RegExp("".concat(escapeRegExp(ordinalString), "$")), "");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }
  } // Average


  var inversedAbbreviations = {};
  Object.keys(abbreviations).forEach(function (key) {
    inversedAbbreviations[abbreviations[key]] = key;
  });
  var abbreviationValues = Object.keys(inversedAbbreviations).sort().reverse();
  var numberOfAbbreviations = abbreviationValues.length;

  for (var _i = 0; _i < numberOfAbbreviations; _i++) {
    var value = abbreviationValues[_i];
    var key = inversedAbbreviations[value];
    stripped = inputString.replace(value, "");

    if (stripped !== inputString) {
      var factor = undefined;

      switch (key) {
        // eslint-disable-line default-case
        case "thousand":
          factor = Math.pow(10, 3);
          break;

        case "million":
          factor = Math.pow(10, 6);
          break;

        case "billion":
          factor = Math.pow(10, 9);
          break;

        case "trillion":
          factor = Math.pow(10, 12);
          break;
      }

      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * factor;
    }
  }

  return undefined;
}
/**
 * Removes in one pass all formatting symbols.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @return {string}
 */


function removeFormattingSymbols(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  // Currency
  var stripped = inputString.replace(currencySymbol, ""); // Thousand separators

  stripped = stripped.replace(new RegExp("([0-9])".concat(escapeRegExp(delimiters.thousands), "([0-9])"), "g"), "$1$2"); // Decimal

  stripped = stripped.replace(delimiters.decimal, ".");
  return stripped;
}
/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */


function unformatValue(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (inputString === "") {
    return undefined;
  } // Zero Format


  if (inputString === zeroFormat) {
    return 0;
  }

  var value = removeFormattingSymbols(inputString, delimiters, currencySymbol);
  return computeUnformattedValue(value, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
}
/**
 * Check if the INPUTSTRING represents a time.
 *
 * @param {string} inputString - string to check
 * @param {*} delimiters - Delimiters used while generating the inputString
 * @return {boolean}
 */


function matchesTime(inputString, delimiters) {
  var separators = inputString.indexOf(":") && delimiters.thousands !== ":";

  if (!separators) {
    return false;
  }

  var segments = inputString.split(":");

  if (segments.length !== 3) {
    return false;
  }

  var hours = +segments[0];
  var minutes = +segments[1];
  var seconds = +segments[2];
  return !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds);
}
/**
 * Unformat a numbro-generated string representing a time to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @return {number}
 */


function unformatTime(inputString) {
  var segments = inputString.split(":");
  var hours = +segments[0];
  var minutes = +segments[1];
  var seconds = +segments[2];
  return seconds + 60 * minutes + 3600 * hours;
}
/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {NumbroFormat} format - format used  while generating the inputString
 * @return {number}
 */


function unformat(inputString, format) {
  // Avoid circular references
  var globalState = require("./globalState");

  var delimiters = globalState.currentDelimiters();
  var currencySymbol = globalState.currentCurrency().symbol;
  var ordinal = globalState.currentOrdinal();
  var zeroFormat = globalState.getZeroFormat();
  var abbreviations = globalState.currentAbbreviations();
  var value = undefined;

  if (typeof inputString === "string") {
    if (matchesTime(inputString, delimiters)) {
      value = unformatTime(inputString);
    } else {
      value = unformatValue(inputString, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }
  } else if (typeof inputString === "number") {
    value = inputString;
  } else {
    return undefined;
  }

  if (value === undefined) {
    return undefined;
  }

  return value;
}

module.exports = {
  unformat: unformat
};

},{"./globalState":4}],10:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var unformatter = require("./unformatting"); // Simplified regexp supporting only `language`, `script`, and `region`


var bcp47RegExp = /^[a-z]{2,3}(-[a-zA-Z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;
var validOutputValues = ["currency", "percent", "byte", "time", "ordinal", "number"];
var validForceAverageValues = ["trillion", "billion", "million", "thousand"];
var validCurrencyPosition = ["prefix", "infix", "postfix"];
var validNegativeValues = ["sign", "parenthesis"];
var validMandatoryAbbreviations = {
  type: "object",
  children: {
    thousand: {
      type: "string",
      mandatory: true
    },
    million: {
      type: "string",
      mandatory: true
    },
    billion: {
      type: "string",
      mandatory: true
    },
    trillion: {
      type: "string",
      mandatory: true
    }
  },
  mandatory: true
};
var validAbbreviations = {
  type: "object",
  children: {
    thousand: "string",
    million: "string",
    billion: "string",
    trillion: "string"
  }
};
var validBaseValues = ["decimal", "binary", "general"];
var validFormat = {
  output: {
    type: "string",
    validValues: validOutputValues
  },
  base: {
    type: "string",
    validValues: validBaseValues,
    restriction: function restriction(number, format) {
      return format.output === "byte";
    },
    message: "`base` must be provided only when the output is `byte`",
    mandatory: function mandatory(format) {
      return format.output === "byte";
    }
  },
  characteristic: {
    type: "number",
    restriction: function restriction(number) {
      return number >= 0;
    },
    message: "value must be positive"
  },
  prefix: "string",
  postfix: "string",
  forceAverage: {
    type: "string",
    validValues: validForceAverageValues
  },
  average: "boolean",
  currencyPosition: {
    type: "string",
    validValues: validCurrencyPosition
  },
  currencySymbol: "string",
  totalLength: {
    type: "number",
    restrictions: [{
      restriction: function restriction(number) {
        return number >= 0;
      },
      message: "value must be positive"
    }, {
      restriction: function restriction(number, format) {
        return !format.exponential;
      },
      message: "`totalLength` is incompatible with `exponential`"
    }]
  },
  mantissa: {
    type: "number",
    restriction: function restriction(number) {
      return number >= 0;
    },
    message: "value must be positive"
  },
  optionalMantissa: "boolean",
  trimMantissa: "boolean",
  roundingFunction: "function",
  optionalCharacteristic: "boolean",
  thousandSeparated: "boolean",
  spaceSeparated: "boolean",
  spaceSeparatedCurrency: "boolean",
  abbreviations: validAbbreviations,
  negative: {
    type: "string",
    validValues: validNegativeValues
  },
  forceSign: "boolean",
  exponential: {
    type: "boolean"
  },
  prefixSymbol: {
    type: "boolean",
    restriction: function restriction(number, format) {
      return format.output === "percent";
    },
    message: "`prefixSymbol` can be provided only when the output is `percent`"
  }
};
var validLanguage = {
  languageTag: {
    type: "string",
    mandatory: true,
    restriction: function restriction(tag) {
      return tag.match(bcp47RegExp);
    },
    message: "the language tag must follow the BCP 47 specification (see https://tools.ieft.org/html/bcp47)"
  },
  delimiters: {
    type: "object",
    children: {
      thousands: "string",
      decimal: "string",
      thousandsSize: "number"
    },
    mandatory: true
  },
  abbreviations: validMandatoryAbbreviations,
  spaceSeparated: "boolean",
  spaceSeparatedCurrency: "boolean",
  ordinal: {
    type: "function",
    mandatory: true
  },
  currency: {
    type: "object",
    children: {
      symbol: "string",
      position: "string",
      code: "string"
    },
    mandatory: true
  },
  defaults: "format",
  ordinalFormat: "format",
  byteFormat: "format",
  percentageFormat: "format",
  currencyFormat: "format",
  timeDefaults: "format",
  formats: {
    type: "object",
    children: {
      fourDigits: {
        type: "format",
        mandatory: true
      },
      fullWithTwoDecimals: {
        type: "format",
        mandatory: true
      },
      fullWithTwoDecimalsNoCurrency: {
        type: "format",
        mandatory: true
      },
      fullWithNoDecimals: {
        type: "format",
        mandatory: true
      }
    }
  }
};
/**
 * Check the validity of the provided input and format.
 * The check is NOT lazy.
 *
 * @param {string|number|Numbro} input - input to check
 * @param {NumbroFormat} format - format to check
 * @return {boolean} True when everything is correct
 */

function validate(input, format) {
  var validInput = validateInput(input);
  var isFormatValid = validateFormat(format);
  return validInput && isFormatValid;
}
/**
 * Check the validity of the numbro input.
 *
 * @param {string|number|Numbro} input - input to check
 * @return {boolean} True when everything is correct
 */


function validateInput(input) {
  var value = unformatter.unformat(input);
  return !!value;
}
/**
 * Check the validity of the provided format TOVALIDATE against SPEC.
 *
 * @param {NumbroFormat} toValidate - format to check
 * @param {*} spec - specification against which to check
 * @param {string} prefix - prefix use for error messages
 * @param {boolean} skipMandatoryCheck - `true` when the check for mandatory key must be skipped
 * @return {boolean} True when everything is correct
 */


function validateSpec(toValidate, spec, prefix) {
  var skipMandatoryCheck = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var results = Object.keys(toValidate).map(function (key) {
    if (!spec[key]) {
      console.error("".concat(prefix, " Invalid key: ").concat(key)); // eslint-disable-line no-console

      return false;
    }

    var value = toValidate[key];
    var data = spec[key];

    if (typeof data === "string") {
      data = {
        type: data
      };
    }

    if (data.type === "format") {
      // all formats are partial (a.k.a will be merged with some default values) thus no need to check mandatory values
      var valid = validateSpec(value, validFormat, "[Validate ".concat(key, "]"), true);

      if (!valid) {
        return false;
      }
    } else if (_typeof(value) !== data.type) {
      console.error("".concat(prefix, " ").concat(key, " type mismatched: \"").concat(data.type, "\" expected, \"").concat(_typeof(value), "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.restrictions && data.restrictions.length) {
      var length = data.restrictions.length;

      for (var i = 0; i < length; i++) {
        var _data$restrictions$i = data.restrictions[i],
            restriction = _data$restrictions$i.restriction,
            message = _data$restrictions$i.message;

        if (!restriction(value, toValidate)) {
          console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(message)); // eslint-disable-line no-console

          return false;
        }
      }
    }

    if (data.restriction && !data.restriction(value, toValidate)) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(data.message)); // eslint-disable-line no-console

      return false;
    }

    if (data.validValues && data.validValues.indexOf(value) === -1) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: must be among ").concat(JSON.stringify(data.validValues), ", \"").concat(value, "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.children) {
      var _valid = validateSpec(value, data.children, "[Validate ".concat(key, "]"));

      if (!_valid) {
        return false;
      }
    }

    return true;
  });

  if (!skipMandatoryCheck) {
    results.push.apply(results, _toConsumableArray(Object.keys(spec).map(function (key) {
      var data = spec[key];

      if (typeof data === "string") {
        data = {
          type: data
        };
      }

      if (data.mandatory) {
        var mandatory = data.mandatory;

        if (typeof mandatory === "function") {
          mandatory = mandatory(toValidate);
        }

        if (mandatory && toValidate[key] === undefined) {
          console.error("".concat(prefix, " Missing mandatory key \"").concat(key, "\"")); // eslint-disable-line no-console

          return false;
        }
      }

      return true;
    })));
  }

  return results.reduce(function (acc, current) {
    return acc && current;
  }, true);
}
/**
 * Check the provided FORMAT.
 *
 * @param {NumbroFormat} format - format to check
 * @return {boolean}
 */


function validateFormat(format) {
  return validateSpec(format, validFormat, "[Validate format]");
}
/**
 * Check the provided LANGUAGE.
 *
 * @param {NumbroLanguage} language - language to check
 * @return {boolean}
 */


function validateLanguage(language) {
  return validateSpec(language, validLanguage, "[Validate language]");
}

module.exports = {
  validate: validate,
  validateFormat: validateFormat,
  validateInput: validateInput,
  validateLanguage: validateLanguage
};

},{"./unformatting":9}]},{},[7])(7)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnbnVtYmVyLmpzL2JpZ251bWJlci5qcyIsInNyYy9lbi1VUy5qcyIsInNyYy9mb3JtYXR0aW5nLmpzIiwic3JjL2dsb2JhbFN0YXRlLmpzIiwic3JjL2xvYWRpbmcuanMiLCJzcmMvbWFuaXB1bGF0aW5nLmpzIiwic3JjL251bWJyby5qcyIsInNyYy9wYXJzaW5nLmpzIiwic3JjL3VuZm9ybWF0dGluZy5qcyIsInNyYy92YWxpZGF0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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Q2hDLFNBQU8sWUFBWSxDQUFDLFFBQUQsRUFBVyxhQUFYLEVBQTBCLHFCQUExQixDQUFuQjtBQUNIOztBQUVELE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBQ2IsRUFBQSxRQUFRLEVBQVIsUUFEYTtBQUViLEVBQUEsY0FBYyxFQUFkLGNBRmE7QUFHYixFQUFBLGFBQWEsRUFBYixhQUhhO0FBSWIsRUFBQSxnQkFBZ0IsRUFBaEI7QUFKYSxDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIjsoZnVuY3Rpb24gKGdsb2JhbE9iamVjdCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbi8qXHJcbiAqICAgICAgYmlnbnVtYmVyLmpzIHY4LjAuMVxyXG4gKiAgICAgIEEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBhcmJpdHJhcnktcHJlY2lzaW9uIGFyaXRobWV0aWMuXHJcbiAqICAgICAgaHR0cHM6Ly9naXRodWIuY29tL01pa2VNY2wvYmlnbnVtYmVyLmpzXHJcbiAqICAgICAgQ29weXJpZ2h0IChjKSAyMDE4IE1pY2hhZWwgTWNsYXVnaGxpbiA8TThjaDg4bEBnbWFpbC5jb20+XHJcbiAqICAgICAgTUlUIExpY2Vuc2VkLlxyXG4gKlxyXG4gKiAgICAgIEJpZ051bWJlci5wcm90b3R5cGUgbWV0aG9kcyAgICAgfCAgQmlnTnVtYmVyIG1ldGhvZHNcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBhYnNvbHV0ZVZhbHVlICAgICAgICAgICAgYWJzICAgIHwgIGNsb25lXHJcbiAqICAgICAgY29tcGFyZWRUbyAgICAgICAgICAgICAgICAgICAgICB8ICBjb25maWcgICAgICAgICAgICAgICBzZXRcclxuICogICAgICBkZWNpbWFsUGxhY2VzICAgICAgICAgICAgZHAgICAgIHwgICAgICBERUNJTUFMX1BMQUNFU1xyXG4gKiAgICAgIGRpdmlkZWRCeSAgICAgICAgICAgICAgICBkaXYgICAgfCAgICAgIFJPVU5ESU5HX01PREVcclxuICogICAgICBkaXZpZGVkVG9JbnRlZ2VyQnkgICAgICAgaWRpdiAgIHwgICAgICBFWFBPTkVOVElBTF9BVFxyXG4gKiAgICAgIGV4cG9uZW50aWF0ZWRCeSAgICAgICAgICBwb3cgICAgfCAgICAgIFJBTkdFXHJcbiAqICAgICAgaW50ZWdlclZhbHVlICAgICAgICAgICAgICAgICAgICB8ICAgICAgQ1JZUFRPXHJcbiAqICAgICAgaXNFcXVhbFRvICAgICAgICAgICAgICAgIGVxICAgICB8ICAgICAgTU9EVUxPX01PREVcclxuICogICAgICBpc0Zpbml0ZSAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICBQT1dfUFJFQ0lTSU9OXHJcbiAqICAgICAgaXNHcmVhdGVyVGhhbiAgICAgICAgICAgIGd0ICAgICB8ICAgICAgRk9STUFUXHJcbiAqICAgICAgaXNHcmVhdGVyVGhhbk9yRXF1YWxUbyAgIGd0ZSAgICB8ICAgICAgQUxQSEFCRVRcclxuICogICAgICBpc0ludGVnZXIgICAgICAgICAgICAgICAgICAgICAgIHwgIGlzQmlnTnVtYmVyXHJcbiAqICAgICAgaXNMZXNzVGhhbiAgICAgICAgICAgICAgIGx0ICAgICB8ICBtYXhpbXVtICAgICAgICAgICAgICBtYXhcclxuICogICAgICBpc0xlc3NUaGFuT3JFcXVhbFRvICAgICAgbHRlICAgIHwgIG1pbmltdW0gICAgICAgICAgICAgIG1pblxyXG4gKiAgICAgIGlzTmFOICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgcmFuZG9tXHJcbiAqICAgICAgaXNOZWdhdGl2ZSAgICAgICAgICAgICAgICAgICAgICB8ICBzdW1cclxuICogICAgICBpc1Bvc2l0aXZlICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBpc1plcm8gICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBtaW51cyAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBtb2R1bG8gICAgICAgICAgICAgICAgICAgbW9kICAgIHxcclxuICogICAgICBtdWx0aXBsaWVkQnkgICAgICAgICAgICAgdGltZXMgIHxcclxuICogICAgICBuZWdhdGVkICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBwbHVzICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBwcmVjaXNpb24gICAgICAgICAgICAgICAgc2QgICAgIHxcclxuICogICAgICBzaGlmdGVkQnkgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBzcXVhcmVSb290ICAgICAgICAgICAgICAgc3FydCAgIHxcclxuICogICAgICB0b0V4cG9uZW50aWFsICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0ZpeGVkICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0Zvcm1hdCAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0ZyYWN0aW9uICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0pTT04gICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b051bWJlciAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b1ByZWNpc2lvbiAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b1N0cmluZyAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB2YWx1ZU9mICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICpcclxuICovXHJcblxyXG5cclxuICB2YXIgQmlnTnVtYmVyLFxyXG4gICAgaXNOdW1lcmljID0gL14tPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoPzplWystXT9cXGQrKT8kL2ksXHJcblxyXG4gICAgbWF0aGNlaWwgPSBNYXRoLmNlaWwsXHJcbiAgICBtYXRoZmxvb3IgPSBNYXRoLmZsb29yLFxyXG5cclxuICAgIGJpZ251bWJlckVycm9yID0gJ1tCaWdOdW1iZXIgRXJyb3JdICcsXHJcbiAgICB0b29NYW55RGlnaXRzID0gYmlnbnVtYmVyRXJyb3IgKyAnTnVtYmVyIHByaW1pdGl2ZSBoYXMgbW9yZSB0aGFuIDE1IHNpZ25pZmljYW50IGRpZ2l0czogJyxcclxuXHJcbiAgICBCQVNFID0gMWUxNCxcclxuICAgIExPR19CQVNFID0gMTQsXHJcbiAgICBNQVhfU0FGRV9JTlRFR0VSID0gMHgxZmZmZmZmZmZmZmZmZiwgICAgICAgICAvLyAyXjUzIC0gMVxyXG4gICAgLy8gTUFYX0lOVDMyID0gMHg3ZmZmZmZmZiwgICAgICAgICAgICAgICAgICAgLy8gMl4zMSAtIDFcclxuICAgIFBPV1NfVEVOID0gWzEsIDEwLCAxMDAsIDFlMywgMWU0LCAxZTUsIDFlNiwgMWU3LCAxZTgsIDFlOSwgMWUxMCwgMWUxMSwgMWUxMiwgMWUxM10sXHJcbiAgICBTUVJUX0JBU0UgPSAxZTcsXHJcblxyXG4gICAgLy8gRURJVEFCTEVcclxuICAgIC8vIFRoZSBsaW1pdCBvbiB0aGUgdmFsdWUgb2YgREVDSU1BTF9QTEFDRVMsIFRPX0VYUF9ORUcsIFRPX0VYUF9QT1MsIE1JTl9FWFAsIE1BWF9FWFAsIGFuZFxyXG4gICAgLy8gdGhlIGFyZ3VtZW50cyB0byB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCwgYW5kIHRvUHJlY2lzaW9uLlxyXG4gICAgTUFYID0gMUU5OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhfSU5UMzJcclxuXHJcblxyXG4gIC8qXHJcbiAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBCaWdOdW1iZXIgY29uc3RydWN0b3IuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY2xvbmUoY29uZmlnT2JqZWN0KSB7XHJcbiAgICB2YXIgZGl2LCBjb252ZXJ0QmFzZSwgcGFyc2VOdW1lcmljLFxyXG4gICAgICBQID0gQmlnTnVtYmVyLnByb3RvdHlwZSA9IHsgY29uc3RydWN0b3I6IEJpZ051bWJlciwgdG9TdHJpbmc6IG51bGwsIHZhbHVlT2Y6IG51bGwgfSxcclxuICAgICAgT05FID0gbmV3IEJpZ051bWJlcigxKSxcclxuXHJcblxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVESVRBQkxFIENPTkZJRyBERUZBVUxUUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuICAgICAgLy8gVGhlIGRlZmF1bHQgdmFsdWVzIGJlbG93IG11c3QgYmUgaW50ZWdlcnMgd2l0aGluIHRoZSBpbmNsdXNpdmUgcmFuZ2VzIHN0YXRlZC5cclxuICAgICAgLy8gVGhlIHZhbHVlcyBjYW4gYWxzbyBiZSBjaGFuZ2VkIGF0IHJ1bi10aW1lIHVzaW5nIEJpZ051bWJlci5zZXQuXHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgZm9yIG9wZXJhdGlvbnMgaW52b2x2aW5nIGRpdmlzaW9uLlxyXG4gICAgICBERUNJTUFMX1BMQUNFUyA9IDIwLCAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBUaGUgcm91bmRpbmcgbW9kZSB1c2VkIHdoZW4gcm91bmRpbmcgdG8gdGhlIGFib3ZlIGRlY2ltYWwgcGxhY2VzLCBhbmQgd2hlbiB1c2luZ1xyXG4gICAgICAvLyB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCBhbmQgdG9QcmVjaXNpb24sIGFuZCByb3VuZCAoZGVmYXVsdCB2YWx1ZSkuXHJcbiAgICAgIC8vIFVQICAgICAgICAgMCBBd2F5IGZyb20gemVyby5cclxuICAgICAgLy8gRE9XTiAgICAgICAxIFRvd2FyZHMgemVyby5cclxuICAgICAgLy8gQ0VJTCAgICAgICAyIFRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAvLyBGTE9PUiAgICAgIDMgVG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgIC8vIEhBTEZfVVAgICAgNCBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdXAuXHJcbiAgICAgIC8vIEhBTEZfRE9XTiAgNSBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgZG93bi5cclxuICAgICAgLy8gSEFMRl9FVkVOICA2IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzIGV2ZW4gbmVpZ2hib3VyLlxyXG4gICAgICAvLyBIQUxGX0NFSUwgIDcgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAvLyBIQUxGX0ZMT09SIDggVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgLUluZmluaXR5LlxyXG4gICAgICBST1VORElOR19NT0RFID0gNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gOFxyXG5cclxuICAgICAgLy8gRVhQT05FTlRJQUxfQVQgOiBbVE9fRVhQX05FRyAsIFRPX0VYUF9QT1NdXHJcblxyXG4gICAgICAvLyBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGJlbmVhdGggd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgLy8gTnVtYmVyIHR5cGU6IC03XHJcbiAgICAgIFRPX0VYUF9ORUcgPSAtNywgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byAtTUFYXHJcblxyXG4gICAgICAvLyBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGFib3ZlIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAyMVxyXG4gICAgICBUT19FWFBfUE9TID0gMjEsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBSQU5HRSA6IFtNSU5fRVhQLCBNQVhfRVhQXVxyXG5cclxuICAgICAgLy8gVGhlIG1pbmltdW0gZXhwb25lbnQgdmFsdWUsIGJlbmVhdGggd2hpY2ggdW5kZXJmbG93IHRvIHplcm8gb2NjdXJzLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogLTMyNCAgKDVlLTMyNClcclxuICAgICAgTUlOX0VYUCA9IC0xZTcsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtMSB0byAtTUFYXHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBleHBvbmVudCB2YWx1ZSwgYWJvdmUgd2hpY2ggb3ZlcmZsb3cgdG8gSW5maW5pdHkgb2NjdXJzLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogIDMwOCAgKDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4KVxyXG4gICAgICAvLyBGb3IgTUFYX0VYUCA+IDFlNywgZS5nLiBuZXcgQmlnTnVtYmVyKCcxZTEwMDAwMDAwMCcpLnBsdXMoMSkgbWF5IGJlIHNsb3cuXHJcbiAgICAgIE1BWF9FWFAgPSAxZTcsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMSB0byBNQVhcclxuXHJcbiAgICAgIC8vIFdoZXRoZXIgdG8gdXNlIGNyeXB0b2dyYXBoaWNhbGx5LXNlY3VyZSByYW5kb20gbnVtYmVyIGdlbmVyYXRpb24sIGlmIGF2YWlsYWJsZS5cclxuICAgICAgQ1JZUFRPID0gZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0cnVlIG9yIGZhbHNlXHJcblxyXG4gICAgICAvLyBUaGUgbW9kdWxvIG1vZGUgdXNlZCB3aGVuIGNhbGN1bGF0aW5nIHRoZSBtb2R1bHVzOiBhIG1vZCBuLlxyXG4gICAgICAvLyBUaGUgcXVvdGllbnQgKHEgPSBhIC8gbikgaXMgY2FsY3VsYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGNvcnJlc3BvbmRpbmcgcm91bmRpbmcgbW9kZS5cclxuICAgICAgLy8gVGhlIHJlbWFpbmRlciAocikgaXMgY2FsY3VsYXRlZCBhczogciA9IGEgLSBuICogcS5cclxuICAgICAgLy9cclxuICAgICAgLy8gVVAgICAgICAgIDAgVGhlIHJlbWFpbmRlciBpcyBwb3NpdGl2ZSBpZiB0aGUgZGl2aWRlbmQgaXMgbmVnYXRpdmUsIGVsc2UgaXMgbmVnYXRpdmUuXHJcbiAgICAgIC8vIERPV04gICAgICAxIFRoZSByZW1haW5kZXIgaGFzIHRoZSBzYW1lIHNpZ24gYXMgdGhlIGRpdmlkZW5kLlxyXG4gICAgICAvLyAgICAgICAgICAgICBUaGlzIG1vZHVsbyBtb2RlIGlzIGNvbW1vbmx5IGtub3duIGFzICd0cnVuY2F0ZWQgZGl2aXNpb24nIGFuZCBpc1xyXG4gICAgICAvLyAgICAgICAgICAgICBlcXVpdmFsZW50IHRvIChhICUgbikgaW4gSmF2YVNjcmlwdC5cclxuICAgICAgLy8gRkxPT1IgICAgIDMgVGhlIHJlbWFpbmRlciBoYXMgdGhlIHNhbWUgc2lnbiBhcyB0aGUgZGl2aXNvciAoUHl0aG9uICUpLlxyXG4gICAgICAvLyBIQUxGX0VWRU4gNiBUaGlzIG1vZHVsbyBtb2RlIGltcGxlbWVudHMgdGhlIElFRUUgNzU0IHJlbWFpbmRlciBmdW5jdGlvbi5cclxuICAgICAgLy8gRVVDTElEICAgIDkgRXVjbGlkaWFuIGRpdmlzaW9uLiBxID0gc2lnbihuKSAqIGZsb29yKGEgLyBhYnMobikpLlxyXG4gICAgICAvLyAgICAgICAgICAgICBUaGUgcmVtYWluZGVyIGlzIGFsd2F5cyBwb3NpdGl2ZS5cclxuICAgICAgLy9cclxuICAgICAgLy8gVGhlIHRydW5jYXRlZCBkaXZpc2lvbiwgZmxvb3JlZCBkaXZpc2lvbiwgRXVjbGlkaWFuIGRpdmlzaW9uIGFuZCBJRUVFIDc1NCByZW1haW5kZXJcclxuICAgICAgLy8gbW9kZXMgYXJlIGNvbW1vbmx5IHVzZWQgZm9yIHRoZSBtb2R1bHVzIG9wZXJhdGlvbi5cclxuICAgICAgLy8gQWx0aG91Z2ggdGhlIG90aGVyIHJvdW5kaW5nIG1vZGVzIGNhbiBhbHNvIGJlIHVzZWQsIHRoZXkgbWF5IG5vdCBnaXZlIHVzZWZ1bCByZXN1bHRzLlxyXG4gICAgICBNT0RVTE9fTU9ERSA9IDEsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gOVxyXG5cclxuICAgICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0cyBvZiB0aGUgcmVzdWx0IG9mIHRoZSBleHBvbmVudGlhdGVkQnkgb3BlcmF0aW9uLlxyXG4gICAgICAvLyBJZiBQT1dfUFJFQ0lTSU9OIGlzIDAsIHRoZXJlIHdpbGwgYmUgdW5saW1pdGVkIHNpZ25pZmljYW50IGRpZ2l0cy5cclxuICAgICAgUE9XX1BSRUNJU0lPTiA9IDAsICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWFxyXG5cclxuICAgICAgLy8gVGhlIGZvcm1hdCBzcGVjaWZpY2F0aW9uIHVzZWQgYnkgdGhlIEJpZ051bWJlci5wcm90b3R5cGUudG9Gb3JtYXQgbWV0aG9kLlxyXG4gICAgICBGT1JNQVQgPSB7XHJcbiAgICAgICAgcHJlZml4OiAnJyxcclxuICAgICAgICBncm91cFNpemU6IDMsXHJcbiAgICAgICAgc2Vjb25kYXJ5R3JvdXBTaXplOiAwLFxyXG4gICAgICAgIGdyb3VwU2VwYXJhdG9yOiAnLCcsXHJcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvcjogJy4nLFxyXG4gICAgICAgIGZyYWN0aW9uR3JvdXBTaXplOiAwLFxyXG4gICAgICAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3I6ICdcXHhBMCcsICAgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgICAgc3VmZml4OiAnJ1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gVGhlIGFscGhhYmV0IHVzZWQgZm9yIGJhc2UgY29udmVyc2lvbi4gSXQgbXVzdCBiZSBhdCBsZWFzdCAyIGNoYXJhY3RlcnMgbG9uZywgd2l0aCBubyAnKycsXHJcbiAgICAgIC8vICctJywgJy4nLCB3aGl0ZXNwYWNlLCBvciByZXBlYXRlZCBjaGFyYWN0ZXIuXHJcbiAgICAgIC8vICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWiRfJ1xyXG4gICAgICBBTFBIQUJFVCA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonO1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbiAgICAvLyBDT05TVFJVQ1RPUlxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIEJpZ051bWJlciBjb25zdHJ1Y3RvciBhbmQgZXhwb3J0ZWQgZnVuY3Rpb24uXHJcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIG5ldyBpbnN0YW5jZSBvZiBhIEJpZ051bWJlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogbiB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAqIFtiXSB7bnVtYmVyfSBUaGUgYmFzZSBvZiBuLiBJbnRlZ2VyLCAyIHRvIEFMUEhBQkVULmxlbmd0aCBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIEJpZ051bWJlcihuLCBiKSB7XHJcbiAgICAgIHZhciBhbHBoYWJldCwgYywgY2FzZUNoYW5nZWQsIGUsIGksIGlzTnVtLCBsZW4sIHN0cixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIC8vIEVuYWJsZSBjb25zdHJ1Y3RvciB1c2FnZSB3aXRob3V0IG5ldy5cclxuICAgICAgaWYgKCEoeCBpbnN0YW5jZW9mIEJpZ051bWJlcikpIHtcclxuXHJcbiAgICAgICAgLy8gRG9uJ3QgdGhyb3cgb24gY29uc3RydWN0b3IgY2FsbCB3aXRob3V0IG5ldyAoIzgxKS5cclxuICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQ29uc3RydWN0b3IgY2FsbCB3aXRob3V0IG5ldzoge259J1xyXG4gICAgICAgIC8vdGhyb3cgRXJyb3IoYmlnbnVtYmVyRXJyb3IgKyAnIENvbnN0cnVjdG9yIGNhbGwgd2l0aG91dCBuZXc6ICcgKyBuKTtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihuLCBiKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGIgPT0gbnVsbCkge1xyXG5cclxuICAgICAgICAvLyBEdXBsaWNhdGUuXHJcbiAgICAgICAgaWYgKG4gaW5zdGFuY2VvZiBCaWdOdW1iZXIpIHtcclxuICAgICAgICAgIHgucyA9IG4ucztcclxuICAgICAgICAgIHguZSA9IG4uZTtcclxuICAgICAgICAgIHguYyA9IChuID0gbi5jKSA/IG4uc2xpY2UoKSA6IG47XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpc051bSA9IHR5cGVvZiBuID09ICdudW1iZXInO1xyXG5cclxuICAgICAgICBpZiAoaXNOdW0gJiYgbiAqIDAgPT0gMCkge1xyXG5cclxuICAgICAgICAgIC8vIFVzZSBgMSAvIG5gIHRvIGhhbmRsZSBtaW51cyB6ZXJvIGFsc28uXHJcbiAgICAgICAgICB4LnMgPSAxIC8gbiA8IDAgPyAobiA9IC1uLCAtMSkgOiAxO1xyXG5cclxuICAgICAgICAgIC8vIEZhc3RlciBwYXRoIGZvciBpbnRlZ2Vycy5cclxuICAgICAgICAgIGlmIChuID09PSB+fm4pIHtcclxuICAgICAgICAgICAgZm9yIChlID0gMCwgaSA9IG47IGkgPj0gMTA7IGkgLz0gMTAsIGUrKyk7XHJcbiAgICAgICAgICAgIHguZSA9IGU7XHJcbiAgICAgICAgICAgIHguYyA9IFtuXTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHN0ciA9IFN0cmluZyhuKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc3RyID0gU3RyaW5nKG4pO1xyXG4gICAgICAgICAgaWYgKCFpc051bWVyaWMudGVzdChzdHIpKSByZXR1cm4gcGFyc2VOdW1lcmljKHgsIHN0ciwgaXNOdW0pO1xyXG4gICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT0gNDUgPyAoc3RyID0gc3RyLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGVjaW1hbCBwb2ludD9cclxuICAgICAgICBpZiAoKGUgPSBzdHIuaW5kZXhPZignLicpKSA+IC0xKSBzdHIgPSBzdHIucmVwbGFjZSgnLicsICcnKTtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRpYWwgZm9ybT9cclxuICAgICAgICBpZiAoKGkgPSBzdHIuc2VhcmNoKC9lL2kpKSA+IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBEZXRlcm1pbmUgZXhwb25lbnQuXHJcbiAgICAgICAgICBpZiAoZSA8IDApIGUgPSBpO1xyXG4gICAgICAgICAgZSArPSArc3RyLnNsaWNlKGkgKyAxKTtcclxuICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgaSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgICAgIC8vIEludGVnZXIuXHJcbiAgICAgICAgICBlID0gc3RyLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQmFzZSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7Yn0nXHJcbiAgICAgICAgaW50Q2hlY2soYiwgMiwgQUxQSEFCRVQubGVuZ3RoLCAnQmFzZScpO1xyXG4gICAgICAgIHN0ciA9IFN0cmluZyhuKTtcclxuXHJcbiAgICAgICAgLy8gQWxsb3cgZXhwb25lbnRpYWwgbm90YXRpb24gdG8gYmUgdXNlZCB3aXRoIGJhc2UgMTAgYXJndW1lbnQsIHdoaWxlXHJcbiAgICAgICAgLy8gYWxzbyByb3VuZGluZyB0byBERUNJTUFMX1BMQUNFUyBhcyB3aXRoIG90aGVyIGJhc2VzLlxyXG4gICAgICAgIGlmIChiID09IDEwKSB7XHJcbiAgICAgICAgICB4ID0gbmV3IEJpZ051bWJlcihuIGluc3RhbmNlb2YgQmlnTnVtYmVyID8gbiA6IHN0cik7XHJcbiAgICAgICAgICByZXR1cm4gcm91bmQoeCwgREVDSU1BTF9QTEFDRVMgKyB4LmUgKyAxLCBST1VORElOR19NT0RFKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlzTnVtID0gdHlwZW9mIG4gPT0gJ251bWJlcic7XHJcblxyXG4gICAgICAgIGlmIChpc051bSkge1xyXG5cclxuICAgICAgICAgIC8vIEF2b2lkIHBvdGVudGlhbCBpbnRlcnByZXRhdGlvbiBvZiBJbmZpbml0eSBhbmQgTmFOIGFzIGJhc2UgNDQrIHZhbHVlcy5cclxuICAgICAgICAgIGlmIChuICogMCAhPSAwKSByZXR1cm4gcGFyc2VOdW1lcmljKHgsIHN0ciwgaXNOdW0sIGIpO1xyXG5cclxuICAgICAgICAgIHgucyA9IDEgLyBuIDwgMCA/IChzdHIgPSBzdHIuc2xpY2UoMSksIC0xKSA6IDE7XHJcblxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIE51bWJlciBwcmltaXRpdmUgaGFzIG1vcmUgdGhhbiAxNSBzaWduaWZpY2FudCBkaWdpdHM6IHtufSdcclxuICAgICAgICAgIGlmIChCaWdOdW1iZXIuREVCVUcgJiYgc3RyLnJlcGxhY2UoL14wXFwuMCp8XFwuLywgJycpLmxlbmd0aCA+IDE1KSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAodG9vTWFueURpZ2l0cyArIG4pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFByZXZlbnQgbGF0ZXIgY2hlY2sgZm9yIGxlbmd0aCBvbiBjb252ZXJ0ZWQgbnVtYmVyLlxyXG4gICAgICAgICAgaXNOdW0gPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT09IDQ1ID8gKHN0ciA9IHN0ci5zbGljZSgxKSwgLTEpIDogMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFscGhhYmV0ID0gQUxQSEFCRVQuc2xpY2UoMCwgYik7XHJcbiAgICAgICAgZSA9IGkgPSAwO1xyXG5cclxuICAgICAgICAvLyBDaGVjayB0aGF0IHN0ciBpcyBhIHZhbGlkIGJhc2UgYiBudW1iZXIuXHJcbiAgICAgICAgLy8gRG9uJ3QgdXNlIFJlZ0V4cCBzbyBhbHBoYWJldCBjYW4gY29udGFpbiBzcGVjaWFsIGNoYXJhY3RlcnMuXHJcbiAgICAgICAgZm9yIChsZW4gPSBzdHIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgIGlmIChhbHBoYWJldC5pbmRleE9mKGMgPSBzdHIuY2hhckF0KGkpKSA8IDApIHtcclxuICAgICAgICAgICAgaWYgKGMgPT0gJy4nKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIElmICcuJyBpcyBub3QgdGhlIGZpcnN0IGNoYXJhY3RlciBhbmQgaXQgaGFzIG5vdCBiZSBmb3VuZCBiZWZvcmUuXHJcbiAgICAgICAgICAgICAgaWYgKGkgPiBlKSB7XHJcbiAgICAgICAgICAgICAgICBlID0gbGVuO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFjYXNlQ2hhbmdlZCkge1xyXG5cclxuICAgICAgICAgICAgICAvLyBBbGxvdyBlLmcuIGhleGFkZWNpbWFsICdGRicgYXMgd2VsbCBhcyAnZmYnLlxyXG4gICAgICAgICAgICAgIGlmIChzdHIgPT0gc3RyLnRvVXBwZXJDYXNlKCkgJiYgKHN0ciA9IHN0ci50b0xvd2VyQ2FzZSgpKSB8fFxyXG4gICAgICAgICAgICAgICAgICBzdHIgPT0gc3RyLnRvTG93ZXJDYXNlKCkgJiYgKHN0ciA9IHN0ci50b1VwcGVyQ2FzZSgpKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZUNoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgaSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZU51bWVyaWMoeCwgU3RyaW5nKG4pLCBpc051bSwgYik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdHIgPSBjb252ZXJ0QmFzZShzdHIsIGIsIDEwLCB4LnMpO1xyXG5cclxuICAgICAgICAvLyBEZWNpbWFsIHBvaW50P1xyXG4gICAgICAgIGlmICgoZSA9IHN0ci5pbmRleE9mKCcuJykpID4gLTEpIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG4gICAgICAgIGVsc2UgZSA9IHN0ci5sZW5ndGg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIERldGVybWluZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKGkgPSAwOyBzdHIuY2hhckNvZGVBdChpKSA9PT0gNDg7IGkrKyk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgIGZvciAobGVuID0gc3RyLmxlbmd0aDsgc3RyLmNoYXJDb2RlQXQoLS1sZW4pID09PSA0ODspO1xyXG5cclxuICAgICAgc3RyID0gc3RyLnNsaWNlKGksICsrbGVuKTtcclxuXHJcbiAgICAgIGlmIChzdHIpIHtcclxuICAgICAgICBsZW4gLT0gaTtcclxuXHJcbiAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIE51bWJlciBwcmltaXRpdmUgaGFzIG1vcmUgdGhhbiAxNSBzaWduaWZpY2FudCBkaWdpdHM6IHtufSdcclxuICAgICAgICBpZiAoaXNOdW0gJiYgQmlnTnVtYmVyLkRFQlVHICYmXHJcbiAgICAgICAgICBsZW4gPiAxNSAmJiAobiA+IE1BWF9TQUZFX0lOVEVHRVIgfHwgbiAhPT0gbWF0aGZsb29yKG4pKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKHRvb01hbnlEaWdpdHMgKyAoeC5zICogbikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZSA9IGUgLSBpIC0gMTtcclxuXHJcbiAgICAgICAgIC8vIE92ZXJmbG93P1xyXG4gICAgICAgIGlmIChlID4gTUFYX0VYUCkge1xyXG5cclxuICAgICAgICAgIC8vIEluZmluaXR5LlxyXG4gICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVW5kZXJmbG93P1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA8IE1JTl9FWFApIHtcclxuXHJcbiAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4LmUgPSBlO1xyXG4gICAgICAgICAgeC5jID0gW107XHJcblxyXG4gICAgICAgICAgLy8gVHJhbnNmb3JtIGJhc2VcclxuXHJcbiAgICAgICAgICAvLyBlIGlzIHRoZSBiYXNlIDEwIGV4cG9uZW50LlxyXG4gICAgICAgICAgLy8gaSBpcyB3aGVyZSB0byBzbGljZSBzdHIgdG8gZ2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBjb2VmZmljaWVudCBhcnJheS5cclxuICAgICAgICAgIGkgPSAoZSArIDEpICUgTE9HX0JBU0U7XHJcbiAgICAgICAgICBpZiAoZSA8IDApIGkgKz0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgaWYgKGkgPCBsZW4pIHtcclxuICAgICAgICAgICAgaWYgKGkpIHguYy5wdXNoKCtzdHIuc2xpY2UoMCwgaSkpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZW4gLT0gTE9HX0JBU0U7IGkgPCBsZW47KSB7XHJcbiAgICAgICAgICAgICAgeC5jLnB1c2goK3N0ci5zbGljZShpLCBpICs9IExPR19CQVNFKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN0ciA9IHN0ci5zbGljZShpKTtcclxuICAgICAgICAgICAgaSA9IExPR19CQVNFIC0gc3RyLmxlbmd0aDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgLT0gbGVuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZvciAoOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgeC5jLnB1c2goK3N0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgIHguYyA9IFt4LmUgPSAwXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBDT05TVFJVQ1RPUiBQUk9QRVJUSUVTXHJcblxyXG5cclxuICAgIEJpZ051bWJlci5jbG9uZSA9IGNsb25lO1xyXG5cclxuICAgIEJpZ051bWJlci5ST1VORF9VUCA9IDA7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfRE9XTiA9IDE7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfQ0VJTCA9IDI7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfRkxPT1IgPSAzO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfVVAgPSA0O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRE9XTiA9IDU7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9FVkVOID0gNjtcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0NFSUwgPSA3O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRkxPT1IgPSA4O1xyXG4gICAgQmlnTnVtYmVyLkVVQ0xJRCA9IDk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBDb25maWd1cmUgaW5mcmVxdWVudGx5LWNoYW5naW5nIGxpYnJhcnktd2lkZSBzZXR0aW5ncy5cclxuICAgICAqXHJcbiAgICAgKiBBY2NlcHQgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBvcHRpb25hbCBwcm9wZXJ0aWVzIChpZiB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpc1xyXG4gICAgICogYSBudW1iZXIsIGl0IG11c3QgYmUgYW4gaW50ZWdlciB3aXRoaW4gdGhlIGluY2x1c2l2ZSByYW5nZSBzdGF0ZWQpOlxyXG4gICAgICpcclxuICAgICAqICAgREVDSU1BTF9QTEFDRVMgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byBNQVhcclxuICAgICAqICAgUk9VTkRJTkdfTU9ERSAgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byA4XHJcbiAgICAgKiAgIEVYUE9ORU5USUFMX0FUICAge251bWJlcnxudW1iZXJbXX0gIC1NQVggdG8gTUFYICBvciAgWy1NQVggdG8gMCwgMCB0byBNQVhdXHJcbiAgICAgKiAgIFJBTkdFICAgICAgICAgICAge251bWJlcnxudW1iZXJbXX0gIC1NQVggdG8gTUFYIChub3QgemVybykgIG9yICBbLU1BWCB0byAtMSwgMSB0byBNQVhdXHJcbiAgICAgKiAgIENSWVBUTyAgICAgICAgICAge2Jvb2xlYW59ICAgICAgICAgIHRydWUgb3IgZmFsc2VcclxuICAgICAqICAgTU9EVUxPX01PREUgICAgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byA5XHJcbiAgICAgKiAgIFBPV19QUkVDSVNJT04gICAgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gTUFYXHJcbiAgICAgKiAgIEFMUEhBQkVUICAgICAgICAge3N0cmluZ30gICAgICAgICAgIEEgc3RyaW5nIG9mIHR3byBvciBtb3JlIHVuaXF1ZSBjaGFyYWN0ZXJzIHdoaWNoIGRvZXNcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90IGNvbnRhaW4gJy4nLlxyXG4gICAgICogICBGT1JNQVQgICAgICAgICAgIHtvYmplY3R9ICAgICAgICAgICBBbiBvYmplY3Qgd2l0aCBzb21lIG9mIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcclxuICAgICAqICAgICBwcmVmaXggICAgICAgICAgICAgICAgIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgZ3JvdXBTaXplICAgICAgICAgICAgICB7bnVtYmVyfVxyXG4gICAgICogICAgIHNlY29uZGFyeUdyb3VwU2l6ZSAgICAge251bWJlcn1cclxuICAgICAqICAgICBncm91cFNlcGFyYXRvciAgICAgICAgIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgZGVjaW1hbFNlcGFyYXRvciAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGZyYWN0aW9uR3JvdXBTaXplICAgICAge251bWJlcn1cclxuICAgICAqICAgICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgc3VmZml4ICAgICAgICAgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICpcclxuICAgICAqIChUaGUgdmFsdWVzIGFzc2lnbmVkIHRvIHRoZSBhYm92ZSBGT1JNQVQgb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBjaGVja2VkIGZvciB2YWxpZGl0eS4pXHJcbiAgICAgKlxyXG4gICAgICogRS5nLlxyXG4gICAgICogQmlnTnVtYmVyLmNvbmZpZyh7IERFQ0lNQUxfUExBQ0VTIDogMjAsIFJPVU5ESU5HX01PREUgOiA0IH0pXHJcbiAgICAgKlxyXG4gICAgICogSWdub3JlIHByb3BlcnRpZXMvcGFyYW1ldGVycyBzZXQgdG8gbnVsbCBvciB1bmRlZmluZWQsIGV4Y2VwdCBmb3IgQUxQSEFCRVQuXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGFuIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIGN1cnJlbnQgdmFsdWVzLlxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuY29uZmlnID0gQmlnTnVtYmVyLnNldCA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgdmFyIHAsIHY7XHJcblxyXG4gICAgICBpZiAob2JqICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT0gJ29iamVjdCcpIHtcclxuXHJcbiAgICAgICAgICAvLyBERUNJTUFMX1BMQUNFUyB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gREVDSU1BTF9QTEFDRVMge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0RFQ0lNQUxfUExBQ0VTJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaW50Q2hlY2sodiwgMCwgTUFYLCBwKTtcclxuICAgICAgICAgICAgREVDSU1BTF9QTEFDRVMgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJPVU5ESU5HX01PREUge251bWJlcn0gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBST1VORElOR19NT0RFIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdST1VORElOR19NT0RFJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaW50Q2hlY2sodiwgMCwgOCwgcCk7XHJcbiAgICAgICAgICAgIFJPVU5ESU5HX01PREUgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEVYUE9ORU5USUFMX0FUIHtudW1iZXJ8bnVtYmVyW119XHJcbiAgICAgICAgICAvLyBJbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgIC8vIFtpbnRlZ2VyIC1NQVggdG8gMCBpbmNsdXNpdmUsIDAgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gRVhQT05FTlRJQUxfQVQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0VYUE9ORU5USUFMX0FUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHYgJiYgdi5wb3ApIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzBdLCAtTUFYLCAwLCBwKTtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzFdLCAwLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSB2WzBdO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9QT1MgPSB2WzFdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHYsIC1NQVgsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgICAgVE9fRVhQX05FRyA9IC0oVE9fRVhQX1BPUyA9IHYgPCAwID8gLXYgOiB2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJBTkdFIHtudW1iZXJ8bnVtYmVyW119IE5vbi16ZXJvIGludGVnZXIsIC1NQVggdG8gTUFYIGluY2x1c2l2ZSBvclxyXG4gICAgICAgICAgLy8gW2ludGVnZXIgLU1BWCB0byAtMSBpbmNsdXNpdmUsIGludGVnZXIgMSB0byBNQVggaW5jbHVzaXZlXS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBSQU5HRSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V8Y2Fubm90IGJlIHplcm99OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUkFOR0UnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpZiAodiAmJiB2LnBvcCkge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHZbMF0sIC1NQVgsIC0xLCBwKTtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzFdLCAxLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIE1JTl9FWFAgPSB2WzBdO1xyXG4gICAgICAgICAgICAgIE1BWF9FWFAgPSB2WzFdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHYsIC1NQVgsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgICAgIE1JTl9FWFAgPSAtKE1BWF9FWFAgPSB2IDwgMCA/IC12IDogdik7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgcCArICcgY2Fubm90IGJlIHplcm86ICcgKyB2KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDUllQVE8ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQ1JZUFRPIG5vdCB0cnVlIG9yIGZhbHNlOiB7dn0nXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gY3J5cHRvIHVuYXZhaWxhYmxlJ1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0NSWVBUTycpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh2ID09PSAhIXYpIHtcclxuICAgICAgICAgICAgICBpZiAodikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjcnlwdG8gIT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvICYmXHJcbiAgICAgICAgICAgICAgICAgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMgfHwgY3J5cHRvLnJhbmRvbUJ5dGVzKSkge1xyXG4gICAgICAgICAgICAgICAgICBDUllQVE8gPSB2O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gIXY7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnY3J5cHRvIHVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIENSWVBUTyA9IHY7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIG5vdCB0cnVlIG9yIGZhbHNlOiAnICsgdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBNT0RVTE9fTU9ERSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIDkgaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIE1PRFVMT19NT0RFIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdNT0RVTE9fTU9ERScpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIDksIHApO1xyXG4gICAgICAgICAgICBNT0RVTE9fTU9ERSA9IHY7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUE9XX1BSRUNJU0lPTiB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUE9XX1BSRUNJU0lPTiB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUE9XX1BSRUNJU0lPTicpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgIFBPV19QUkVDSVNJT04gPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEZPUk1BVCB7b2JqZWN0fVxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIEZPUk1BVCBub3QgYW4gb2JqZWN0OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnRk9STUFUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSBGT1JNQVQgPSB2O1xyXG4gICAgICAgICAgICBlbHNlIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBub3QgYW4gb2JqZWN0OiAnICsgdik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQUxQSEFCRVQge3N0cmluZ31cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBBTFBIQUJFVCBpbnZhbGlkOiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnQUxQSEFCRVQnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG5cclxuICAgICAgICAgICAgLy8gRGlzYWxsb3cgaWYgb25seSBvbmUgY2hhcmFjdGVyLFxyXG4gICAgICAgICAgICAvLyBvciBpZiBpdCBjb250YWlucyAnKycsICctJywgJy4nLCB3aGl0ZXNwYWNlLCBvciBhIHJlcGVhdGVkIGNoYXJhY3Rlci5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09ICdzdHJpbmcnICYmICEvXi4kfFsrLS5cXHNdfCguKS4qXFwxLy50ZXN0KHYpKSB7XHJcbiAgICAgICAgICAgICAgQUxQSEFCRVQgPSB2O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIGludmFsaWQ6ICcgKyB2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBPYmplY3QgZXhwZWN0ZWQ6IHt2fSdcclxuICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ09iamVjdCBleHBlY3RlZDogJyArIG9iaik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIERFQ0lNQUxfUExBQ0VTOiBERUNJTUFMX1BMQUNFUyxcclxuICAgICAgICBST1VORElOR19NT0RFOiBST1VORElOR19NT0RFLFxyXG4gICAgICAgIEVYUE9ORU5USUFMX0FUOiBbVE9fRVhQX05FRywgVE9fRVhQX1BPU10sXHJcbiAgICAgICAgUkFOR0U6IFtNSU5fRVhQLCBNQVhfRVhQXSxcclxuICAgICAgICBDUllQVE86IENSWVBUTyxcclxuICAgICAgICBNT0RVTE9fTU9ERTogTU9EVUxPX01PREUsXHJcbiAgICAgICAgUE9XX1BSRUNJU0lPTjogUE9XX1BSRUNJU0lPTixcclxuICAgICAgICBGT1JNQVQ6IEZPUk1BVCxcclxuICAgICAgICBBTFBIQUJFVDogQUxQSEFCRVRcclxuICAgICAgfTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB2IGlzIGEgQmlnTnVtYmVyIGluc3RhbmNlLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICpcclxuICAgICAqIHYge2FueX1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLmlzQmlnTnVtYmVyID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgcmV0dXJuIHYgaW5zdGFuY2VvZiBCaWdOdW1iZXIgfHwgdiAmJiB2Ll9pc0JpZ051bWJlciA9PT0gdHJ1ZSB8fCBmYWxzZTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBtYXhpbXVtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLm1heGltdW0gPSBCaWdOdW1iZXIubWF4ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbWF4T3JNaW4oYXJndW1lbnRzLCBQLmx0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBtaW5pbXVtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLm1pbmltdW0gPSBCaWdOdW1iZXIubWluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbWF4T3JNaW4oYXJndW1lbnRzLCBQLmd0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdpdGggYSByYW5kb20gdmFsdWUgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIDAgYW5kIGxlc3MgdGhhbiAxLFxyXG4gICAgICogYW5kIHdpdGggZHAsIG9yIERFQ0lNQUxfUExBQ0VTIGlmIGRwIGlzIG9taXR0ZWQsIGRlY2ltYWwgcGxhY2VzIChvciBsZXNzIGlmIHRyYWlsaW5nXHJcbiAgICAgKiB6ZXJvcyBhcmUgcHJvZHVjZWQpLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfSdcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBjcnlwdG8gdW5hdmFpbGFibGUnXHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5yYW5kb20gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgcG93Ml81MyA9IDB4MjAwMDAwMDAwMDAwMDA7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gYSA1MyBiaXQgaW50ZWdlciBuLCB3aGVyZSAwIDw9IG4gPCA5MDA3MTk5MjU0NzQwOTkyLlxyXG4gICAgICAvLyBDaGVjayBpZiBNYXRoLnJhbmRvbSgpIHByb2R1Y2VzIG1vcmUgdGhhbiAzMiBiaXRzIG9mIHJhbmRvbW5lc3MuXHJcbiAgICAgIC8vIElmIGl0IGRvZXMsIGFzc3VtZSBhdCBsZWFzdCA1MyBiaXRzIGFyZSBwcm9kdWNlZCwgb3RoZXJ3aXNlIGFzc3VtZSBhdCBsZWFzdCAzMCBiaXRzLlxyXG4gICAgICAvLyAweDQwMDAwMDAwIGlzIDJeMzAsIDB4ODAwMDAwIGlzIDJeMjMsIDB4MWZmZmZmIGlzIDJeMjEgLSAxLlxyXG4gICAgICB2YXIgcmFuZG9tNTNiaXRJbnQgPSAoTWF0aC5yYW5kb20oKSAqIHBvdzJfNTMpICYgMHgxZmZmZmZcclxuICAgICAgID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gbWF0aGZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3cyXzUzKTsgfVxyXG4gICAgICAgOiBmdW5jdGlvbiAoKSB7IHJldHVybiAoKE1hdGgucmFuZG9tKCkgKiAweDQwMDAwMDAwIHwgMCkgKiAweDgwMDAwMCkgK1xyXG4gICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDB4ODAwMDAwIHwgMCk7IH07XHJcblxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGRwKSB7XHJcbiAgICAgICAgdmFyIGEsIGIsIGUsIGssIHYsXHJcbiAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgIGMgPSBbXSxcclxuICAgICAgICAgIHJhbmQgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAgIGlmIChkcCA9PSBudWxsKSBkcCA9IERFQ0lNQUxfUExBQ0VTO1xyXG4gICAgICAgIGVsc2UgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcblxyXG4gICAgICAgIGsgPSBtYXRoY2VpbChkcCAvIExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgaWYgKENSWVBUTykge1xyXG5cclxuICAgICAgICAgIC8vIEJyb3dzZXJzIHN1cHBvcnRpbmcgY3J5cHRvLmdldFJhbmRvbVZhbHVlcy5cclxuICAgICAgICAgIGlmIChjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XHJcblxyXG4gICAgICAgICAgICBhID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDMyQXJyYXkoayAqPSAyKSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGs7KSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDUzIGJpdHM6XHJcbiAgICAgICAgICAgICAgLy8gKChNYXRoLnBvdygyLCAzMikgLSAxKSAqIE1hdGgucG93KDIsIDIxKSkudG9TdHJpbmcoMilcclxuICAgICAgICAgICAgICAvLyAxMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTEwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMFxyXG4gICAgICAgICAgICAgIC8vICgoTWF0aC5wb3coMiwgMzIpIC0gMSkgPj4+IDExKS50b1N0cmluZygyKVxyXG4gICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDExMTExIDExMTExMTExIDExMTExMTExXHJcbiAgICAgICAgICAgICAgLy8gMHgyMDAwMCBpcyAyXjIxLlxyXG4gICAgICAgICAgICAgIHYgPSBhW2ldICogMHgyMDAwMCArIChhW2kgKyAxXSA+Pj4gMTEpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBSZWplY3Rpb24gc2FtcGxpbmc6XHJcbiAgICAgICAgICAgICAgLy8gMCA8PSB2IDwgOTAwNzE5OTI1NDc0MDk5MlxyXG4gICAgICAgICAgICAgIC8vIFByb2JhYmlsaXR5IHRoYXQgdiA+PSA5ZTE1LCBpc1xyXG4gICAgICAgICAgICAgIC8vIDcxOTkyNTQ3NDA5OTIgLyA5MDA3MTk5MjU0NzQwOTkyIH49IDAuMDAwOCwgaS5lLiAxIGluIDEyNTFcclxuICAgICAgICAgICAgICBpZiAodiA+PSA5ZTE1KSB7XHJcbiAgICAgICAgICAgICAgICBiID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDMyQXJyYXkoMikpO1xyXG4gICAgICAgICAgICAgICAgYVtpXSA9IGJbMF07XHJcbiAgICAgICAgICAgICAgICBhW2kgKyAxXSA9IGJbMV07XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAwIDw9IHYgPD0gODk5OTk5OTk5OTk5OTk5OVxyXG4gICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICBjLnB1c2godiAlIDFlMTQpO1xyXG4gICAgICAgICAgICAgICAgaSArPSAyO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpID0gayAvIDI7XHJcblxyXG4gICAgICAgICAgLy8gTm9kZS5qcyBzdXBwb3J0aW5nIGNyeXB0by5yYW5kb21CeXRlcy5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoY3J5cHRvLnJhbmRvbUJ5dGVzKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBidWZmZXJcclxuICAgICAgICAgICAgYSA9IGNyeXB0by5yYW5kb21CeXRlcyhrICo9IDcpO1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IGkgPCBrOykge1xyXG5cclxuICAgICAgICAgICAgICAvLyAweDEwMDAwMDAwMDAwMDAgaXMgMl40OCwgMHgxMDAwMDAwMDAwMCBpcyAyXjQwXHJcbiAgICAgICAgICAgICAgLy8gMHgxMDAwMDAwMDAgaXMgMl4zMiwgMHgxMDAwMDAwIGlzIDJeMjRcclxuICAgICAgICAgICAgICAvLyAxMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMVxyXG4gICAgICAgICAgICAgIC8vIDAgPD0gdiA8IDkwMDcxOTkyNTQ3NDA5OTJcclxuICAgICAgICAgICAgICB2ID0gKChhW2ldICYgMzEpICogMHgxMDAwMDAwMDAwMDAwKSArIChhW2kgKyAxXSAqIDB4MTAwMDAwMDAwMDApICtcclxuICAgICAgICAgICAgICAgICAoYVtpICsgMl0gKiAweDEwMDAwMDAwMCkgKyAoYVtpICsgM10gKiAweDEwMDAwMDApICtcclxuICAgICAgICAgICAgICAgICAoYVtpICsgNF0gPDwgMTYpICsgKGFbaSArIDVdIDw8IDgpICsgYVtpICsgNl07XHJcblxyXG4gICAgICAgICAgICAgIGlmICh2ID49IDllMTUpIHtcclxuICAgICAgICAgICAgICAgIGNyeXB0by5yYW5kb21CeXRlcyg3KS5jb3B5KGEsIGkpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICBjLnB1c2godiAlIDFlMTQpO1xyXG4gICAgICAgICAgICAgICAgaSArPSA3O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpID0gayAvIDc7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBDUllQVE8gPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdjcnlwdG8gdW5hdmFpbGFibGUnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVzZSBNYXRoLnJhbmRvbS5cclxuICAgICAgICBpZiAoIUNSWVBUTykge1xyXG5cclxuICAgICAgICAgIGZvciAoOyBpIDwgazspIHtcclxuICAgICAgICAgICAgdiA9IHJhbmRvbTUzYml0SW50KCk7XHJcbiAgICAgICAgICAgIGlmICh2IDwgOWUxNSkgY1tpKytdID0gdiAlIDFlMTQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrID0gY1stLWldO1xyXG4gICAgICAgIGRwICU9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAvLyBDb252ZXJ0IHRyYWlsaW5nIGRpZ2l0cyB0byB6ZXJvcyBhY2NvcmRpbmcgdG8gZHAuXHJcbiAgICAgICAgaWYgKGsgJiYgZHApIHtcclxuICAgICAgICAgIHYgPSBQT1dTX1RFTltMT0dfQkFTRSAtIGRwXTtcclxuICAgICAgICAgIGNbaV0gPSBtYXRoZmxvb3IoayAvIHYpICogdjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyBlbGVtZW50cyB3aGljaCBhcmUgemVyby5cclxuICAgICAgICBmb3IgKDsgY1tpXSA9PT0gMDsgYy5wb3AoKSwgaS0tKTtcclxuXHJcbiAgICAgICAgLy8gWmVybz9cclxuICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgIGMgPSBbZSA9IDBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgZWxlbWVudHMgd2hpY2ggYXJlIHplcm8gYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgICAgIGZvciAoZSA9IC0xIDsgY1swXSA9PT0gMDsgYy5zcGxpY2UoMCwgMSksIGUgLT0gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICAgIC8vIENvdW50IHRoZSBkaWdpdHMgb2YgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYyB0byBkZXRlcm1pbmUgbGVhZGluZyB6ZXJvcywgYW5kLi4uXHJcbiAgICAgICAgICBmb3IgKGkgPSAxLCB2ID0gY1swXTsgdiA+PSAxMDsgdiAvPSAxMCwgaSsrKTtcclxuXHJcbiAgICAgICAgICAvLyBhZGp1c3QgdGhlIGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgICAgaWYgKGkgPCBMT0dfQkFTRSkgZSAtPSBMT0dfQkFTRSAtIGk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByYW5kLmUgPSBlO1xyXG4gICAgICAgIHJhbmQuYyA9IGM7XHJcbiAgICAgICAgcmV0dXJuIHJhbmQ7XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBzdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuc3VtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgaSA9IDEsXHJcbiAgICAgICAgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICBzdW0gPSBuZXcgQmlnTnVtYmVyKGFyZ3NbMF0pO1xyXG4gICAgICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOykgc3VtID0gc3VtLnBsdXMoYXJnc1tpKytdKTtcclxuICAgICAgcmV0dXJuIHN1bTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vIFBSSVZBVEUgRlVOQ1RJT05TXHJcblxyXG5cclxuICAgIC8vIENhbGxlZCBieSBCaWdOdW1iZXIgYW5kIEJpZ051bWJlci5wcm90b3R5cGUudG9TdHJpbmcuXHJcbiAgICBjb252ZXJ0QmFzZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkZWNpbWFsID0gJzAxMjM0NTY3ODknO1xyXG5cclxuICAgICAgLypcclxuICAgICAgICogQ29udmVydCBzdHJpbmcgb2YgYmFzZUluIHRvIGFuIGFycmF5IG9mIG51bWJlcnMgb2YgYmFzZU91dC5cclxuICAgICAgICogRWcuIHRvQmFzZU91dCgnMjU1JywgMTAsIDE2KSByZXR1cm5zIFsxNSwgMTVdLlxyXG4gICAgICAgKiBFZy4gdG9CYXNlT3V0KCdmZicsIDE2LCAxMCkgcmV0dXJucyBbMiwgNSwgNV0uXHJcbiAgICAgICAqL1xyXG4gICAgICBmdW5jdGlvbiB0b0Jhc2VPdXQoc3RyLCBiYXNlSW4sIGJhc2VPdXQsIGFscGhhYmV0KSB7XHJcbiAgICAgICAgdmFyIGosXHJcbiAgICAgICAgICBhcnIgPSBbMF0sXHJcbiAgICAgICAgICBhcnJMLFxyXG4gICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICBmb3IgKDsgaSA8IGxlbjspIHtcclxuICAgICAgICAgIGZvciAoYXJyTCA9IGFyci5sZW5ndGg7IGFyckwtLTsgYXJyW2FyckxdICo9IGJhc2VJbik7XHJcblxyXG4gICAgICAgICAgYXJyWzBdICs9IGFscGhhYmV0LmluZGV4T2Yoc3RyLmNoYXJBdChpKyspKTtcclxuXHJcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgYXJyLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJyW2pdID4gYmFzZU91dCAtIDEpIHtcclxuICAgICAgICAgICAgICBpZiAoYXJyW2ogKyAxXSA9PSBudWxsKSBhcnJbaiArIDFdID0gMDtcclxuICAgICAgICAgICAgICBhcnJbaiArIDFdICs9IGFycltqXSAvIGJhc2VPdXQgfCAwO1xyXG4gICAgICAgICAgICAgIGFycltqXSAlPSBiYXNlT3V0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ29udmVydCBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VJbiB0byBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VPdXQuXHJcbiAgICAgIC8vIElmIHRoZSBjYWxsZXIgaXMgdG9TdHJpbmcsIHdlIGFyZSBjb252ZXJ0aW5nIGZyb20gYmFzZSAxMCB0byBiYXNlT3V0LlxyXG4gICAgICAvLyBJZiB0aGUgY2FsbGVyIGlzIEJpZ051bWJlciwgd2UgYXJlIGNvbnZlcnRpbmcgZnJvbSBiYXNlSW4gdG8gYmFzZSAxMC5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHIsIGJhc2VJbiwgYmFzZU91dCwgc2lnbiwgY2FsbGVySXNUb1N0cmluZykge1xyXG4gICAgICAgIHZhciBhbHBoYWJldCwgZCwgZSwgaywgciwgeCwgeGMsIHksXHJcbiAgICAgICAgICBpID0gc3RyLmluZGV4T2YoJy4nKSxcclxuICAgICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMsXHJcbiAgICAgICAgICBybSA9IFJPVU5ESU5HX01PREU7XHJcblxyXG4gICAgICAgIC8vIE5vbi1pbnRlZ2VyLlxyXG4gICAgICAgIGlmIChpID49IDApIHtcclxuICAgICAgICAgIGsgPSBQT1dfUFJFQ0lTSU9OO1xyXG5cclxuICAgICAgICAgIC8vIFVubGltaXRlZCBwcmVjaXNpb24uXHJcbiAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gMDtcclxuICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG4gICAgICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoYmFzZUluKTtcclxuICAgICAgICAgIHggPSB5LnBvdyhzdHIubGVuZ3RoIC0gaSk7XHJcbiAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gaztcclxuXHJcbiAgICAgICAgICAvLyBDb252ZXJ0IHN0ciBhcyBpZiBhbiBpbnRlZ2VyLCB0aGVuIHJlc3RvcmUgdGhlIGZyYWN0aW9uIHBhcnQgYnkgZGl2aWRpbmcgdGhlXHJcbiAgICAgICAgICAvLyByZXN1bHQgYnkgaXRzIGJhc2UgcmFpc2VkIHRvIGEgcG93ZXIuXHJcblxyXG4gICAgICAgICAgeS5jID0gdG9CYXNlT3V0KHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKHguYyksIHguZSwgJzAnKSxcclxuICAgICAgICAgICAxMCwgYmFzZU91dCwgZGVjaW1hbCk7XHJcbiAgICAgICAgICB5LmUgPSB5LmMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ29udmVydCB0aGUgbnVtYmVyIGFzIGludGVnZXIuXHJcblxyXG4gICAgICAgIHhjID0gdG9CYXNlT3V0KHN0ciwgYmFzZUluLCBiYXNlT3V0LCBjYWxsZXJJc1RvU3RyaW5nXHJcbiAgICAgICAgID8gKGFscGhhYmV0ID0gQUxQSEFCRVQsIGRlY2ltYWwpXHJcbiAgICAgICAgIDogKGFscGhhYmV0ID0gZGVjaW1hbCwgQUxQSEFCRVQpKTtcclxuXHJcbiAgICAgICAgLy8geGMgbm93IHJlcHJlc2VudHMgc3RyIGFzIGFuIGludGVnZXIgYW5kIGNvbnZlcnRlZCB0byBiYXNlT3V0LiBlIGlzIHRoZSBleHBvbmVudC5cclxuICAgICAgICBlID0gayA9IHhjLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoOyB4Y1stLWtdID09IDA7IHhjLnBvcCgpKTtcclxuXHJcbiAgICAgICAgLy8gWmVybz9cclxuICAgICAgICBpZiAoIXhjWzBdKSByZXR1cm4gYWxwaGFiZXQuY2hhckF0KDApO1xyXG5cclxuICAgICAgICAvLyBEb2VzIHN0ciByZXByZXNlbnQgYW4gaW50ZWdlcj8gSWYgc28sIG5vIG5lZWQgZm9yIHRoZSBkaXZpc2lvbi5cclxuICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgIC0tZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeC5jID0geGM7XHJcbiAgICAgICAgICB4LmUgPSBlO1xyXG5cclxuICAgICAgICAgIC8vIFRoZSBzaWduIGlzIG5lZWRlZCBmb3IgY29ycmVjdCByb3VuZGluZy5cclxuICAgICAgICAgIHgucyA9IHNpZ247XHJcbiAgICAgICAgICB4ID0gZGl2KHgsIHksIGRwLCBybSwgYmFzZU91dCk7XHJcbiAgICAgICAgICB4YyA9IHguYztcclxuICAgICAgICAgIHIgPSB4LnI7XHJcbiAgICAgICAgICBlID0geC5lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8geGMgbm93IHJlcHJlc2VudHMgc3RyIGNvbnZlcnRlZCB0byBiYXNlT3V0LlxyXG5cclxuICAgICAgICAvLyBUSGUgaW5kZXggb2YgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICAgIGQgPSBlICsgZHAgKyAxO1xyXG5cclxuICAgICAgICAvLyBUaGUgcm91bmRpbmcgZGlnaXQ6IHRoZSBkaWdpdCB0byB0aGUgcmlnaHQgb2YgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgaSA9IHhjW2RdO1xyXG5cclxuICAgICAgICAvLyBMb29rIGF0IHRoZSByb3VuZGluZyBkaWdpdHMgYW5kIG1vZGUgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdG8gcm91bmQgdXAuXHJcblxyXG4gICAgICAgIGsgPSBiYXNlT3V0IC8gMjtcclxuICAgICAgICByID0gciB8fCBkIDwgMCB8fCB4Y1tkICsgMV0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgciA9IHJtIDwgNCA/IChpICE9IG51bGwgfHwgcikgJiYgKHJtID09IDAgfHwgcm0gPT0gKHgucyA8IDAgPyAzIDogMikpXHJcbiAgICAgICAgICAgICAgOiBpID4gayB8fCBpID09IGsgJiYocm0gPT0gNCB8fCByIHx8IHJtID09IDYgJiYgeGNbZCAtIDFdICYgMSB8fFxyXG4gICAgICAgICAgICAgICBybSA9PSAoeC5zIDwgMCA/IDggOiA3KSk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBpbmRleCBvZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgbm90IGdyZWF0ZXIgdGhhbiB6ZXJvLCBvciB4YyByZXByZXNlbnRzXHJcbiAgICAgICAgLy8gemVybywgdGhlbiB0aGUgcmVzdWx0IG9mIHRoZSBiYXNlIGNvbnZlcnNpb24gaXMgemVybyBvciwgaWYgcm91bmRpbmcgdXAsIGEgdmFsdWVcclxuICAgICAgICAvLyBzdWNoIGFzIDAuMDAwMDEuXHJcbiAgICAgICAgaWYgKGQgPCAxIHx8ICF4Y1swXSkge1xyXG5cclxuICAgICAgICAgIC8vIDFeLWRwIG9yIDBcclxuICAgICAgICAgIHN0ciA9IHIgPyB0b0ZpeGVkUG9pbnQoYWxwaGFiZXQuY2hhckF0KDEpLCAtZHAsIGFscGhhYmV0LmNoYXJBdCgwKSkgOiBhbHBoYWJldC5jaGFyQXQoMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBUcnVuY2F0ZSB4YyB0byB0aGUgcmVxdWlyZWQgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgeGMubGVuZ3RoID0gZDtcclxuXHJcbiAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgIGlmIChyKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSb3VuZGluZyB1cCBtYXkgbWVhbiB0aGUgcHJldmlvdXMgZGlnaXQgaGFzIHRvIGJlIHJvdW5kZWQgdXAgYW5kIHNvIG9uLlxyXG4gICAgICAgICAgICBmb3IgKC0tYmFzZU91dDsgKyt4Y1stLWRdID4gYmFzZU91dDspIHtcclxuICAgICAgICAgICAgICB4Y1tkXSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgIGlmICghZCkge1xyXG4gICAgICAgICAgICAgICAgKytlO1xyXG4gICAgICAgICAgICAgICAgeGMgPSBbMV0uY29uY2F0KHhjKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICBmb3IgKGsgPSB4Yy5sZW5ndGg7ICF4Y1stLWtdOyk7XHJcblxyXG4gICAgICAgICAgLy8gRS5nLiBbNCwgMTEsIDE1XSBiZWNvbWVzIDRiZi5cclxuICAgICAgICAgIGZvciAoaSA9IDAsIHN0ciA9ICcnOyBpIDw9IGs7IHN0ciArPSBhbHBoYWJldC5jaGFyQXQoeGNbaSsrXSkpO1xyXG5cclxuICAgICAgICAgIC8vIEFkZCBsZWFkaW5nIHplcm9zLCBkZWNpbWFsIHBvaW50IGFuZCB0cmFpbGluZyB6ZXJvcyBhcyByZXF1aXJlZC5cclxuICAgICAgICAgIHN0ciA9IHRvRml4ZWRQb2ludChzdHIsIGUsIGFscGhhYmV0LmNoYXJBdCgwKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUaGUgY2FsbGVyIHdpbGwgYWRkIHRoZSBzaWduLlxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAvLyBQZXJmb3JtIGRpdmlzaW9uIGluIHRoZSBzcGVjaWZpZWQgYmFzZS4gQ2FsbGVkIGJ5IGRpdiBhbmQgY29udmVydEJhc2UuXHJcbiAgICBkaXYgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gQXNzdW1lIG5vbi16ZXJvIHggYW5kIGsuXHJcbiAgICAgIGZ1bmN0aW9uIG11bHRpcGx5KHgsIGssIGJhc2UpIHtcclxuICAgICAgICB2YXIgbSwgdGVtcCwgeGxvLCB4aGksXHJcbiAgICAgICAgICBjYXJyeSA9IDAsXHJcbiAgICAgICAgICBpID0geC5sZW5ndGgsXHJcbiAgICAgICAgICBrbG8gPSBrICUgU1FSVF9CQVNFLFxyXG4gICAgICAgICAga2hpID0gayAvIFNRUlRfQkFTRSB8IDA7XHJcblxyXG4gICAgICAgIGZvciAoeCA9IHguc2xpY2UoKTsgaS0tOykge1xyXG4gICAgICAgICAgeGxvID0geFtpXSAlIFNRUlRfQkFTRTtcclxuICAgICAgICAgIHhoaSA9IHhbaV0gLyBTUVJUX0JBU0UgfCAwO1xyXG4gICAgICAgICAgbSA9IGtoaSAqIHhsbyArIHhoaSAqIGtsbztcclxuICAgICAgICAgIHRlbXAgPSBrbG8gKiB4bG8gKyAoKG0gJSBTUVJUX0JBU0UpICogU1FSVF9CQVNFKSArIGNhcnJ5O1xyXG4gICAgICAgICAgY2FycnkgPSAodGVtcCAvIGJhc2UgfCAwKSArIChtIC8gU1FSVF9CQVNFIHwgMCkgKyBraGkgKiB4aGk7XHJcbiAgICAgICAgICB4W2ldID0gdGVtcCAlIGJhc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2FycnkpIHggPSBbY2FycnldLmNvbmNhdCh4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGNvbXBhcmUoYSwgYiwgYUwsIGJMKSB7XHJcbiAgICAgICAgdmFyIGksIGNtcDtcclxuXHJcbiAgICAgICAgaWYgKGFMICE9IGJMKSB7XHJcbiAgICAgICAgICBjbXAgPSBhTCA+IGJMID8gMSA6IC0xO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgZm9yIChpID0gY21wID0gMDsgaSA8IGFMOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhW2ldICE9IGJbaV0pIHtcclxuICAgICAgICAgICAgICBjbXAgPSBhW2ldID4gYltpXSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNtcDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gc3VidHJhY3QoYSwgYiwgYUwsIGJhc2UpIHtcclxuICAgICAgICB2YXIgaSA9IDA7XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IGIgZnJvbSBhLlxyXG4gICAgICAgIGZvciAoOyBhTC0tOykge1xyXG4gICAgICAgICAgYVthTF0gLT0gaTtcclxuICAgICAgICAgIGkgPSBhW2FMXSA8IGJbYUxdID8gMSA6IDA7XHJcbiAgICAgICAgICBhW2FMXSA9IGkgKiBiYXNlICsgYVthTF0gLSBiW2FMXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoOyAhYVswXSAmJiBhLmxlbmd0aCA+IDE7IGEuc3BsaWNlKDAsIDEpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8geDogZGl2aWRlbmQsIHk6IGRpdmlzb3IuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoeCwgeSwgZHAsIHJtLCBiYXNlKSB7XHJcbiAgICAgICAgdmFyIGNtcCwgZSwgaSwgbW9yZSwgbiwgcHJvZCwgcHJvZEwsIHEsIHFjLCByZW0sIHJlbUwsIHJlbTAsIHhpLCB4TCwgeWMwLFxyXG4gICAgICAgICAgeUwsIHl6LFxyXG4gICAgICAgICAgcyA9IHgucyA9PSB5LnMgPyAxIDogLTEsXHJcbiAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgIHljID0geS5jO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgTmFOLCBJbmZpbml0eSBvciAwP1xyXG4gICAgICAgIGlmICgheGMgfHwgIXhjWzBdIHx8ICF5YyB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihcclxuXHJcbiAgICAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiBlaXRoZXIgTmFOLCBvciBib3RoIEluZmluaXR5IG9yIDAuXHJcbiAgICAgICAgICAgIXgucyB8fCAheS5zIHx8ICh4YyA/IHljICYmIHhjWzBdID09IHljWzBdIDogIXljKSA/IE5hTiA6XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gwrEwIGlmIHggaXMgwrEwIG9yIHkgaXMgwrFJbmZpbml0eSwgb3IgcmV0dXJuIMKxSW5maW5pdHkgYXMgeSBpcyDCsTAuXHJcbiAgICAgICAgICAgIHhjICYmIHhjWzBdID09IDAgfHwgIXljID8gcyAqIDAgOiBzIC8gMFxyXG4gICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcSA9IG5ldyBCaWdOdW1iZXIocyk7XHJcbiAgICAgICAgcWMgPSBxLmMgPSBbXTtcclxuICAgICAgICBlID0geC5lIC0geS5lO1xyXG4gICAgICAgIHMgPSBkcCArIGUgKyAxO1xyXG5cclxuICAgICAgICBpZiAoIWJhc2UpIHtcclxuICAgICAgICAgIGJhc2UgPSBCQVNFO1xyXG4gICAgICAgICAgZSA9IGJpdEZsb29yKHguZSAvIExPR19CQVNFKSAtIGJpdEZsb29yKHkuZSAvIExPR19CQVNFKTtcclxuICAgICAgICAgIHMgPSBzIC8gTE9HX0JBU0UgfCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVzdWx0IGV4cG9uZW50IG1heSBiZSBvbmUgbGVzcyB0aGVuIHRoZSBjdXJyZW50IHZhbHVlIG9mIGUuXHJcbiAgICAgICAgLy8gVGhlIGNvZWZmaWNpZW50cyBvZiB0aGUgQmlnTnVtYmVycyBmcm9tIGNvbnZlcnRCYXNlIG1heSBoYXZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoaSA9IDA7IHljW2ldID09ICh4Y1tpXSB8fCAwKTsgaSsrKTtcclxuXHJcbiAgICAgICAgaWYgKHljW2ldID4gKHhjW2ldIHx8IDApKSBlLS07XHJcblxyXG4gICAgICAgIGlmIChzIDwgMCkge1xyXG4gICAgICAgICAgcWMucHVzaCgxKTtcclxuICAgICAgICAgIG1vcmUgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4TCA9IHhjLmxlbmd0aDtcclxuICAgICAgICAgIHlMID0geWMubGVuZ3RoO1xyXG4gICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgICBzICs9IDI7XHJcblxyXG4gICAgICAgICAgLy8gTm9ybWFsaXNlIHhjIGFuZCB5YyBzbyBoaWdoZXN0IG9yZGVyIGRpZ2l0IG9mIHljIGlzID49IGJhc2UgLyAyLlxyXG5cclxuICAgICAgICAgIG4gPSBtYXRoZmxvb3IoYmFzZSAvICh5Y1swXSArIDEpKTtcclxuXHJcbiAgICAgICAgICAvLyBOb3QgbmVjZXNzYXJ5LCBidXQgdG8gaGFuZGxlIG9kZCBiYXNlcyB3aGVyZSB5Y1swXSA9PSAoYmFzZSAvIDIpIC0gMS5cclxuICAgICAgICAgIC8vIGlmIChuID4gMSB8fCBuKysgPT0gMSAmJiB5Y1swXSA8IGJhc2UgLyAyKSB7XHJcbiAgICAgICAgICBpZiAobiA+IDEpIHtcclxuICAgICAgICAgICAgeWMgPSBtdWx0aXBseSh5YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgIHhjID0gbXVsdGlwbHkoeGMsIG4sIGJhc2UpO1xyXG4gICAgICAgICAgICB5TCA9IHljLmxlbmd0aDtcclxuICAgICAgICAgICAgeEwgPSB4Yy5sZW5ndGg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgeGkgPSB5TDtcclxuICAgICAgICAgIHJlbSA9IHhjLnNsaWNlKDAsIHlMKTtcclxuICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoO1xyXG5cclxuICAgICAgICAgIC8vIEFkZCB6ZXJvcyB0byBtYWtlIHJlbWFpbmRlciBhcyBsb25nIGFzIGRpdmlzb3IuXHJcbiAgICAgICAgICBmb3IgKDsgcmVtTCA8IHlMOyByZW1bcmVtTCsrXSA9IDApO1xyXG4gICAgICAgICAgeXogPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgeXogPSBbMF0uY29uY2F0KHl6KTtcclxuICAgICAgICAgIHljMCA9IHljWzBdO1xyXG4gICAgICAgICAgaWYgKHljWzFdID49IGJhc2UgLyAyKSB5YzArKztcclxuICAgICAgICAgIC8vIE5vdCBuZWNlc3NhcnksIGJ1dCB0byBwcmV2ZW50IHRyaWFsIGRpZ2l0IG4gPiBiYXNlLCB3aGVuIHVzaW5nIGJhc2UgMy5cclxuICAgICAgICAgIC8vIGVsc2UgaWYgKGJhc2UgPT0gMyAmJiB5YzAgPT0gMSkgeWMwID0gMSArIDFlLTE1O1xyXG5cclxuICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgbiA9IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgY21wID0gY29tcGFyZSh5YywgcmVtLCB5TCwgcmVtTCk7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBpZiAoY21wIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdHJpYWwgZGlnaXQsIG4uXHJcblxyXG4gICAgICAgICAgICAgIHJlbTAgPSByZW1bMF07XHJcbiAgICAgICAgICAgICAgaWYgKHlMICE9IHJlbUwpIHJlbTAgPSByZW0wICogYmFzZSArIChyZW1bMV0gfHwgMCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIG4gaXMgaG93IG1hbnkgdGltZXMgdGhlIGRpdmlzb3IgZ29lcyBpbnRvIHRoZSBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICBuID0gbWF0aGZsb29yKHJlbTAgLyB5YzApO1xyXG5cclxuICAgICAgICAgICAgICAvLyAgQWxnb3JpdGhtOlxyXG4gICAgICAgICAgICAgIC8vICBwcm9kdWN0ID0gZGl2aXNvciBtdWx0aXBsaWVkIGJ5IHRyaWFsIGRpZ2l0IChuKS5cclxuICAgICAgICAgICAgICAvLyAgQ29tcGFyZSBwcm9kdWN0IGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgLy8gIElmIHByb2R1Y3QgaXMgZ3JlYXRlciB0aGFuIHJlbWFpbmRlcjpcclxuICAgICAgICAgICAgICAvLyAgICBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcHJvZHVjdCwgZGVjcmVtZW50IHRyaWFsIGRpZ2l0LlxyXG4gICAgICAgICAgICAgIC8vICBTdWJ0cmFjdCBwcm9kdWN0IGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIC8vICBJZiBwcm9kdWN0IHdhcyBsZXNzIHRoYW4gcmVtYWluZGVyIGF0IHRoZSBsYXN0IGNvbXBhcmU6XHJcbiAgICAgICAgICAgICAgLy8gICAgQ29tcGFyZSBuZXcgcmVtYWluZGVyIGFuZCBkaXZpc29yLlxyXG4gICAgICAgICAgICAgIC8vICAgIElmIHJlbWFpbmRlciBpcyBncmVhdGVyIHRoYW4gZGl2aXNvcjpcclxuICAgICAgICAgICAgICAvLyAgICAgIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIsIGluY3JlbWVudCB0cmlhbCBkaWdpdC5cclxuXHJcbiAgICAgICAgICAgICAgaWYgKG4gPiAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbiBtYXkgYmUgPiBiYXNlIG9ubHkgd2hlbiBiYXNlIGlzIDMuXHJcbiAgICAgICAgICAgICAgICBpZiAobiA+PSBiYXNlKSBuID0gYmFzZSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3IgKiB0cmlhbCBkaWdpdC5cclxuICAgICAgICAgICAgICAgIHByb2QgPSBtdWx0aXBseSh5YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBwcm9kdWN0IGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBwcm9kdWN0ID4gcmVtYWluZGVyIHRoZW4gdHJpYWwgZGlnaXQgbiB0b28gaGlnaC5cclxuICAgICAgICAgICAgICAgIC8vIG4gaXMgMSB0b28gaGlnaCBhYm91dCA1JSBvZiB0aGUgdGltZSwgYW5kIGlzIG5vdCBrbm93biB0byBoYXZlXHJcbiAgICAgICAgICAgICAgICAvLyBldmVyIGJlZW4gbW9yZSB0aGFuIDEgdG9vIGhpZ2guXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoY29tcGFyZShwcm9kLCByZW0sIHByb2RMLCByZW1MKSA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIG4tLTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSBwcm9kdWN0LlxyXG4gICAgICAgICAgICAgICAgICBzdWJ0cmFjdChwcm9kLCB5TCA8IHByb2RMID8geXogOiB5YywgcHJvZEwsIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICBjbXAgPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbiBpcyAwIG9yIDEsIGNtcCBpcyAtMS5cclxuICAgICAgICAgICAgICAgIC8vIElmIG4gaXMgMCwgdGhlcmUgaXMgbm8gbmVlZCB0byBjb21wYXJlIHljIGFuZCByZW0gYWdhaW4gYmVsb3csXHJcbiAgICAgICAgICAgICAgICAvLyBzbyBjaGFuZ2UgY21wIHRvIDEgdG8gYXZvaWQgaXQuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBuIGlzIDEsIGxlYXZlIGNtcCBhcyAtMSwgc28geWMgYW5kIHJlbSBhcmUgY29tcGFyZWQgYWdhaW4uXHJcbiAgICAgICAgICAgICAgICBpZiAobiA9PSAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBkaXZpc29yIDwgcmVtYWluZGVyLCBzbyBuIG11c3QgYmUgYXQgbGVhc3QgMS5cclxuICAgICAgICAgICAgICAgICAgY21wID0gbiA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3JcclxuICAgICAgICAgICAgICAgIHByb2QgPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgcHJvZEwgPSBwcm9kLmxlbmd0aDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChwcm9kTCA8IHJlbUwpIHByb2QgPSBbMF0uY29uY2F0KHByb2QpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBwcm9kdWN0IGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIHN1YnRyYWN0KHJlbSwgcHJvZCwgcmVtTCwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAvLyBJZiBwcm9kdWN0IHdhcyA8IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICBpZiAoY21wID09IC0xKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCBuZXcgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgLy8gSWYgZGl2aXNvciA8IG5ldyByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBUcmlhbCBkaWdpdCBuIHRvbyBsb3cuXHJcbiAgICAgICAgICAgICAgICAvLyBuIGlzIDEgdG9vIGxvdyBhYm91dCA1JSBvZiB0aGUgdGltZSwgYW5kIHZlcnkgcmFyZWx5IDIgdG9vIGxvdy5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKHljLCByZW0sIHlMLCByZW1MKSA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgbisrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgc3VidHJhY3QocmVtLCB5TCA8IHJlbUwgPyB5eiA6IHljLCByZW1MLCBiYXNlKTtcclxuICAgICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNtcCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIG4rKztcclxuICAgICAgICAgICAgICByZW0gPSBbMF07XHJcbiAgICAgICAgICAgIH0gLy8gZWxzZSBjbXAgPT09IDEgYW5kIG4gd2lsbCBiZSAwXHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgdGhlIG5leHQgZGlnaXQsIG4sIHRvIHRoZSByZXN1bHQgYXJyYXkuXHJcbiAgICAgICAgICAgIHFjW2krK10gPSBuO1xyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgIGlmIChyZW1bMF0pIHtcclxuICAgICAgICAgICAgICByZW1bcmVtTCsrXSA9IHhjW3hpXSB8fCAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJlbSA9IFt4Y1t4aV1dO1xyXG4gICAgICAgICAgICAgIHJlbUwgPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IHdoaWxlICgoeGkrKyA8IHhMIHx8IHJlbVswXSAhPSBudWxsKSAmJiBzLS0pO1xyXG5cclxuICAgICAgICAgIG1vcmUgPSByZW1bMF0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgICAvLyBMZWFkaW5nIHplcm8/XHJcbiAgICAgICAgICBpZiAoIXFjWzBdKSBxYy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYmFzZSA9PSBCQVNFKSB7XHJcblxyXG4gICAgICAgICAgLy8gVG8gY2FsY3VsYXRlIHEuZSwgZmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHFjWzBdLlxyXG4gICAgICAgICAgZm9yIChpID0gMSwgcyA9IHFjWzBdOyBzID49IDEwOyBzIC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgICAgIHJvdW5kKHEsIGRwICsgKHEuZSA9IGkgKyBlICogTE9HX0JBU0UgLSAxKSArIDEsIHJtLCBtb3JlKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsbGVyIGlzIGNvbnZlcnRCYXNlLlxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBxLmUgPSBlO1xyXG4gICAgICAgICAgcS5yID0gK21vcmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcTtcclxuICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIgbiBpbiBmaXhlZC1wb2ludCBvciBleHBvbmVudGlhbFxyXG4gICAgICogbm90YXRpb24gcm91bmRlZCB0byB0aGUgc3BlY2lmaWVkIGRlY2ltYWwgcGxhY2VzIG9yIHNpZ25pZmljYW50IGRpZ2l0cy5cclxuICAgICAqXHJcbiAgICAgKiBuOiBhIEJpZ051bWJlci5cclxuICAgICAqIGk6IHRoZSBpbmRleCBvZiB0aGUgbGFzdCBkaWdpdCByZXF1aXJlZCAoaS5lLiB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cCkuXHJcbiAgICAgKiBybTogdGhlIHJvdW5kaW5nIG1vZGUuXHJcbiAgICAgKiBpZDogMSAodG9FeHBvbmVudGlhbCkgb3IgMiAodG9QcmVjaXNpb24pLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBmb3JtYXQobiwgaSwgcm0sIGlkKSB7XHJcbiAgICAgIHZhciBjMCwgZSwgbmUsIGxlbiwgc3RyO1xyXG5cclxuICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICBpZiAoIW4uYykgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIGMwID0gbi5jWzBdO1xyXG4gICAgICBuZSA9IG4uZTtcclxuXHJcbiAgICAgIGlmIChpID09IG51bGwpIHtcclxuICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKG4uYyk7XHJcbiAgICAgICAgc3RyID0gaWQgPT0gMSB8fCBpZCA9PSAyICYmIG5lIDw9IFRPX0VYUF9ORUdcclxuICAgICAgICAgPyB0b0V4cG9uZW50aWFsKHN0ciwgbmUpXHJcbiAgICAgICAgIDogdG9GaXhlZFBvaW50KHN0ciwgbmUsICcwJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbiA9IHJvdW5kKG5ldyBCaWdOdW1iZXIobiksIGksIHJtKTtcclxuXHJcbiAgICAgICAgLy8gbi5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdGhlIHZhbHVlIHdhcyByb3VuZGVkIHVwLlxyXG4gICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyB0b1ByZWNpc2lvbiByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uIGlmIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzXHJcbiAgICAgICAgLy8gc3BlY2lmaWVkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBpbnRlZ2VyXHJcbiAgICAgICAgLy8gcGFydCBvZiB0aGUgdmFsdWUgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24uXHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgIGlmIChpZCA9PSAxIHx8IGlkID09IDIgJiYgKGkgPD0gZSB8fCBlIDw9IFRPX0VYUF9ORUcpKSB7XHJcblxyXG4gICAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgICAgZm9yICg7IGxlbiA8IGk7IHN0ciArPSAnMCcsIGxlbisrKTtcclxuICAgICAgICAgIHN0ciA9IHRvRXhwb25lbnRpYWwoc3RyLCBlKTtcclxuXHJcbiAgICAgICAgLy8gRml4ZWQtcG9pbnQgbm90YXRpb24uXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGkgLT0gbmU7XHJcbiAgICAgICAgICBzdHIgPSB0b0ZpeGVkUG9pbnQoc3RyLCBlLCAnMCcpO1xyXG5cclxuICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgICAgIGlmIChlICsgMSA+IGxlbikge1xyXG4gICAgICAgICAgICBpZiAoLS1pID4gMCkgZm9yIChzdHIgKz0gJy4nOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaSArPSBlIC0gbGVuO1xyXG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZSArIDEgPT0gbGVuKSBzdHIgKz0gJy4nO1xyXG4gICAgICAgICAgICAgIGZvciAoOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbi5zIDwgMCAmJiBjMCA/ICctJyArIHN0ciA6IHN0cjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gSGFuZGxlIEJpZ051bWJlci5tYXggYW5kIEJpZ051bWJlci5taW4uXHJcbiAgICBmdW5jdGlvbiBtYXhPck1pbihhcmdzLCBtZXRob2QpIHtcclxuICAgICAgdmFyIG4sXHJcbiAgICAgICAgaSA9IDEsXHJcbiAgICAgICAgbSA9IG5ldyBCaWdOdW1iZXIoYXJnc1swXSk7XHJcblxyXG4gICAgICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBuID0gbmV3IEJpZ051bWJlcihhcmdzW2ldKTtcclxuXHJcbiAgICAgICAgLy8gSWYgYW55IG51bWJlciBpcyBOYU4sIHJldHVybiBOYU4uXHJcbiAgICAgICAgaWYgKCFuLnMpIHtcclxuICAgICAgICAgIG0gPSBuO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChtZXRob2QuY2FsbChtLCBuKSkge1xyXG4gICAgICAgICAgbSA9IG47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFN0cmlwIHRyYWlsaW5nIHplcm9zLCBjYWxjdWxhdGUgYmFzZSAxMCBleHBvbmVudCBhbmQgY2hlY2sgYWdhaW5zdCBNSU5fRVhQIGFuZCBNQVhfRVhQLlxyXG4gICAgICogQ2FsbGVkIGJ5IG1pbnVzLCBwbHVzIGFuZCB0aW1lcy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbm9ybWFsaXNlKG4sIGMsIGUpIHtcclxuICAgICAgdmFyIGkgPSAxLFxyXG4gICAgICAgIGogPSBjLmxlbmd0aDtcclxuXHJcbiAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgIGZvciAoOyAhY1stLWpdOyBjLnBvcCgpKTtcclxuXHJcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgYmFzZSAxMCBleHBvbmVudC4gRmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIGNbMF0uXHJcbiAgICAgIGZvciAoaiA9IGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyk7XHJcblxyXG4gICAgICAvLyBPdmVyZmxvdz9cclxuICAgICAgaWYgKChlID0gaSArIGUgKiBMT0dfQkFTRSAtIDEpID4gTUFYX0VYUCkge1xyXG5cclxuICAgICAgICAvLyBJbmZpbml0eS5cclxuICAgICAgICBuLmMgPSBuLmUgPSBudWxsO1xyXG5cclxuICAgICAgLy8gVW5kZXJmbG93P1xyXG4gICAgICB9IGVsc2UgaWYgKGUgPCBNSU5fRVhQKSB7XHJcblxyXG4gICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgbi5jID0gW24uZSA9IDBdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG4uZSA9IGU7XHJcbiAgICAgICAgbi5jID0gYztcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIEhhbmRsZSB2YWx1ZXMgdGhhdCBmYWlsIHRoZSB2YWxpZGl0eSB0ZXN0IGluIEJpZ051bWJlci5cclxuICAgIHBhcnNlTnVtZXJpYyA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaSxcclxuICAgICAgICBkb3RBZnRlciA9IC9eKFteLl0rKVxcLiQvLFxyXG4gICAgICAgIGRvdEJlZm9yZSA9IC9eXFwuKFteLl0rKSQvLFxyXG4gICAgICAgIGlzSW5maW5pdHlPck5hTiA9IC9eLT8oSW5maW5pdHl8TmFOKSQvLFxyXG4gICAgICAgIHdoaXRlc3BhY2VPclBsdXMgPSAvXlxccypcXCsoPz1bXFx3Ll0pfF5cXHMrfFxccyskL2c7XHJcblxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHgsIHN0ciwgaXNOdW0sIGIpIHtcclxuICAgICAgICB2YXIgYmFzZSxcclxuICAgICAgICAgIHMgPSBpc051bSA/IHN0ciA6IHN0ci5yZXBsYWNlKHdoaXRlc3BhY2VPclBsdXMsICcnKTtcclxuXHJcbiAgICAgICAgLy8gTm8gZXhjZXB0aW9uIG9uIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICAgIGlmIChpc0luZmluaXR5T3JOYU4udGVzdChzKSkge1xyXG4gICAgICAgICAgeC5zID0gaXNOYU4ocykgPyBudWxsIDogcyA8IDAgPyAtMSA6IDE7XHJcbiAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIWlzTnVtKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaVxyXG4gICAgICAgICAgICBzID0gcy5yZXBsYWNlKGJhc2VQcmVmaXgsIGZ1bmN0aW9uIChtLCBwMSwgcDIpIHtcclxuICAgICAgICAgICAgICBiYXNlID0gKHAyID0gcDIudG9Mb3dlckNhc2UoKSkgPT0gJ3gnID8gMTYgOiBwMiA9PSAnYicgPyAyIDogODtcclxuICAgICAgICAgICAgICByZXR1cm4gIWIgfHwgYiA9PSBiYXNlID8gcDEgOiBtO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICAgYmFzZSA9IGI7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEUuZy4gJzEuJyB0byAnMScsICcuMScgdG8gJzAuMSdcclxuICAgICAgICAgICAgICBzID0gcy5yZXBsYWNlKGRvdEFmdGVyLCAnJDEnKS5yZXBsYWNlKGRvdEJlZm9yZSwgJzAuJDEnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHN0ciAhPSBzKSByZXR1cm4gbmV3IEJpZ051bWJlcihzLCBiYXNlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTm90IGEgbnVtYmVyOiB7bn0nXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTm90IGEgYmFzZSB7Yn0gbnVtYmVyOiB7bn0nXHJcbiAgICAgICAgICBpZiAoQmlnTnVtYmVyLkRFQlVHKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ05vdCBhJyArIChiID8gJyBiYXNlICcgKyBiIDogJycpICsgJyBudW1iZXI6ICcgKyBzdHIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIE5hTlxyXG4gICAgICAgICAgeC5jID0geC5lID0geC5zID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSb3VuZCB4IHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLiBDaGVjayBmb3Igb3Zlci91bmRlci1mbG93LlxyXG4gICAgICogSWYgciBpcyB0cnV0aHksIGl0IGlzIGtub3duIHRoYXQgdGhlcmUgYXJlIG1vcmUgZGlnaXRzIGFmdGVyIHRoZSByb3VuZGluZyBkaWdpdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcm91bmQoeCwgc2QsIHJtLCByKSB7XHJcbiAgICAgIHZhciBkLCBpLCBqLCBrLCBuLCBuaSwgcmQsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgcG93czEwID0gUE9XU19URU47XHJcblxyXG4gICAgICAvLyBpZiB4IGlzIG5vdCBJbmZpbml0eSBvciBOYU4uLi5cclxuICAgICAgaWYgKHhjKSB7XHJcblxyXG4gICAgICAgIC8vIHJkIGlzIHRoZSByb3VuZGluZyBkaWdpdCwgaS5lLiB0aGUgZGlnaXQgYWZ0ZXIgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgLy8gbiBpcyBhIGJhc2UgMWUxNCBudW1iZXIsIHRoZSB2YWx1ZSBvZiB0aGUgZWxlbWVudCBvZiBhcnJheSB4LmMgY29udGFpbmluZyByZC5cclxuICAgICAgICAvLyBuaSBpcyB0aGUgaW5kZXggb2YgbiB3aXRoaW4geC5jLlxyXG4gICAgICAgIC8vIGQgaXMgdGhlIG51bWJlciBvZiBkaWdpdHMgb2Ygbi5cclxuICAgICAgICAvLyBpIGlzIHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiBpbmNsdWRpbmcgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgICAvLyBqIGlzIHRoZSBhY3R1YWwgaW5kZXggb2YgcmQgd2l0aGluIG4gKGlmIDwgMCwgcmQgaXMgYSBsZWFkaW5nIHplcm8pLlxyXG4gICAgICAgIG91dDoge1xyXG5cclxuICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy5cclxuICAgICAgICAgIGZvciAoZCA9IDEsIGsgPSB4Y1swXTsgayA+PSAxMDsgayAvPSAxMCwgZCsrKTtcclxuICAgICAgICAgIGkgPSBzZCAtIGQ7XHJcblxyXG4gICAgICAgICAgLy8gSWYgdGhlIHJvdW5kaW5nIGRpZ2l0IGlzIGluIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLi4uXHJcbiAgICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgICAgaSArPSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgaiA9IHNkO1xyXG4gICAgICAgICAgICBuID0geGNbbmkgPSAwXTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgcm91bmRpbmcgZGlnaXQgYXQgaW5kZXggaiBvZiBuLlxyXG4gICAgICAgICAgICByZCA9IG4gLyBwb3dzMTBbZCAtIGogLSAxXSAlIDEwIHwgMDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5pID0gbWF0aGNlaWwoKGkgKyAxKSAvIExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuaSA+PSB4Yy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBOZWVkZWQgYnkgc3FydC5cclxuICAgICAgICAgICAgICAgIGZvciAoOyB4Yy5sZW5ndGggPD0gbmk7IHhjLnB1c2goMCkpO1xyXG4gICAgICAgICAgICAgICAgbiA9IHJkID0gMDtcclxuICAgICAgICAgICAgICAgIGQgPSAxO1xyXG4gICAgICAgICAgICAgICAgaSAlPSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgICAgIGogPSBpIC0gTE9HX0JBU0UgKyAxO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBicmVhayBvdXQ7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIG4gPSBrID0geGNbbmldO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2Ygbi5cclxuICAgICAgICAgICAgICBmb3IgKGQgPSAxOyBrID49IDEwOyBrIC89IDEwLCBkKyspO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIGluZGV4IG9mIHJkIHdpdGhpbiBuLlxyXG4gICAgICAgICAgICAgIGkgJT0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4sIGFkanVzdGVkIGZvciBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgICAgICAgIC8vIFRoZSBudW1iZXIgb2YgbGVhZGluZyB6ZXJvcyBvZiBuIGlzIGdpdmVuIGJ5IExPR19CQVNFIC0gZC5cclxuICAgICAgICAgICAgICBqID0gaSAtIExPR19CQVNFICsgZDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gR2V0IHRoZSByb3VuZGluZyBkaWdpdCBhdCBpbmRleCBqIG9mIG4uXHJcbiAgICAgICAgICAgICAgcmQgPSBqIDwgMCA/IDAgOiBuIC8gcG93czEwW2QgLSBqIC0gMV0gJSAxMCB8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByID0gciB8fCBzZCA8IDAgfHxcclxuXHJcbiAgICAgICAgICAvLyBBcmUgdGhlcmUgYW55IG5vbi16ZXJvIGRpZ2l0cyBhZnRlciB0aGUgcm91bmRpbmcgZGlnaXQ/XHJcbiAgICAgICAgICAvLyBUaGUgZXhwcmVzc2lvbiAgbiAlIHBvd3MxMFtkIC0gaiAtIDFdICByZXR1cm5zIGFsbCBkaWdpdHMgb2YgbiB0byB0aGUgcmlnaHRcclxuICAgICAgICAgIC8vIG9mIHRoZSBkaWdpdCBhdCBqLCBlLmcuIGlmIG4gaXMgOTA4NzE0IGFuZCBqIGlzIDIsIHRoZSBleHByZXNzaW9uIGdpdmVzIDcxNC5cclxuICAgICAgICAgICB4Y1tuaSArIDFdICE9IG51bGwgfHwgKGogPCAwID8gbiA6IG4gJSBwb3dzMTBbZCAtIGogLSAxXSk7XHJcblxyXG4gICAgICAgICAgciA9IHJtIDwgNFxyXG4gICAgICAgICAgID8gKHJkIHx8IHIpICYmIChybSA9PSAwIHx8IHJtID09ICh4LnMgPCAwID8gMyA6IDIpKVxyXG4gICAgICAgICAgIDogcmQgPiA1IHx8IHJkID09IDUgJiYgKHJtID09IDQgfHwgciB8fCBybSA9PSA2ICYmXHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBkaWdpdCB0byB0aGUgbGVmdCBvZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgb2RkLlxyXG4gICAgICAgICAgICAoKGkgPiAwID8gaiA+IDAgPyBuIC8gcG93czEwW2QgLSBqXSA6IDAgOiB4Y1tuaSAtIDFdKSAlIDEwKSAmIDEgfHxcclxuICAgICAgICAgICAgIHJtID09ICh4LnMgPCAwID8gOCA6IDcpKTtcclxuXHJcbiAgICAgICAgICBpZiAoc2QgPCAxIHx8ICF4Y1swXSkge1xyXG4gICAgICAgICAgICB4Yy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQ29udmVydCBzZCB0byBkZWNpbWFsIHBsYWNlcy5cclxuICAgICAgICAgICAgICBzZCAtPSB4LmUgKyAxO1xyXG5cclxuICAgICAgICAgICAgICAvLyAxLCAwLjEsIDAuMDEsIDAuMDAxLCAwLjAwMDEgZXRjLlxyXG4gICAgICAgICAgICAgIHhjWzBdID0gcG93czEwWyhMT0dfQkFTRSAtIHNkICUgTE9HX0JBU0UpICUgTE9HX0JBU0VdO1xyXG4gICAgICAgICAgICAgIHguZSA9IC1zZCB8fCAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgICAgIHhjWzBdID0geC5lID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIGV4Y2VzcyBkaWdpdHMuXHJcbiAgICAgICAgICBpZiAoaSA9PSAwKSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IG5pO1xyXG4gICAgICAgICAgICBrID0gMTtcclxuICAgICAgICAgICAgbmktLTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IG5pICsgMTtcclxuICAgICAgICAgICAgayA9IHBvd3MxMFtMT0dfQkFTRSAtIGldO1xyXG5cclxuICAgICAgICAgICAgLy8gRS5nLiA1NjcwMCBiZWNvbWVzIDU2MDAwIGlmIDcgaXMgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICAgICAgICAvLyBqID4gMCBtZWFucyBpID4gbnVtYmVyIG9mIGxlYWRpbmcgemVyb3Mgb2Ygbi5cclxuICAgICAgICAgICAgeGNbbmldID0gaiA+IDAgPyBtYXRoZmxvb3IobiAvIHBvd3MxMFtkIC0gal0gJSBwb3dzMTBbal0pICogayA6IDA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUm91bmQgdXA/XHJcbiAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IDspIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIGRpZ2l0IHRvIGJlIHJvdW5kZWQgdXAgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgICAgICBpZiAobmkgPT0gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGkgd2lsbCBiZSB0aGUgbGVuZ3RoIG9mIHhjWzBdIGJlZm9yZSBrIGlzIGFkZGVkLlxyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMSwgaiA9IHhjWzBdOyBqID49IDEwOyBqIC89IDEwLCBpKyspO1xyXG4gICAgICAgICAgICAgICAgaiA9IHhjWzBdICs9IGs7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAxOyBqID49IDEwOyBqIC89IDEwLCBrKyspO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmIGkgIT0gayB0aGUgbGVuZ3RoIGhhcyBpbmNyZWFzZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAoaSAhPSBrKSB7XHJcbiAgICAgICAgICAgICAgICAgIHguZSsrO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoeGNbMF0gPT0gQkFTRSkgeGNbMF0gPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB4Y1tuaV0gKz0gaztcclxuICAgICAgICAgICAgICAgIGlmICh4Y1tuaV0gIT0gQkFTRSkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB4Y1tuaS0tXSA9IDA7XHJcbiAgICAgICAgICAgICAgICBrID0gMTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICBmb3IgKGkgPSB4Yy5sZW5ndGg7IHhjWy0taV0gPT09IDA7IHhjLnBvcCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE92ZXJmbG93PyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoeC5lID4gTUFYX0VYUCkge1xyXG4gICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVW5kZXJmbG93PyBaZXJvLlxyXG4gICAgICAgIH0gZWxzZSBpZiAoeC5lIDwgTUlOX0VYUCkge1xyXG4gICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHZhbHVlT2Yobikge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICBpZiAoZSA9PT0gbnVsbCkgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuXHJcbiAgICAgIHN0ciA9IGUgPD0gVE9fRVhQX05FRyB8fCBlID49IFRPX0VYUF9QT1NcclxuICAgICAgICA/IHRvRXhwb25lbnRpYWwoc3RyLCBlKVxyXG4gICAgICAgIDogdG9GaXhlZFBvaW50KHN0ciwgZSwgJzAnKTtcclxuXHJcbiAgICAgIHJldHVybiBuLnMgPCAwID8gJy0nICsgc3RyIDogc3RyO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBQUk9UT1RZUEUvSU5TVEFOQ0UgTUVUSE9EU1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgYWJzb2x1dGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIuXHJcbiAgICAgKi9cclxuICAgIFAuYWJzb2x1dGVWYWx1ZSA9IFAuYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgIGlmICh4LnMgPCAwKSB4LnMgPSAxO1xyXG4gICAgICByZXR1cm4geDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm5cclxuICAgICAqICAgMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiAgIC0xIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqICAgMCBpZiB0aGV5IGhhdmUgdGhlIHNhbWUgdmFsdWUsXHJcbiAgICAgKiAgIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIGVpdGhlciBpcyBOYU4uXHJcbiAgICAgKi9cclxuICAgIFAuY29tcGFyZWRUbyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIElmIGRwIGlzIHVuZGVmaW5lZCBvciBudWxsIG9yIHRydWUgb3IgZmFsc2UsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIG9mIHRoZVxyXG4gICAgICogdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICpcclxuICAgICAqIE90aGVyd2lzZSwgaWYgZHAgaXMgYSBudW1iZXIsIHJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXNcclxuICAgICAqIEJpZ051bWJlciByb3VuZGVkIHRvIGEgbWF4aW11bSBvZiBkcCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvclxyXG4gICAgICogUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXM6IGludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC5kZWNpbWFsUGxhY2VzID0gUC5kcCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgdmFyIGMsIG4sIHYsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGlmIChybSA9PSBudWxsKSBybSA9IFJPVU5ESU5HX01PREU7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICAgIHJldHVybiByb3VuZChuZXcgQmlnTnVtYmVyKHgpLCBkcCArIHguZSArIDEsIHJtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCEoYyA9IHguYykpIHJldHVybiBudWxsO1xyXG4gICAgICBuID0gKCh2ID0gYy5sZW5ndGggLSAxKSAtIGJpdEZsb29yKHRoaXMuZSAvIExPR19CQVNFKSkgKiBMT0dfQkFTRTtcclxuXHJcbiAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgbnVtYmVyLlxyXG4gICAgICBpZiAodiA9IGNbdl0pIGZvciAoOyB2ICUgMTAgPT0gMDsgdiAvPSAxMCwgbi0tKTtcclxuICAgICAgaWYgKG4gPCAwKSBuID0gMDtcclxuXHJcbiAgICAgIHJldHVybiBuO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuIC8gMCA9IElcclxuICAgICAqICBuIC8gTiA9IE5cclxuICAgICAqICBuIC8gSSA9IDBcclxuICAgICAqICAwIC8gbiA9IDBcclxuICAgICAqICAwIC8gMCA9IE5cclxuICAgICAqICAwIC8gTiA9IE5cclxuICAgICAqICAwIC8gSSA9IDBcclxuICAgICAqICBOIC8gbiA9IE5cclxuICAgICAqICBOIC8gMCA9IE5cclxuICAgICAqICBOIC8gTiA9IE5cclxuICAgICAqICBOIC8gSSA9IE5cclxuICAgICAqICBJIC8gbiA9IElcclxuICAgICAqICBJIC8gMCA9IElcclxuICAgICAqICBJIC8gTiA9IE5cclxuICAgICAqICBJIC8gSSA9IE5cclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBkaXZpZGVkIGJ5IHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCByb3VuZGVkIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5kaXZpZGVkQnkgPSBQLmRpdiA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBkaXYodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSwgREVDSU1BTF9QTEFDRVMsIFJPVU5ESU5HX01PREUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIGludGVnZXIgcGFydCBvZiBkaXZpZGluZyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIGJ5IHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAuZGl2aWRlZFRvSW50ZWdlckJ5ID0gUC5pZGl2ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGRpdih0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpLCAwLCAxKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGV4cG9uZW50aWF0ZWQgYnkgbi5cclxuICAgICAqXHJcbiAgICAgKiBJZiBtIGlzIHByZXNlbnQsIHJldHVybiB0aGUgcmVzdWx0IG1vZHVsbyBtLlxyXG4gICAgICogSWYgbiBpcyBuZWdhdGl2ZSByb3VuZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKiBJZiBQT1dfUFJFQ0lTSU9OIGlzIG5vbi16ZXJvIGFuZCBtIGlzIG5vdCBwcmVzZW50LCByb3VuZCB0byBQT1dfUFJFQ0lTSU9OIHVzaW5nIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIG1vZHVsYXIgcG93ZXIgb3BlcmF0aW9uIHdvcmtzIGVmZmljaWVudGx5IHdoZW4geCwgbiwgYW5kIG0gYXJlIGludGVnZXJzLCBvdGhlcndpc2UgaXRcclxuICAgICAqIGlzIGVxdWl2YWxlbnQgdG8gY2FsY3VsYXRpbmcgeC5leHBvbmVudGlhdGVkQnkobikubW9kdWxvKG0pIHdpdGggYSBQT1dfUFJFQ0lTSU9OIG9mIDAuXHJcbiAgICAgKlxyXG4gICAgICogbiB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IFRoZSBleHBvbmVudC4gQW4gaW50ZWdlci5cclxuICAgICAqIFttXSB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IFRoZSBtb2R1bHVzLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBFeHBvbmVudCBub3QgYW4gaW50ZWdlcjoge259J1xyXG4gICAgICovXHJcbiAgICBQLmV4cG9uZW50aWF0ZWRCeSA9IFAucG93ID0gZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgdmFyIGhhbGYsIGlzTW9kRXhwLCBpLCBrLCBtb3JlLCBuSXNCaWcsIG5Jc05lZywgbklzT2RkLCB5LFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgbiA9IG5ldyBCaWdOdW1iZXIobik7XHJcblxyXG4gICAgICAvLyBBbGxvdyBOYU4gYW5kIMKxSW5maW5pdHksIGJ1dCBub3Qgb3RoZXIgbm9uLWludGVnZXJzLlxyXG4gICAgICBpZiAobi5jICYmICFuLmlzSW50ZWdlcigpKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdFeHBvbmVudCBub3QgYW4gaW50ZWdlcjogJyArIHZhbHVlT2YobikpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobSAhPSBudWxsKSBtID0gbmV3IEJpZ051bWJlcihtKTtcclxuXHJcbiAgICAgIC8vIEV4cG9uZW50IG9mIE1BWF9TQUZFX0lOVEVHRVIgaXMgMTUuXHJcbiAgICAgIG5Jc0JpZyA9IG4uZSA+IDE0O1xyXG5cclxuICAgICAgLy8gSWYgeCBpcyBOYU4sIMKxSW5maW5pdHksIMKxMCBvciDCsTEsIG9yIG4gaXMgwrFJbmZpbml0eSwgTmFOIG9yIMKxMC5cclxuICAgICAgaWYgKCF4LmMgfHwgIXguY1swXSB8fCB4LmNbMF0gPT0gMSAmJiAheC5lICYmIHguYy5sZW5ndGggPT0gMSB8fCAhbi5jIHx8ICFuLmNbMF0pIHtcclxuXHJcbiAgICAgICAgLy8gVGhlIHNpZ24gb2YgdGhlIHJlc3VsdCBvZiBwb3cgd2hlbiB4IGlzIG5lZ2F0aXZlIGRlcGVuZHMgb24gdGhlIGV2ZW5uZXNzIG9mIG4uXHJcbiAgICAgICAgLy8gSWYgK24gb3ZlcmZsb3dzIHRvIMKxSW5maW5pdHksIHRoZSBldmVubmVzcyBvZiBuIHdvdWxkIGJlIG5vdCBiZSBrbm93bi5cclxuICAgICAgICB5ID0gbmV3IEJpZ051bWJlcihNYXRoLnBvdygrdmFsdWVPZih4KSwgbklzQmlnID8gMiAtIGlzT2RkKG4pIDogK3ZhbHVlT2YobikpKTtcclxuICAgICAgICByZXR1cm4gbSA/IHkubW9kKG0pIDogeTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbklzTmVnID0gbi5zIDwgMDtcclxuXHJcbiAgICAgIGlmIChtKSB7XHJcblxyXG4gICAgICAgIC8vIHggJSBtIHJldHVybnMgTmFOIGlmIGFicyhtKSBpcyB6ZXJvLCBvciBtIGlzIE5hTi5cclxuICAgICAgICBpZiAobS5jID8gIW0uY1swXSA6ICFtLnMpIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAgIGlzTW9kRXhwID0gIW5Jc05lZyAmJiB4LmlzSW50ZWdlcigpICYmIG0uaXNJbnRlZ2VyKCk7XHJcblxyXG4gICAgICAgIGlmIChpc01vZEV4cCkgeCA9IHgubW9kKG0pO1xyXG5cclxuICAgICAgLy8gT3ZlcmZsb3cgdG8gwrFJbmZpbml0eTogPj0yKioxZTEwIG9yID49MS4wMDAwMDI0KioxZTE1LlxyXG4gICAgICAvLyBVbmRlcmZsb3cgdG8gwrEwOiA8PTAuNzkqKjFlMTAgb3IgPD0wLjk5OTk5NzUqKjFlMTUuXHJcbiAgICAgIH0gZWxzZSBpZiAobi5lID4gOSAmJiAoeC5lID4gMCB8fCB4LmUgPCAtMSB8fCAoeC5lID09IDBcclxuICAgICAgICAvLyBbMSwgMjQwMDAwMDAwXVxyXG4gICAgICAgID8geC5jWzBdID4gMSB8fCBuSXNCaWcgJiYgeC5jWzFdID49IDI0ZTdcclxuICAgICAgICAvLyBbODAwMDAwMDAwMDAwMDBdICBbOTk5OTk3NTAwMDAwMDBdXHJcbiAgICAgICAgOiB4LmNbMF0gPCA4ZTEzIHx8IG5Jc0JpZyAmJiB4LmNbMF0gPD0gOTk5OTk3NWU3KSkpIHtcclxuXHJcbiAgICAgICAgLy8gSWYgeCBpcyBuZWdhdGl2ZSBhbmQgbiBpcyBvZGQsIGsgPSAtMCwgZWxzZSBrID0gMC5cclxuICAgICAgICBrID0geC5zIDwgMCAmJiBpc09kZChuKSA/IC0wIDogMDtcclxuXHJcbiAgICAgICAgLy8gSWYgeCA+PSAxLCBrID0gwrFJbmZpbml0eS5cclxuICAgICAgICBpZiAoeC5lID4gLTEpIGsgPSAxIC8gaztcclxuXHJcbiAgICAgICAgLy8gSWYgbiBpcyBuZWdhdGl2ZSByZXR1cm4gwrEwLCBlbHNlIHJldHVybiDCsUluZmluaXR5LlxyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKG5Jc05lZyA/IDEgLyBrIDogayk7XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKFBPV19QUkVDSVNJT04pIHtcclxuXHJcbiAgICAgICAgLy8gVHJ1bmNhdGluZyBlYWNoIGNvZWZmaWNpZW50IGFycmF5IHRvIGEgbGVuZ3RoIG9mIGsgYWZ0ZXIgZWFjaCBtdWx0aXBsaWNhdGlvblxyXG4gICAgICAgIC8vIGVxdWF0ZXMgdG8gdHJ1bmNhdGluZyBzaWduaWZpY2FudCBkaWdpdHMgdG8gUE9XX1BSRUNJU0lPTiArIFsyOCwgNDFdLFxyXG4gICAgICAgIC8vIGkuZS4gdGhlcmUgd2lsbCBiZSBhIG1pbmltdW0gb2YgMjggZ3VhcmQgZGlnaXRzIHJldGFpbmVkLlxyXG4gICAgICAgIGsgPSBtYXRoY2VpbChQT1dfUFJFQ0lTSU9OIC8gTE9HX0JBU0UgKyAyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG5Jc0JpZykge1xyXG4gICAgICAgIGhhbGYgPSBuZXcgQmlnTnVtYmVyKDAuNSk7XHJcbiAgICAgICAgaWYgKG5Jc05lZykgbi5zID0gMTtcclxuICAgICAgICBuSXNPZGQgPSBpc09kZChuKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpID0gTWF0aC5hYnMoK3ZhbHVlT2YobikpO1xyXG4gICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcihPTkUpO1xyXG5cclxuICAgICAgLy8gUGVyZm9ybXMgNTQgbG9vcCBpdGVyYXRpb25zIGZvciBuIG9mIDkwMDcxOTkyNTQ3NDA5OTEuXHJcbiAgICAgIGZvciAoOyA7KSB7XHJcblxyXG4gICAgICAgIGlmIChuSXNPZGQpIHtcclxuICAgICAgICAgIHkgPSB5LnRpbWVzKHgpO1xyXG4gICAgICAgICAgaWYgKCF5LmMpIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICAgIGlmICh5LmMubGVuZ3RoID4gaykgeS5jLmxlbmd0aCA9IGs7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGlzTW9kRXhwKSB7XHJcbiAgICAgICAgICAgIHkgPSB5Lm1vZChtKTsgICAgLy95ID0geS5taW51cyhkaXYoeSwgbSwgMCwgTU9EVUxPX01PREUpLnRpbWVzKG0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpKSB7XHJcbiAgICAgICAgICBpID0gbWF0aGZsb29yKGkgLyAyKTtcclxuICAgICAgICAgIGlmIChpID09PSAwKSBicmVhaztcclxuICAgICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuID0gbi50aW1lcyhoYWxmKTtcclxuICAgICAgICAgIHJvdW5kKG4sIG4uZSArIDEsIDEpO1xyXG5cclxuICAgICAgICAgIGlmIChuLmUgPiAxNCkge1xyXG4gICAgICAgICAgICBuSXNPZGQgPSBpc09kZChuKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgPSArdmFsdWVPZihuKTtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDApIGJyZWFrO1xyXG4gICAgICAgICAgICBuSXNPZGQgPSBpICUgMjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHggPSB4LnRpbWVzKHgpO1xyXG5cclxuICAgICAgICBpZiAoaykge1xyXG4gICAgICAgICAgaWYgKHguYyAmJiB4LmMubGVuZ3RoID4gaykgeC5jLmxlbmd0aCA9IGs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc01vZEV4cCkge1xyXG4gICAgICAgICAgeCA9IHgubW9kKG0pOyAgICAvL3ggPSB4Lm1pbnVzKGRpdih4LCBtLCAwLCBNT0RVTE9fTU9ERSkudGltZXMobSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGlzTW9kRXhwKSByZXR1cm4geTtcclxuICAgICAgaWYgKG5Jc05lZykgeSA9IE9ORS5kaXYoeSk7XHJcblxyXG4gICAgICByZXR1cm4gbSA/IHkubW9kKG0pIDogayA/IHJvdW5kKHksIFBPV19QUkVDSVNJT04sIFJPVU5ESU5HX01PREUsIG1vcmUpIDogeTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIGFuIGludGVnZXJcclxuICAgICAqIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAqXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtybX0nXHJcbiAgICAgKi9cclxuICAgIFAuaW50ZWdlclZhbHVlID0gZnVuY3Rpb24gKHJtKSB7XHJcbiAgICAgIHZhciBuID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcbiAgICAgIHJldHVybiByb3VuZChuLCBuLmUgKyAxLCBybSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzRXF1YWxUbyA9IFAuZXEgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSA9PT0gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgYSBmaW5pdGUgbnVtYmVyLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzRmluaXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmM7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0dyZWF0ZXJUaGFuID0gUC5ndCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpID4gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzR3JlYXRlclRoYW5PckVxdWFsVG8gPSBQLmd0ZSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiAoYiA9IGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkpID09PSAxIHx8IGIgPT09IDA7XHJcblxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhbiBpbnRlZ2VyLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzSW50ZWdlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICEhdGhpcy5jICYmIGJpdEZsb29yKHRoaXMuZSAvIExPR19CQVNFKSA+IHRoaXMuYy5sZW5ndGggLSAyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNMZXNzVGhhbiA9IFAubHQgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0xlc3NUaGFuT3JFcXVhbFRvID0gUC5sdGUgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gKGIgPSBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpKSA9PT0gLTEgfHwgYiA9PT0gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgTmFOLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzTmFOID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gIXRoaXMucztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbmVnYXRpdmUsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNOZWdhdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucyA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIHBvc2l0aXZlLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzUG9zaXRpdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnMgPiAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyAwIG9yIC0wLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzWmVybyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICEhdGhpcy5jICYmIHRoaXMuY1swXSA9PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuIC0gMCA9IG5cclxuICAgICAqICBuIC0gTiA9IE5cclxuICAgICAqICBuIC0gSSA9IC1JXHJcbiAgICAgKiAgMCAtIG4gPSAtblxyXG4gICAgICogIDAgLSAwID0gMFxyXG4gICAgICogIDAgLSBOID0gTlxyXG4gICAgICogIDAgLSBJID0gLUlcclxuICAgICAqICBOIC0gbiA9IE5cclxuICAgICAqICBOIC0gMCA9IE5cclxuICAgICAqICBOIC0gTiA9IE5cclxuICAgICAqICBOIC0gSSA9IE5cclxuICAgICAqICBJIC0gbiA9IElcclxuICAgICAqICBJIC0gMCA9IElcclxuICAgICAqICBJIC0gTiA9IE5cclxuICAgICAqICBJIC0gSSA9IE5cclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBtaW51cyB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5taW51cyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBpLCBqLCB0LCB4TFR5LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuICAgICAgYiA9IHkucztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICAgIGlmICghYSB8fCAhYikgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgaWYgKGEgIT0gYikge1xyXG4gICAgICAgIHkucyA9IC1iO1xyXG4gICAgICAgIHJldHVybiB4LnBsdXMoeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciB4ZSA9IHguZSAvIExPR19CQVNFLFxyXG4gICAgICAgIHllID0geS5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICBpZiAoIXhlIHx8ICF5ZSkge1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgSW5maW5pdHk/XHJcbiAgICAgICAgaWYgKCF4YyB8fCAheWMpIHJldHVybiB4YyA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnTnVtYmVyKHljID8geCA6IE5hTik7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgICAgLy8gUmV0dXJuIHkgaWYgeSBpcyBub24temVybywgeCBpZiB4IGlzIG5vbi16ZXJvLCBvciB6ZXJvIGlmIGJvdGggYXJlIHplcm8uXHJcbiAgICAgICAgICByZXR1cm4geWNbMF0gPyAoeS5zID0gLWIsIHkpIDogbmV3IEJpZ051bWJlcih4Y1swXSA/IHggOlxyXG5cclxuICAgICAgICAgICAvLyBJRUVFIDc1NCAoMjAwOCkgNi4zOiBuIC0gbiA9IC0wIHdoZW4gcm91bmRpbmcgdG8gLUluZmluaXR5XHJcbiAgICAgICAgICAgUk9VTkRJTkdfTU9ERSA9PSAzID8gLTAgOiAwKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHhlID0gYml0Rmxvb3IoeGUpO1xyXG4gICAgICB5ZSA9IGJpdEZsb29yKHllKTtcclxuICAgICAgeGMgPSB4Yy5zbGljZSgpO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGlzIHRoZSBiaWdnZXIgbnVtYmVyLlxyXG4gICAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuXHJcbiAgICAgICAgaWYgKHhMVHkgPSBhIDwgMCkge1xyXG4gICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgdCA9IHhjO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdC5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLlxyXG4gICAgICAgIGZvciAoYiA9IGE7IGItLTsgdC5wdXNoKDApKTtcclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRzIGVxdWFsLiBDaGVjayBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICBqID0gKHhMVHkgPSAoYSA9IHhjLmxlbmd0aCkgPCAoYiA9IHljLmxlbmd0aCkpID8gYSA6IGI7XHJcblxyXG4gICAgICAgIGZvciAoYSA9IGIgPSAwOyBiIDwgajsgYisrKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHhjW2JdICE9IHljW2JdKSB7XHJcbiAgICAgICAgICAgIHhMVHkgPSB4Y1tiXSA8IHljW2JdO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHggPCB5PyBQb2ludCB4YyB0byB0aGUgYXJyYXkgb2YgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgIGlmICh4TFR5KSB0ID0geGMsIHhjID0geWMsIHljID0gdCwgeS5zID0gLXkucztcclxuXHJcbiAgICAgIGIgPSAoaiA9IHljLmxlbmd0aCkgLSAoaSA9IHhjLmxlbmd0aCk7XHJcblxyXG4gICAgICAvLyBBcHBlbmQgemVyb3MgdG8geGMgaWYgc2hvcnRlci5cclxuICAgICAgLy8gTm8gbmVlZCB0byBhZGQgemVyb3MgdG8geWMgaWYgc2hvcnRlciBhcyBzdWJ0cmFjdCBvbmx5IG5lZWRzIHRvIHN0YXJ0IGF0IHljLmxlbmd0aC5cclxuICAgICAgaWYgKGIgPiAwKSBmb3IgKDsgYi0tOyB4Y1tpKytdID0gMCk7XHJcbiAgICAgIGIgPSBCQVNFIC0gMTtcclxuXHJcbiAgICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICAgIGZvciAoOyBqID4gYTspIHtcclxuXHJcbiAgICAgICAgaWYgKHhjWy0tal0gPCB5Y1tqXSkge1xyXG4gICAgICAgICAgZm9yIChpID0gajsgaSAmJiAheGNbLS1pXTsgeGNbaV0gPSBiKTtcclxuICAgICAgICAgIC0teGNbaV07XHJcbiAgICAgICAgICB4Y1tqXSArPSBCQVNFO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeGNbal0gLT0geWNbal07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgIGZvciAoOyB4Y1swXSA9PSAwOyB4Yy5zcGxpY2UoMCwgMSksIC0teWUpO1xyXG5cclxuICAgICAgLy8gWmVybz9cclxuICAgICAgaWYgKCF4Y1swXSkge1xyXG5cclxuICAgICAgICAvLyBGb2xsb3dpbmcgSUVFRSA3NTQgKDIwMDgpIDYuMyxcclxuICAgICAgICAvLyBuIC0gbiA9ICswICBidXQgIG4gLSBuID0gLTAgIHdoZW4gcm91bmRpbmcgdG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgICAgeS5zID0gUk9VTkRJTkdfTU9ERSA9PSAzID8gLTEgOiAxO1xyXG4gICAgICAgIHkuYyA9IFt5LmUgPSAwXTtcclxuICAgICAgICByZXR1cm4geTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgSW5maW5pdHkgYXMgK3ggLSAreSAhPSBJbmZpbml0eSAmJiAteCAtIC15ICE9IEluZmluaXR5XHJcbiAgICAgIC8vIGZvciBmaW5pdGUgeCBhbmQgeS5cclxuICAgICAgcmV0dXJuIG5vcm1hbGlzZSh5LCB4YywgeWUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICAgbiAlIDAgPSAgTlxyXG4gICAgICogICBuICUgTiA9ICBOXHJcbiAgICAgKiAgIG4gJSBJID0gIG5cclxuICAgICAqICAgMCAlIG4gPSAgMFxyXG4gICAgICogIC0wICUgbiA9IC0wXHJcbiAgICAgKiAgIDAgJSAwID0gIE5cclxuICAgICAqICAgMCAlIE4gPSAgTlxyXG4gICAgICogICAwICUgSSA9ICAwXHJcbiAgICAgKiAgIE4gJSBuID0gIE5cclxuICAgICAqICAgTiAlIDAgPSAgTlxyXG4gICAgICogICBOICUgTiA9ICBOXHJcbiAgICAgKiAgIE4gJSBJID0gIE5cclxuICAgICAqICAgSSAlIG4gPSAgTlxyXG4gICAgICogICBJICUgMCA9ICBOXHJcbiAgICAgKiAgIEkgJSBOID0gIE5cclxuICAgICAqICAgSSAlIEkgPSAgTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG1vZHVsbyB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKS4gVGhlIHJlc3VsdCBkZXBlbmRzIG9uIHRoZSB2YWx1ZSBvZiBNT0RVTE9fTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5tb2R1bG8gPSBQLm1vZCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBxLCBzLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoeSwgYik7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gTmFOIGlmIHggaXMgSW5maW5pdHkgb3IgTmFOLCBvciB5IGlzIE5hTiBvciB6ZXJvLlxyXG4gICAgICBpZiAoIXguYyB8fCAheS5zIHx8IHkuYyAmJiAheS5jWzBdKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFJldHVybiB4IGlmIHkgaXMgSW5maW5pdHkgb3IgeCBpcyB6ZXJvLlxyXG4gICAgICB9IGVsc2UgaWYgKCF5LmMgfHwgeC5jICYmICF4LmNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcih4KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKE1PRFVMT19NT0RFID09IDkpIHtcclxuXHJcbiAgICAgICAgLy8gRXVjbGlkaWFuIGRpdmlzaW9uOiBxID0gc2lnbih5KSAqIGZsb29yKHggLyBhYnMoeSkpXHJcbiAgICAgICAgLy8gciA9IHggLSBxeSAgICB3aGVyZSAgMCA8PSByIDwgYWJzKHkpXHJcbiAgICAgICAgcyA9IHkucztcclxuICAgICAgICB5LnMgPSAxO1xyXG4gICAgICAgIHEgPSBkaXYoeCwgeSwgMCwgMyk7XHJcbiAgICAgICAgeS5zID0gcztcclxuICAgICAgICBxLnMgKj0gcztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBxID0gZGl2KHgsIHksIDAsIE1PRFVMT19NT0RFKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgeSA9IHgubWludXMocS50aW1lcyh5KSk7XHJcblxyXG4gICAgICAvLyBUbyBtYXRjaCBKYXZhU2NyaXB0ICUsIGVuc3VyZSBzaWduIG9mIHplcm8gaXMgc2lnbiBvZiBkaXZpZGVuZC5cclxuICAgICAgaWYgKCF5LmNbMF0gJiYgTU9EVUxPX01PREUgPT0gMSkgeS5zID0geC5zO1xyXG5cclxuICAgICAgcmV0dXJuIHk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gKiAwID0gMFxyXG4gICAgICogIG4gKiBOID0gTlxyXG4gICAgICogIG4gKiBJID0gSVxyXG4gICAgICogIDAgKiBuID0gMFxyXG4gICAgICogIDAgKiAwID0gMFxyXG4gICAgICogIDAgKiBOID0gTlxyXG4gICAgICogIDAgKiBJID0gTlxyXG4gICAgICogIE4gKiBuID0gTlxyXG4gICAgICogIE4gKiAwID0gTlxyXG4gICAgICogIE4gKiBOID0gTlxyXG4gICAgICogIE4gKiBJID0gTlxyXG4gICAgICogIEkgKiBuID0gSVxyXG4gICAgICogIEkgKiAwID0gTlxyXG4gICAgICogIEkgKiBOID0gTlxyXG4gICAgICogIEkgKiBJID0gSVxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG11bHRpcGxpZWQgYnkgdGhlIHZhbHVlXHJcbiAgICAgKiBvZiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAubXVsdGlwbGllZEJ5ID0gUC50aW1lcyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBjLCBlLCBpLCBqLCBrLCBtLCB4Y0wsIHhsbywgeGhpLCB5Y0wsIHlsbywgeWhpLCB6YyxcclxuICAgICAgICBiYXNlLCBzcXJ0QmFzZSxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9ICh5ID0gbmV3IEJpZ051bWJlcih5LCBiKSkuYztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4sIMKxSW5maW5pdHkgb3IgwrEwP1xyXG4gICAgICBpZiAoIXhjIHx8ICF5YyB8fCAheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiBOYU4gaWYgZWl0aGVyIGlzIE5hTiwgb3Igb25lIGlzIDAgYW5kIHRoZSBvdGhlciBpcyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoIXgucyB8fCAheS5zIHx8IHhjICYmICF4Y1swXSAmJiAheWMgfHwgeWMgJiYgIXljWzBdICYmICF4Yykge1xyXG4gICAgICAgICAgeS5jID0geS5lID0geS5zID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeS5zICo9IHgucztcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgaXMgwrFJbmZpbml0eS5cclxuICAgICAgICAgIGlmICgheGMgfHwgIXljKSB7XHJcbiAgICAgICAgICAgIHkuYyA9IHkuZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgLy8gUmV0dXJuIMKxMCBpZiBlaXRoZXIgaXMgwrEwLlxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeS5jID0gWzBdO1xyXG4gICAgICAgICAgICB5LmUgPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGUgPSBiaXRGbG9vcih4LmUgLyBMT0dfQkFTRSkgKyBiaXRGbG9vcih5LmUgLyBMT0dfQkFTRSk7XHJcbiAgICAgIHkucyAqPSB4LnM7XHJcbiAgICAgIHhjTCA9IHhjLmxlbmd0aDtcclxuICAgICAgeWNMID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gRW5zdXJlIHhjIHBvaW50cyB0byBsb25nZXIgYXJyYXkgYW5kIHhjTCB0byBpdHMgbGVuZ3RoLlxyXG4gICAgICBpZiAoeGNMIDwgeWNMKSB6YyA9IHhjLCB4YyA9IHljLCB5YyA9IHpjLCBpID0geGNMLCB4Y0wgPSB5Y0wsIHljTCA9IGk7XHJcblxyXG4gICAgICAvLyBJbml0aWFsaXNlIHRoZSByZXN1bHQgYXJyYXkgd2l0aCB6ZXJvcy5cclxuICAgICAgZm9yIChpID0geGNMICsgeWNMLCB6YyA9IFtdOyBpLS07IHpjLnB1c2goMCkpO1xyXG5cclxuICAgICAgYmFzZSA9IEJBU0U7XHJcbiAgICAgIHNxcnRCYXNlID0gU1FSVF9CQVNFO1xyXG5cclxuICAgICAgZm9yIChpID0geWNMOyAtLWkgPj0gMDspIHtcclxuICAgICAgICBjID0gMDtcclxuICAgICAgICB5bG8gPSB5Y1tpXSAlIHNxcnRCYXNlO1xyXG4gICAgICAgIHloaSA9IHljW2ldIC8gc3FydEJhc2UgfCAwO1xyXG5cclxuICAgICAgICBmb3IgKGsgPSB4Y0wsIGogPSBpICsgazsgaiA+IGk7KSB7XHJcbiAgICAgICAgICB4bG8gPSB4Y1stLWtdICUgc3FydEJhc2U7XHJcbiAgICAgICAgICB4aGkgPSB4Y1trXSAvIHNxcnRCYXNlIHwgMDtcclxuICAgICAgICAgIG0gPSB5aGkgKiB4bG8gKyB4aGkgKiB5bG87XHJcbiAgICAgICAgICB4bG8gPSB5bG8gKiB4bG8gKyAoKG0gJSBzcXJ0QmFzZSkgKiBzcXJ0QmFzZSkgKyB6Y1tqXSArIGM7XHJcbiAgICAgICAgICBjID0gKHhsbyAvIGJhc2UgfCAwKSArIChtIC8gc3FydEJhc2UgfCAwKSArIHloaSAqIHhoaTtcclxuICAgICAgICAgIHpjW2otLV0gPSB4bG8gJSBiYXNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgemNbal0gPSBjO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYykge1xyXG4gICAgICAgICsrZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB6Yy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBub3JtYWxpc2UoeSwgemMsIGUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG5lZ2F0ZWQsXHJcbiAgICAgKiBpLmUuIG11bHRpcGxpZWQgYnkgLTEuXHJcbiAgICAgKi9cclxuICAgIFAubmVnYXRlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHggPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICB4LnMgPSAteC5zIHx8IG51bGw7XHJcbiAgICAgIHJldHVybiB4O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuICsgMCA9IG5cclxuICAgICAqICBuICsgTiA9IE5cclxuICAgICAqICBuICsgSSA9IElcclxuICAgICAqICAwICsgbiA9IG5cclxuICAgICAqICAwICsgMCA9IDBcclxuICAgICAqICAwICsgTiA9IE5cclxuICAgICAqICAwICsgSSA9IElcclxuICAgICAqICBOICsgbiA9IE5cclxuICAgICAqICBOICsgMCA9IE5cclxuICAgICAqICBOICsgTiA9IE5cclxuICAgICAqICBOICsgSSA9IE5cclxuICAgICAqICBJICsgbiA9IElcclxuICAgICAqICBJICsgMCA9IElcclxuICAgICAqICBJICsgTiA9IE5cclxuICAgICAqICBJICsgSSA9IElcclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBwbHVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICovXHJcbiAgICBQLnBsdXMgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICB2YXIgdCxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICBhID0geC5zO1xyXG5cclxuICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoeSwgYik7XHJcbiAgICAgIGIgPSB5LnM7XHJcblxyXG4gICAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgICBpZiAoIWEgfHwgIWIpIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciB4ZSA9IHguZSAvIExPR19CQVNFLFxyXG4gICAgICAgIHllID0geS5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICBpZiAoIXhlIHx8ICF5ZSkge1xyXG5cclxuICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgwrFJbmZpbml0eS5cclxuICAgICAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIG5ldyBCaWdOdW1iZXIoYSAvIDApO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICAvLyBSZXR1cm4geSBpZiB5IGlzIG5vbi16ZXJvLCB4IGlmIHggaXMgbm9uLXplcm8sIG9yIHplcm8gaWYgYm90aCBhcmUgemVyby5cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkgcmV0dXJuIHljWzBdID8geSA6IG5ldyBCaWdOdW1iZXIoeGNbMF0gPyB4IDogYSAqIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB4ZSA9IGJpdEZsb29yKHhlKTtcclxuICAgICAgeWUgPSBiaXRGbG9vcih5ZSk7XHJcbiAgICAgIHhjID0geGMuc2xpY2UoKTtcclxuXHJcbiAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLiBGYXN0ZXIgdG8gdXNlIHJldmVyc2UgdGhlbiBkbyB1bnNoaWZ0cy5cclxuICAgICAgaWYgKGEgPSB4ZSAtIHllKSB7XHJcbiAgICAgICAgaWYgKGEgPiAwKSB7XHJcbiAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICBmb3IgKDsgYS0tOyB0LnB1c2goMCkpO1xyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhID0geGMubGVuZ3RoO1xyXG4gICAgICBiID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gUG9pbnQgeGMgdG8gdGhlIGxvbmdlciBhcnJheSwgYW5kIGIgdG8gdGhlIHNob3J0ZXIgbGVuZ3RoLlxyXG4gICAgICBpZiAoYSAtIGIgPCAwKSB0ID0geWMsIHljID0geGMsIHhjID0gdCwgYiA9IGE7XHJcblxyXG4gICAgICAvLyBPbmx5IHN0YXJ0IGFkZGluZyBhdCB5Yy5sZW5ndGggLSAxIGFzIHRoZSBmdXJ0aGVyIGRpZ2l0cyBvZiB4YyBjYW4gYmUgaWdub3JlZC5cclxuICAgICAgZm9yIChhID0gMDsgYjspIHtcclxuICAgICAgICBhID0gKHhjWy0tYl0gPSB4Y1tiXSArIHljW2JdICsgYSkgLyBCQVNFIHwgMDtcclxuICAgICAgICB4Y1tiXSA9IEJBU0UgPT09IHhjW2JdID8gMCA6IHhjW2JdICUgQkFTRTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGEpIHtcclxuICAgICAgICB4YyA9IFthXS5jb25jYXQoeGMpO1xyXG4gICAgICAgICsreWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE5vIG5lZWQgdG8gY2hlY2sgZm9yIHplcm8sIGFzICt4ICsgK3kgIT0gMCAmJiAteCArIC15ICE9IDBcclxuICAgICAgLy8geWUgPSBNQVhfRVhQICsgMSBwb3NzaWJsZVxyXG4gICAgICByZXR1cm4gbm9ybWFsaXNlKHksIHhjLCB5ZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogSWYgc2QgaXMgdW5kZWZpbmVkIG9yIG51bGwgb3IgdHJ1ZSBvciBmYWxzZSwgcmV0dXJuIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzIG9mXHJcbiAgICAgKiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICogSWYgc2QgaXMgdHJ1ZSBpbmNsdWRlIGludGVnZXItcGFydCB0cmFpbGluZyB6ZXJvcyBpbiB0aGUgY291bnQuXHJcbiAgICAgKlxyXG4gICAgICogT3RoZXJ3aXNlLCBpZiBzZCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSBtYXhpbXVtIG9mIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvclxyXG4gICAgICogUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIHNkIHtudW1iZXJ8Ym9vbGVhbn0gbnVtYmVyOiBzaWduaWZpY2FudCBkaWdpdHM6IGludGVnZXIsIDEgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgYm9vbGVhbjogd2hldGhlciB0byBjb3VudCBpbnRlZ2VyLXBhcnQgdHJhaWxpbmcgemVyb3M6IHRydWUgb3IgZmFsc2UuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtzZHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAucHJlY2lzaW9uID0gUC5zZCA9IGZ1bmN0aW9uIChzZCwgcm0pIHtcclxuICAgICAgdmFyIGMsIG4sIHYsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAoc2QgIT0gbnVsbCAmJiBzZCAhPT0gISFzZCkge1xyXG4gICAgICAgIGludENoZWNrKHNkLCAxLCBNQVgpO1xyXG4gICAgICAgIGlmIChybSA9PSBudWxsKSBybSA9IFJPVU5ESU5HX01PREU7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICAgIHJldHVybiByb3VuZChuZXcgQmlnTnVtYmVyKHgpLCBzZCwgcm0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIShjID0geC5jKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgIHYgPSBjLmxlbmd0aCAtIDE7XHJcbiAgICAgIG4gPSB2ICogTE9HX0JBU0UgKyAxO1xyXG5cclxuICAgICAgaWYgKHYgPSBjW3ZdKSB7XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgZWxlbWVudC5cclxuICAgICAgICBmb3IgKDsgdiAlIDEwID09IDA7IHYgLz0gMTAsIG4tLSk7XHJcblxyXG4gICAgICAgIC8vIEFkZCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudC5cclxuICAgICAgICBmb3IgKHYgPSBjWzBdOyB2ID49IDEwOyB2IC89IDEwLCBuKyspO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoc2QgJiYgeC5lICsgMSA+IG4pIG4gPSB4LmUgKyAxO1xyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgc2hpZnRlZCBieSBrIHBsYWNlc1xyXG4gICAgICogKHBvd2VycyBvZiAxMCkuIFNoaWZ0IHRvIHRoZSByaWdodCBpZiBuID4gMCwgYW5kIHRvIHRoZSBsZWZ0IGlmIG4gPCAwLlxyXG4gICAgICpcclxuICAgICAqIGsge251bWJlcn0gSW50ZWdlciwgLU1BWF9TQUZFX0lOVEVHRVIgdG8gTUFYX1NBRkVfSU5URUdFUiBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtrfSdcclxuICAgICAqL1xyXG4gICAgUC5zaGlmdGVkQnkgPSBmdW5jdGlvbiAoaykge1xyXG4gICAgICBpbnRDaGVjayhrLCAtTUFYX1NBRkVfSU5URUdFUiwgTUFYX1NBRkVfSU5URUdFUik7XHJcbiAgICAgIHJldHVybiB0aGlzLnRpbWVzKCcxZScgKyBrKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiAgc3FydCgtbikgPSAgTlxyXG4gICAgICogIHNxcnQoTikgPSAgTlxyXG4gICAgICogIHNxcnQoLUkpID0gIE5cclxuICAgICAqICBzcXJ0KEkpID0gIElcclxuICAgICAqICBzcXJ0KDApID0gIDBcclxuICAgICAqICBzcXJ0KC0wKSA9IC0wXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgc3F1YXJlIHJvb3Qgb2YgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyLFxyXG4gICAgICogcm91bmRlZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKi9cclxuICAgIFAuc3F1YXJlUm9vdCA9IFAuc3FydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIG0sIG4sIHIsIHJlcCwgdCxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICBjID0geC5jLFxyXG4gICAgICAgIHMgPSB4LnMsXHJcbiAgICAgICAgZSA9IHguZSxcclxuICAgICAgICBkcCA9IERFQ0lNQUxfUExBQ0VTICsgNCxcclxuICAgICAgICBoYWxmID0gbmV3IEJpZ051bWJlcignMC41Jyk7XHJcblxyXG4gICAgICAvLyBOZWdhdGl2ZS9OYU4vSW5maW5pdHkvemVybz9cclxuICAgICAgaWYgKHMgIT09IDEgfHwgIWMgfHwgIWNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcighcyB8fCBzIDwgMCAmJiAoIWMgfHwgY1swXSkgPyBOYU4gOiBjID8geCA6IDEgLyAwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSW5pdGlhbCBlc3RpbWF0ZS5cclxuICAgICAgcyA9IE1hdGguc3FydCgrdmFsdWVPZih4KSk7XHJcblxyXG4gICAgICAvLyBNYXRoLnNxcnQgdW5kZXJmbG93L292ZXJmbG93P1xyXG4gICAgICAvLyBQYXNzIHggdG8gTWF0aC5zcXJ0IGFzIGludGVnZXIsIHRoZW4gYWRqdXN0IHRoZSBleHBvbmVudCBvZiB0aGUgcmVzdWx0LlxyXG4gICAgICBpZiAocyA9PSAwIHx8IHMgPT0gMSAvIDApIHtcclxuICAgICAgICBuID0gY29lZmZUb1N0cmluZyhjKTtcclxuICAgICAgICBpZiAoKG4ubGVuZ3RoICsgZSkgJSAyID09IDApIG4gKz0gJzAnO1xyXG4gICAgICAgIHMgPSBNYXRoLnNxcnQoK24pO1xyXG4gICAgICAgIGUgPSBiaXRGbG9vcigoZSArIDEpIC8gMikgLSAoZSA8IDAgfHwgZSAlIDIpO1xyXG5cclxuICAgICAgICBpZiAocyA9PSAxIC8gMCkge1xyXG4gICAgICAgICAgbiA9ICcxZScgKyBlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuID0gcy50b0V4cG9uZW50aWFsKCk7XHJcbiAgICAgICAgICBuID0gbi5zbGljZSgwLCBuLmluZGV4T2YoJ2UnKSArIDEpICsgZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKG4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKHMgKyAnJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciB6ZXJvLlxyXG4gICAgICAvLyByIGNvdWxkIGJlIHplcm8gaWYgTUlOX0VYUCBpcyBjaGFuZ2VkIGFmdGVyIHRoZSB0aGlzIHZhbHVlIHdhcyBjcmVhdGVkLlxyXG4gICAgICAvLyBUaGlzIHdvdWxkIGNhdXNlIGEgZGl2aXNpb24gYnkgemVybyAoeC90KSBhbmQgaGVuY2UgSW5maW5pdHkgYmVsb3csIHdoaWNoIHdvdWxkIGNhdXNlXHJcbiAgICAgIC8vIGNvZWZmVG9TdHJpbmcgdG8gdGhyb3cuXHJcbiAgICAgIGlmIChyLmNbMF0pIHtcclxuICAgICAgICBlID0gci5lO1xyXG4gICAgICAgIHMgPSBlICsgZHA7XHJcbiAgICAgICAgaWYgKHMgPCAzKSBzID0gMDtcclxuXHJcbiAgICAgICAgLy8gTmV3dG9uLVJhcGhzb24gaXRlcmF0aW9uLlxyXG4gICAgICAgIGZvciAoOyA7KSB7XHJcbiAgICAgICAgICB0ID0gcjtcclxuICAgICAgICAgIHIgPSBoYWxmLnRpbWVzKHQucGx1cyhkaXYoeCwgdCwgZHAsIDEpKSk7XHJcblxyXG4gICAgICAgICAgaWYgKGNvZWZmVG9TdHJpbmcodC5jKS5zbGljZSgwLCBzKSA9PT0gKG4gPSBjb2VmZlRvU3RyaW5nKHIuYykpLnNsaWNlKDAsIHMpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgZXhwb25lbnQgb2YgciBtYXkgaGVyZSBiZSBvbmUgbGVzcyB0aGFuIHRoZSBmaW5hbCByZXN1bHQgZXhwb25lbnQsXHJcbiAgICAgICAgICAgIC8vIGUuZyAwLjAwMDk5OTkgKGUtNCkgLS0+IDAuMDAxIChlLTMpLCBzbyBhZGp1c3QgcyBzbyB0aGUgcm91bmRpbmcgZGlnaXRzXHJcbiAgICAgICAgICAgIC8vIGFyZSBpbmRleGVkIGNvcnJlY3RseS5cclxuICAgICAgICAgICAgaWYgKHIuZSA8IGUpIC0tcztcclxuICAgICAgICAgICAgbiA9IG4uc2xpY2UocyAtIDMsIHMgKyAxKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSA0dGggcm91bmRpbmcgZGlnaXQgbWF5IGJlIGluIGVycm9yIGJ5IC0xIHNvIGlmIHRoZSA0IHJvdW5kaW5nIGRpZ2l0c1xyXG4gICAgICAgICAgICAvLyBhcmUgOTk5OSBvciA0OTk5IChpLmUuIGFwcHJvYWNoaW5nIGEgcm91bmRpbmcgYm91bmRhcnkpIGNvbnRpbnVlIHRoZVxyXG4gICAgICAgICAgICAvLyBpdGVyYXRpb24uXHJcbiAgICAgICAgICAgIGlmIChuID09ICc5OTk5JyB8fCAhcmVwICYmIG4gPT0gJzQ5OTknKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIE9uIHRoZSBmaXJzdCBpdGVyYXRpb24gb25seSwgY2hlY2sgdG8gc2VlIGlmIHJvdW5kaW5nIHVwIGdpdmVzIHRoZVxyXG4gICAgICAgICAgICAgIC8vIGV4YWN0IHJlc3VsdCBhcyB0aGUgbmluZXMgbWF5IGluZmluaXRlbHkgcmVwZWF0LlxyXG4gICAgICAgICAgICAgIGlmICghcmVwKSB7XHJcbiAgICAgICAgICAgICAgICByb3VuZCh0LCB0LmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0LnRpbWVzKHQpLmVxKHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHIgPSB0O1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGRwICs9IDQ7XHJcbiAgICAgICAgICAgICAgcyArPSA0O1xyXG4gICAgICAgICAgICAgIHJlcCA9IDE7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIElmIHJvdW5kaW5nIGRpZ2l0cyBhcmUgbnVsbCwgMHswLDR9IG9yIDUwezAsM30sIGNoZWNrIGZvciBleGFjdFxyXG4gICAgICAgICAgICAgIC8vIHJlc3VsdC4gSWYgbm90LCB0aGVuIHRoZXJlIGFyZSBmdXJ0aGVyIGRpZ2l0cyBhbmQgbSB3aWxsIGJlIHRydXRoeS5cclxuICAgICAgICAgICAgICBpZiAoIStuIHx8ICErbi5zbGljZSgxKSAmJiBuLmNoYXJBdCgwKSA9PSAnNScpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcnVuY2F0ZSB0byB0aGUgZmlyc3Qgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICAgICAgICByb3VuZChyLCByLmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDEpO1xyXG4gICAgICAgICAgICAgICAgbSA9ICFyLnRpbWVzKHIpLmVxKHgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByb3VuZChyLCByLmUgKyBERUNJTUFMX1BMQUNFUyArIDEsIFJPVU5ESU5HX01PREUsIG0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGV4cG9uZW50aWFsIG5vdGF0aW9uIGFuZFxyXG4gICAgICogcm91bmRlZCB1c2luZyBST1VORElOR19NT0RFIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC50b0V4cG9uZW50aWFsID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGRwKys7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBkcCwgcm0sIDEpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uIHJvdW5kaW5nXHJcbiAgICAgKiB0byBkcCBmaXhlZCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogTm90ZTogYXMgd2l0aCBKYXZhU2NyaXB0J3MgbnVtYmVyIHR5cGUsICgtMCkudG9GaXhlZCgwKSBpcyAnMCcsXHJcbiAgICAgKiBidXQgZS5nLiAoLTAuMDAwMDEpLnRvRml4ZWQoMCkgaXMgJy0wJy5cclxuICAgICAqXHJcbiAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtkcHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAudG9GaXhlZCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgaWYgKGRwICE9IG51bGwpIHtcclxuICAgICAgICBpbnRDaGVjayhkcCwgMCwgTUFYKTtcclxuICAgICAgICBkcCA9IGRwICsgdGhpcy5lICsgMTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCBybSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24gcm91bmRlZFxyXG4gICAgICogdXNpbmcgcm0gb3IgUk9VTkRJTkdfTU9ERSB0byBkcCBkZWNpbWFsIHBsYWNlcywgYW5kIGZvcm1hdHRlZCBhY2NvcmRpbmcgdG8gdGhlIHByb3BlcnRpZXNcclxuICAgICAqIG9mIHRoZSBmb3JtYXQgb3IgRk9STUFUIG9iamVjdCAoc2VlIEJpZ051bWJlci5zZXQpLlxyXG4gICAgICpcclxuICAgICAqIFRoZSBmb3JtYXR0aW5nIG9iamVjdCBtYXkgY29udGFpbiBzb21lIG9yIGFsbCBvZiB0aGUgcHJvcGVydGllcyBzaG93biBiZWxvdy5cclxuICAgICAqXHJcbiAgICAgKiBGT1JNQVQgPSB7XHJcbiAgICAgKiAgIHByZWZpeDogJycsXHJcbiAgICAgKiAgIGdyb3VwU2l6ZTogMyxcclxuICAgICAqICAgc2Vjb25kYXJ5R3JvdXBTaXplOiAwLFxyXG4gICAgICogICBncm91cFNlcGFyYXRvcjogJywnLFxyXG4gICAgICogICBkZWNpbWFsU2VwYXJhdG9yOiAnLicsXHJcbiAgICAgKiAgIGZyYWN0aW9uR3JvdXBTaXplOiAwLFxyXG4gICAgICogICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yOiAnXFx4QTAnLCAgICAgIC8vIG5vbi1icmVha2luZyBzcGFjZVxyXG4gICAgICogICBzdWZmaXg6ICcnXHJcbiAgICAgKiB9O1xyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqIFtmb3JtYXRdIHtvYmplY3R9IEZvcm1hdHRpbmcgb3B0aW9ucy4gU2VlIEZPUk1BVCBwYmplY3QgYWJvdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtkcHxybX0nXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQgbm90IGFuIG9iamVjdDoge2Zvcm1hdH0nXHJcbiAgICAgKi9cclxuICAgIFAudG9Gb3JtYXQgPSBmdW5jdGlvbiAoZHAsIHJtLCBmb3JtYXQpIHtcclxuICAgICAgdmFyIHN0cixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChmb3JtYXQgPT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChkcCAhPSBudWxsICYmIHJtICYmIHR5cGVvZiBybSA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgZm9ybWF0ID0gcm07XHJcbiAgICAgICAgICBybSA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkcCAmJiB0eXBlb2YgZHAgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgIGZvcm1hdCA9IGRwO1xyXG4gICAgICAgICAgZHAgPSBybSA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGZvcm1hdCA9IEZPUk1BVDtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGZvcm1hdCAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnQXJndW1lbnQgbm90IGFuIG9iamVjdDogJyArIGZvcm1hdCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHN0ciA9IHgudG9GaXhlZChkcCwgcm0pO1xyXG5cclxuICAgICAgaWYgKHguYykge1xyXG4gICAgICAgIHZhciBpLFxyXG4gICAgICAgICAgYXJyID0gc3RyLnNwbGl0KCcuJyksXHJcbiAgICAgICAgICBnMSA9ICtmb3JtYXQuZ3JvdXBTaXplLFxyXG4gICAgICAgICAgZzIgPSArZm9ybWF0LnNlY29uZGFyeUdyb3VwU2l6ZSxcclxuICAgICAgICAgIGdyb3VwU2VwYXJhdG9yID0gZm9ybWF0Lmdyb3VwU2VwYXJhdG9yIHx8ICcnLFxyXG4gICAgICAgICAgaW50UGFydCA9IGFyclswXSxcclxuICAgICAgICAgIGZyYWN0aW9uUGFydCA9IGFyclsxXSxcclxuICAgICAgICAgIGlzTmVnID0geC5zIDwgMCxcclxuICAgICAgICAgIGludERpZ2l0cyA9IGlzTmVnID8gaW50UGFydC5zbGljZSgxKSA6IGludFBhcnQsXHJcbiAgICAgICAgICBsZW4gPSBpbnREaWdpdHMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoZzIpIGkgPSBnMSwgZzEgPSBnMiwgZzIgPSBpLCBsZW4gLT0gaTtcclxuXHJcbiAgICAgICAgaWYgKGcxID4gMCAmJiBsZW4gPiAwKSB7XHJcbiAgICAgICAgICBpID0gbGVuICUgZzEgfHwgZzE7XHJcbiAgICAgICAgICBpbnRQYXJ0ID0gaW50RGlnaXRzLnN1YnN0cigwLCBpKTtcclxuICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpICs9IGcxKSBpbnRQYXJ0ICs9IGdyb3VwU2VwYXJhdG9yICsgaW50RGlnaXRzLnN1YnN0cihpLCBnMSk7XHJcbiAgICAgICAgICBpZiAoZzIgPiAwKSBpbnRQYXJ0ICs9IGdyb3VwU2VwYXJhdG9yICsgaW50RGlnaXRzLnNsaWNlKGkpO1xyXG4gICAgICAgICAgaWYgKGlzTmVnKSBpbnRQYXJ0ID0gJy0nICsgaW50UGFydDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0ciA9IGZyYWN0aW9uUGFydFxyXG4gICAgICAgICA/IGludFBhcnQgKyAoZm9ybWF0LmRlY2ltYWxTZXBhcmF0b3IgfHwgJycpICsgKChnMiA9ICtmb3JtYXQuZnJhY3Rpb25Hcm91cFNpemUpXHJcbiAgICAgICAgICA/IGZyYWN0aW9uUGFydC5yZXBsYWNlKG5ldyBSZWdFeHAoJ1xcXFxkeycgKyBnMiArICd9XFxcXEInLCAnZycpLFxyXG4gICAgICAgICAgICckJicgKyAoZm9ybWF0LmZyYWN0aW9uR3JvdXBTZXBhcmF0b3IgfHwgJycpKVxyXG4gICAgICAgICAgOiBmcmFjdGlvblBhcnQpXHJcbiAgICAgICAgIDogaW50UGFydDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChmb3JtYXQucHJlZml4IHx8ICcnKSArIHN0ciArIChmb3JtYXQuc3VmZml4IHx8ICcnKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYW4gYXJyYXkgb2YgdHdvIEJpZ051bWJlcnMgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBhcyBhIHNpbXBsZVxyXG4gICAgICogZnJhY3Rpb24gd2l0aCBhbiBpbnRlZ2VyIG51bWVyYXRvciBhbmQgYW4gaW50ZWdlciBkZW5vbWluYXRvci5cclxuICAgICAqIFRoZSBkZW5vbWluYXRvciB3aWxsIGJlIGEgcG9zaXRpdmUgbm9uLXplcm8gdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBzcGVjaWZpZWRcclxuICAgICAqIG1heGltdW0gZGVub21pbmF0b3IuIElmIGEgbWF4aW11bSBkZW5vbWluYXRvciBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgZGVub21pbmF0b3Igd2lsbCBiZVxyXG4gICAgICogdGhlIGxvd2VzdCB2YWx1ZSBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBudW1iZXIgZXhhY3RseS5cclxuICAgICAqXHJcbiAgICAgKiBbbWRdIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gSW50ZWdlciA+PSAxLCBvciBJbmZpbml0eS4gVGhlIG1heGltdW0gZGVub21pbmF0b3IuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9IDoge21kfSdcclxuICAgICAqL1xyXG4gICAgUC50b0ZyYWN0aW9uID0gZnVuY3Rpb24gKG1kKSB7XHJcbiAgICAgIHZhciBkLCBkMCwgZDEsIGQyLCBlLCBleHAsIG4sIG4wLCBuMSwgcSwgciwgcyxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICB4YyA9IHguYztcclxuXHJcbiAgICAgIGlmIChtZCAhPSBudWxsKSB7XHJcbiAgICAgICAgbiA9IG5ldyBCaWdOdW1iZXIobWQpO1xyXG5cclxuICAgICAgICAvLyBUaHJvdyBpZiBtZCBpcyBsZXNzIHRoYW4gb25lIG9yIGlzIG5vdCBhbiBpbnRlZ2VyLCB1bmxlc3MgaXQgaXMgSW5maW5pdHkuXHJcbiAgICAgICAgaWYgKCFuLmlzSW50ZWdlcigpICYmIChuLmMgfHwgbi5zICE9PSAxKSB8fCBuLmx0KE9ORSkpIHtcclxuICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdBcmd1bWVudCAnICtcclxuICAgICAgICAgICAgICAobi5pc0ludGVnZXIoKSA/ICdvdXQgb2YgcmFuZ2U6ICcgOiAnbm90IGFuIGludGVnZXI6ICcpICsgdmFsdWVPZihuKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXhjKSByZXR1cm4gbmV3IEJpZ051bWJlcih4KTtcclxuXHJcbiAgICAgIGQgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIG4xID0gZDAgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIGQxID0gbjAgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIHMgPSBjb2VmZlRvU3RyaW5nKHhjKTtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSBpbml0aWFsIGRlbm9taW5hdG9yLlxyXG4gICAgICAvLyBkIGlzIGEgcG93ZXIgb2YgMTAgYW5kIHRoZSBtaW5pbXVtIG1heCBkZW5vbWluYXRvciB0aGF0IHNwZWNpZmllcyB0aGUgdmFsdWUgZXhhY3RseS5cclxuICAgICAgZSA9IGQuZSA9IHMubGVuZ3RoIC0geC5lIC0gMTtcclxuICAgICAgZC5jWzBdID0gUE9XU19URU5bKGV4cCA9IGUgJSBMT0dfQkFTRSkgPCAwID8gTE9HX0JBU0UgKyBleHAgOiBleHBdO1xyXG4gICAgICBtZCA9ICFtZCB8fCBuLmNvbXBhcmVkVG8oZCkgPiAwID8gKGUgPiAwID8gZCA6IG4xKSA6IG47XHJcblxyXG4gICAgICBleHAgPSBNQVhfRVhQO1xyXG4gICAgICBNQVhfRVhQID0gMSAvIDA7XHJcbiAgICAgIG4gPSBuZXcgQmlnTnVtYmVyKHMpO1xyXG5cclxuICAgICAgLy8gbjAgPSBkMSA9IDBcclxuICAgICAgbjAuY1swXSA9IDA7XHJcblxyXG4gICAgICBmb3IgKDsgOykgIHtcclxuICAgICAgICBxID0gZGl2KG4sIGQsIDAsIDEpO1xyXG4gICAgICAgIGQyID0gZDAucGx1cyhxLnRpbWVzKGQxKSk7XHJcbiAgICAgICAgaWYgKGQyLmNvbXBhcmVkVG8obWQpID09IDEpIGJyZWFrO1xyXG4gICAgICAgIGQwID0gZDE7XHJcbiAgICAgICAgZDEgPSBkMjtcclxuICAgICAgICBuMSA9IG4wLnBsdXMocS50aW1lcyhkMiA9IG4xKSk7XHJcbiAgICAgICAgbjAgPSBkMjtcclxuICAgICAgICBkID0gbi5taW51cyhxLnRpbWVzKGQyID0gZCkpO1xyXG4gICAgICAgIG4gPSBkMjtcclxuICAgICAgfVxyXG5cclxuICAgICAgZDIgPSBkaXYobWQubWludXMoZDApLCBkMSwgMCwgMSk7XHJcbiAgICAgIG4wID0gbjAucGx1cyhkMi50aW1lcyhuMSkpO1xyXG4gICAgICBkMCA9IGQwLnBsdXMoZDIudGltZXMoZDEpKTtcclxuICAgICAgbjAucyA9IG4xLnMgPSB4LnM7XHJcbiAgICAgIGUgPSBlICogMjtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSB3aGljaCBmcmFjdGlvbiBpcyBjbG9zZXIgdG8geCwgbjAvZDAgb3IgbjEvZDFcclxuICAgICAgciA9IGRpdihuMSwgZDEsIGUsIFJPVU5ESU5HX01PREUpLm1pbnVzKHgpLmFicygpLmNvbXBhcmVkVG8oXHJcbiAgICAgICAgICBkaXYobjAsIGQwLCBlLCBST1VORElOR19NT0RFKS5taW51cyh4KS5hYnMoKSkgPCAxID8gW24xLCBkMV0gOiBbbjAsIGQwXTtcclxuXHJcbiAgICAgIE1BWF9FWFAgPSBleHA7XHJcblxyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGNvbnZlcnRlZCB0byBhIG51bWJlciBwcmltaXRpdmUuXHJcbiAgICAgKi9cclxuICAgIFAudG9OdW1iZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiArdmFsdWVPZih0aGlzKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0c1xyXG4gICAgICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSBvciBST1VORElOR19NT0RFLiBJZiBzZCBpcyBsZXNzIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHNcclxuICAgICAqIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIGludGVnZXIgcGFydCBvZiB0aGUgdmFsdWUgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24sIHRoZW4gdXNlXHJcbiAgICAgKiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBbc2RdIHtudW1iZXJ9IFNpZ25pZmljYW50IGRpZ2l0cy4gSW50ZWdlciwgMSB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7c2R8cm19J1xyXG4gICAgICovXHJcbiAgICBQLnRvUHJlY2lzaW9uID0gZnVuY3Rpb24gKHNkLCBybSkge1xyXG4gICAgICBpZiAoc2QgIT0gbnVsbCkgaW50Q2hlY2soc2QsIDEsIE1BWCk7XHJcbiAgICAgIHJldHVybiBmb3JtYXQodGhpcywgc2QsIHJtLCAyKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBiYXNlIGIsIG9yIGJhc2UgMTAgaWYgYiBpc1xyXG4gICAgICogb21pdHRlZC4gSWYgYSBiYXNlIGlzIHNwZWNpZmllZCwgaW5jbHVkaW5nIGJhc2UgMTAsIHJvdW5kIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmRcclxuICAgICAqIFJPVU5ESU5HX01PREUuIElmIGEgYmFzZSBpcyBub3Qgc3BlY2lmaWVkLCBhbmQgdGhpcyBCaWdOdW1iZXIgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnRcclxuICAgICAqIHRoYXQgaXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFRPX0VYUF9QT1MsIG9yIGEgbmVnYXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgbGVzcyB0aGFuXHJcbiAgICAgKiBUT19FWFBfTkVHLCByZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgKlxyXG4gICAgICogW2JdIHtudW1iZXJ9IEludGVnZXIsIDIgdG8gQUxQSEFCRVQubGVuZ3RoIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQmFzZSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7Yn0nXHJcbiAgICAgKi9cclxuICAgIFAudG9TdHJpbmcgPSBmdW5jdGlvbiAoYikge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIG4gPSB0aGlzLFxyXG4gICAgICAgIHMgPSBuLnMsXHJcbiAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgIC8vIEluZmluaXR5IG9yIE5hTj9cclxuICAgICAgaWYgKGUgPT09IG51bGwpIHtcclxuICAgICAgICBpZiAocykge1xyXG4gICAgICAgICAgc3RyID0gJ0luZmluaXR5JztcclxuICAgICAgICAgIGlmIChzIDwgMCkgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzdHIgPSAnTmFOJztcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc3RyID0gY29lZmZUb1N0cmluZyhuLmMpO1xyXG5cclxuICAgICAgICBpZiAoYiA9PSBudWxsKSB7XHJcbiAgICAgICAgICBzdHIgPSBlIDw9IFRPX0VYUF9ORUcgfHwgZSA+PSBUT19FWFBfUE9TXHJcbiAgICAgICAgICAgPyB0b0V4cG9uZW50aWFsKHN0ciwgZSlcclxuICAgICAgICAgICA6IHRvRml4ZWRQb2ludChzdHIsIGUsICcwJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGludENoZWNrKGIsIDIsIEFMUEhBQkVULmxlbmd0aCwgJ0Jhc2UnKTtcclxuICAgICAgICAgIHN0ciA9IGNvbnZlcnRCYXNlKHRvRml4ZWRQb2ludChzdHIsIGUsICcwJyksIDEwLCBiLCBzLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzIDwgMCAmJiBuLmNbMF0pIHN0ciA9ICctJyArIHN0cjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYXMgdG9TdHJpbmcsIGJ1dCBkbyBub3QgYWNjZXB0IGEgYmFzZSBhcmd1bWVudCwgYW5kIGluY2x1ZGUgdGhlIG1pbnVzIHNpZ24gZm9yXHJcbiAgICAgKiBuZWdhdGl2ZSB6ZXJvLlxyXG4gICAgICovXHJcbiAgICBQLnZhbHVlT2YgPSBQLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHZhbHVlT2YodGhpcyk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBQLl9pc0JpZ051bWJlciA9IHRydWU7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBTeW1ib2wgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09ICdzeW1ib2wnKSB7XHJcbiAgICAgIFBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdCaWdOdW1iZXInO1xyXG4gICAgICAvLyBOb2RlLmpzIHYxMC4xMi4wK1xyXG4gICAgICBQW1N5bWJvbC5mb3IoJ25vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tJyldID0gUC52YWx1ZU9mO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb25maWdPYmplY3QgIT0gbnVsbCkgQmlnTnVtYmVyLnNldChjb25maWdPYmplY3QpO1xyXG5cclxuICAgIHJldHVybiBCaWdOdW1iZXI7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gUFJJVkFURSBIRUxQRVIgRlVOQ1RJT05TXHJcblxyXG5cclxuICBmdW5jdGlvbiBiaXRGbG9vcihuKSB7XHJcbiAgICB2YXIgaSA9IG4gfCAwO1xyXG4gICAgcmV0dXJuIG4gPiAwIHx8IG4gPT09IGkgPyBpIDogaSAtIDE7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gUmV0dXJuIGEgY29lZmZpY2llbnQgYXJyYXkgYXMgYSBzdHJpbmcgb2YgYmFzZSAxMCBkaWdpdHMuXHJcbiAgZnVuY3Rpb24gY29lZmZUb1N0cmluZyhhKSB7XHJcbiAgICB2YXIgcywgeixcclxuICAgICAgaSA9IDEsXHJcbiAgICAgIGogPSBhLmxlbmd0aCxcclxuICAgICAgciA9IGFbMF0gKyAnJztcclxuXHJcbiAgICBmb3IgKDsgaSA8IGo7KSB7XHJcbiAgICAgIHMgPSBhW2krK10gKyAnJztcclxuICAgICAgeiA9IExPR19CQVNFIC0gcy5sZW5ndGg7XHJcbiAgICAgIGZvciAoOyB6LS07IHMgPSAnMCcgKyBzKTtcclxuICAgICAgciArPSBzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGVybWluZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgIGZvciAoaiA9IHIubGVuZ3RoOyByLmNoYXJDb2RlQXQoLS1qKSA9PT0gNDg7KTtcclxuXHJcbiAgICByZXR1cm4gci5zbGljZSgwLCBqICsgMSB8fCAxKTtcclxuICB9XHJcblxyXG5cclxuICAvLyBDb21wYXJlIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXJzIHggYW5kIHkuXHJcbiAgZnVuY3Rpb24gY29tcGFyZSh4LCB5KSB7XHJcbiAgICB2YXIgYSwgYixcclxuICAgICAgeGMgPSB4LmMsXHJcbiAgICAgIHljID0geS5jLFxyXG4gICAgICBpID0geC5zLFxyXG4gICAgICBqID0geS5zLFxyXG4gICAgICBrID0geC5lLFxyXG4gICAgICBsID0geS5lO1xyXG5cclxuICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICBpZiAoIWkgfHwgIWopIHJldHVybiBudWxsO1xyXG5cclxuICAgIGEgPSB4YyAmJiAheGNbMF07XHJcbiAgICBiID0geWMgJiYgIXljWzBdO1xyXG5cclxuICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgaWYgKGEgfHwgYikgcmV0dXJuIGEgPyBiID8gMCA6IC1qIDogaTtcclxuXHJcbiAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICBpZiAoaSAhPSBqKSByZXR1cm4gaTtcclxuXHJcbiAgICBhID0gaSA8IDA7XHJcbiAgICBiID0gayA9PSBsO1xyXG5cclxuICAgIC8vIEVpdGhlciBJbmZpbml0eT9cclxuICAgIGlmICgheGMgfHwgIXljKSByZXR1cm4gYiA/IDAgOiAheGMgXiBhID8gMSA6IC0xO1xyXG5cclxuICAgIC8vIENvbXBhcmUgZXhwb25lbnRzLlxyXG4gICAgaWYgKCFiKSByZXR1cm4gayA+IGwgXiBhID8gMSA6IC0xO1xyXG5cclxuICAgIGogPSAoayA9IHhjLmxlbmd0aCkgPCAobCA9IHljLmxlbmd0aCkgPyBrIDogbDtcclxuXHJcbiAgICAvLyBDb21wYXJlIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgZm9yIChpID0gMDsgaSA8IGo7IGkrKykgaWYgKHhjW2ldICE9IHljW2ldKSByZXR1cm4geGNbaV0gPiB5Y1tpXSBeIGEgPyAxIDogLTE7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBsZW5ndGhzLlxyXG4gICAgcmV0dXJuIGsgPT0gbCA/IDAgOiBrID4gbCBeIGEgPyAxIDogLTE7XHJcbiAgfVxyXG5cclxuXHJcbiAgLypcclxuICAgKiBDaGVjayB0aGF0IG4gaXMgYSBwcmltaXRpdmUgbnVtYmVyLCBhbiBpbnRlZ2VyLCBhbmQgaW4gcmFuZ2UsIG90aGVyd2lzZSB0aHJvdy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBpbnRDaGVjayhuLCBtaW4sIG1heCwgbmFtZSkge1xyXG4gICAgaWYgKG4gPCBtaW4gfHwgbiA+IG1heCB8fCBuICE9PSAobiA8IDAgPyBtYXRoY2VpbChuKSA6IG1hdGhmbG9vcihuKSkpIHtcclxuICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgIChiaWdudW1iZXJFcnJvciArIChuYW1lIHx8ICdBcmd1bWVudCcpICsgKHR5cGVvZiBuID09ICdudW1iZXInXHJcbiAgICAgICAgID8gbiA8IG1pbiB8fCBuID4gbWF4ID8gJyBvdXQgb2YgcmFuZ2U6ICcgOiAnIG5vdCBhbiBpbnRlZ2VyOiAnXHJcbiAgICAgICAgIDogJyBub3QgYSBwcmltaXRpdmUgbnVtYmVyOiAnKSArIFN0cmluZyhuKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gQXNzdW1lcyBmaW5pdGUgbi5cclxuICBmdW5jdGlvbiBpc09kZChuKSB7XHJcbiAgICB2YXIgayA9IG4uYy5sZW5ndGggLSAxO1xyXG4gICAgcmV0dXJuIGJpdEZsb29yKG4uZSAvIExPR19CQVNFKSA9PSBrICYmIG4uY1trXSAlIDIgIT0gMDtcclxuICB9XHJcblxyXG5cclxuICBmdW5jdGlvbiB0b0V4cG9uZW50aWFsKHN0ciwgZSkge1xyXG4gICAgcmV0dXJuIChzdHIubGVuZ3RoID4gMSA/IHN0ci5jaGFyQXQoMCkgKyAnLicgKyBzdHIuc2xpY2UoMSkgOiBzdHIpICtcclxuICAgICAoZSA8IDAgPyAnZScgOiAnZSsnKSArIGU7XHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gdG9GaXhlZFBvaW50KHN0ciwgZSwgeikge1xyXG4gICAgdmFyIGxlbiwgenM7XHJcblxyXG4gICAgLy8gTmVnYXRpdmUgZXhwb25lbnQ/XHJcbiAgICBpZiAoZSA8IDApIHtcclxuXHJcbiAgICAgIC8vIFByZXBlbmQgemVyb3MuXHJcbiAgICAgIGZvciAoenMgPSB6ICsgJy4nOyArK2U7IHpzICs9IHopO1xyXG4gICAgICBzdHIgPSB6cyArIHN0cjtcclxuXHJcbiAgICAvLyBQb3NpdGl2ZSBleHBvbmVudFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGVuID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgIC8vIEFwcGVuZCB6ZXJvcy5cclxuICAgICAgaWYgKCsrZSA+IGxlbikge1xyXG4gICAgICAgIGZvciAoenMgPSB6LCBlIC09IGxlbjsgLS1lOyB6cyArPSB6KTtcclxuICAgICAgICBzdHIgKz0genM7XHJcbiAgICAgIH0gZWxzZSBpZiAoZSA8IGxlbikge1xyXG4gICAgICAgIHN0ciA9IHN0ci5zbGljZSgwLCBlKSArICcuJyArIHN0ci5zbGljZShlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdHI7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gRVhQT1JUXHJcblxyXG5cclxuICBCaWdOdW1iZXIgPSBjbG9uZSgpO1xyXG4gIEJpZ051bWJlclsnZGVmYXVsdCddID0gQmlnTnVtYmVyLkJpZ051bWJlciA9IEJpZ051bWJlcjtcclxuXHJcbiAgLy8gQU1ELlxyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIEJpZ051bWJlcjsgfSk7XHJcblxyXG4gIC8vIE5vZGUuanMgYW5kIG90aGVyIGVudmlyb25tZW50cyB0aGF0IHN1cHBvcnQgbW9kdWxlLmV4cG9ydHMuXHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEJpZ051bWJlcjtcclxuXHJcbiAgLy8gQnJvd3Nlci5cclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKCFnbG9iYWxPYmplY3QpIHtcclxuICAgICAgZ2xvYmFsT2JqZWN0ID0gdHlwZW9mIHNlbGYgIT0gJ3VuZGVmaW5lZCcgJiYgc2VsZiA/IHNlbGYgOiB3aW5kb3c7XHJcbiAgICB9XHJcblxyXG4gICAgZ2xvYmFsT2JqZWN0LkJpZ051bWJlciA9IEJpZ051bWJlcjtcclxuICB9XHJcbn0pKHRoaXMpO1xyXG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbGFuZ3VhZ2VUYWc6IFwiZW4tVVNcIixcbiAgICBkZWxpbWl0ZXJzOiB7XG4gICAgICAgIHRob3VzYW5kczogXCIsXCIsXG4gICAgICAgIGRlY2ltYWw6IFwiLlwiXG4gICAgfSxcbiAgICBhYmJyZXZpYXRpb25zOiB7XG4gICAgICAgIHRob3VzYW5kOiBcImtcIixcbiAgICAgICAgbWlsbGlvbjogXCJtXCIsXG4gICAgICAgIGJpbGxpb246IFwiYlwiLFxuICAgICAgICB0cmlsbGlvbjogXCJ0XCJcbiAgICB9LFxuICAgIHNwYWNlU2VwYXJhdGVkOiBmYWxzZSxcbiAgICBvcmRpbmFsOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgbGV0IGIgPSBudW1iZXIgJSAxMDtcbiAgICAgICAgcmV0dXJuICh+fihudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gXCJ0aFwiIDogKGIgPT09IDEpID8gXCJzdFwiIDogKGIgPT09IDIpID8gXCJuZFwiIDogKGIgPT09IDMpID8gXCJyZFwiIDogXCJ0aFwiO1xuICAgIH0sXG4gICAgY3VycmVuY3k6IHtcbiAgICAgICAgc3ltYm9sOiBcIiRcIixcbiAgICAgICAgcG9zaXRpb246IFwicHJlZml4XCIsXG4gICAgICAgIGNvZGU6IFwiVVNEXCJcbiAgICB9LFxuICAgIGN1cnJlbmN5Rm9ybWF0OiB7XG4gICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICB0b3RhbExlbmd0aDogNCxcbiAgICAgICAgc3BhY2VTZXBhcmF0ZWQ6IHRydWUsXG4gICAgICAgIHNwYWNlU2VwYXJhdGVkQ3VycmVuY3k6IHRydWVcbiAgICB9LFxuICAgIGZvcm1hdHM6IHtcbiAgICAgICAgZm91ckRpZ2l0czoge1xuICAgICAgICAgICAgdG90YWxMZW5ndGg6IDQsXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IFwiY3VycmVuY3lcIixcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDJcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsc05vQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDJcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhOb0RlY2ltYWxzOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IFwiY3VycmVuY3lcIixcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDBcbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgZ2xvYmFsU3RhdGUgPSByZXF1aXJlKFwiLi9nbG9iYWxTdGF0ZVwiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmNvbnN0IGJpbmFyeVN1ZmZpeGVzID0gW1wiQlwiLCBcIktpQlwiLCBcIk1pQlwiLCBcIkdpQlwiLCBcIlRpQlwiLCBcIlBpQlwiLCBcIkVpQlwiLCBcIlppQlwiLCBcIllpQlwiXTtcbmNvbnN0IGRlY2ltYWxTdWZmaXhlcyA9IFtcIkJcIiwgXCJLQlwiLCBcIk1CXCIsIFwiR0JcIiwgXCJUQlwiLCBcIlBCXCIsIFwiRUJcIiwgXCJaQlwiLCBcIllCXCJdO1xuY29uc3QgYnl0ZXMgPSB7XG4gICAgZ2VuZXJhbDoge3NjYWxlOiAxMDI0LCBzdWZmaXhlczogZGVjaW1hbFN1ZmZpeGVzLCBtYXJrZXI6IFwiYmRcIn0sXG4gICAgYmluYXJ5OiB7c2NhbGU6IDEwMjQsIHN1ZmZpeGVzOiBiaW5hcnlTdWZmaXhlcywgbWFya2VyOiBcImJcIn0sXG4gICAgZGVjaW1hbDoge3NjYWxlOiAxMDAwLCBzdWZmaXhlczogZGVjaW1hbFN1ZmZpeGVzLCBtYXJrZXI6IFwiZFwifVxufTtcblxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgdG90YWxMZW5ndGg6IDAsXG4gICAgY2hhcmFjdGVyaXN0aWM6IDAsXG4gICAgZm9yY2VBdmVyYWdlOiBmYWxzZSxcbiAgICBhdmVyYWdlOiBmYWxzZSxcbiAgICBtYW50aXNzYTogLTEsXG4gICAgb3B0aW9uYWxNYW50aXNzYTogdHJ1ZSxcbiAgICB0aG91c2FuZFNlcGFyYXRlZDogZmFsc2UsXG4gICAgc3BhY2VTZXBhcmF0ZWQ6IGZhbHNlLFxuICAgIG5lZ2F0aXZlOiBcInNpZ25cIixcbiAgICBmb3JjZVNpZ246IGZhbHNlLFxuICAgIHJvdW5kaW5nRnVuY3Rpb246IE1hdGgucm91bmRcbn07XG5cbi8qKlxuICogRW50cnkgcG9pbnQuIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYWNjb3JkaW5nIHRvIHRoZSBQUk9WSURFREZPUk1BVC5cbiAqIFRoaXMgbWV0aG9kIGVuc3VyZSB0aGUgcHJlZml4IGFuZCBwb3N0Zml4IGFyZSBhZGRlZCBhcyB0aGUgbGFzdCBzdGVwLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fHN0cmluZ30gW3Byb3ZpZGVkRm9ybWF0XSAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXQoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0ID0ge30sIG51bWJybykge1xuICAgIGlmICh0eXBlb2YgcHJvdmlkZWRGb3JtYXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBwYXJzaW5nLnBhcnNlRm9ybWF0KHByb3ZpZGVkRm9ybWF0KTtcbiAgICB9XG5cbiAgICBsZXQgdmFsaWQgPSB2YWxpZGF0aW5nLnZhbGlkYXRlRm9ybWF0KHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGlmICghdmFsaWQpIHtcbiAgICAgICAgcmV0dXJuIFwiRVJST1I6IGludmFsaWQgZm9ybWF0XCI7XG4gICAgfVxuXG4gICAgbGV0IHByZWZpeCA9IHByb3ZpZGVkRm9ybWF0LnByZWZpeCB8fCBcIlwiO1xuICAgIGxldCBwb3N0Zml4ID0gcHJvdmlkZWRGb3JtYXQucG9zdGZpeCB8fCBcIlwiO1xuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJybyhpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIG51bWJybyk7XG4gICAgb3V0cHV0ID0gaW5zZXJ0UHJlZml4KG91dHB1dCwgcHJlZml4KTtcbiAgICBvdXRwdXQgPSBpbnNlcnRQb3N0Zml4KG91dHB1dCwgcG9zdGZpeCk7XG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFjY29yZGluZyB0byB0aGUgUFJPVklERURGT1JNQVQuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0TnVtYnJvKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgbnVtYnJvKSB7XG4gICAgc3dpdGNoIChwcm92aWRlZEZvcm1hdC5vdXRwdXQpIHtcbiAgICAgICAgY2FzZSBcImN1cnJlbmN5XCI6IHtcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdEN1cnJlbmN5KGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInBlcmNlbnRcIjoge1xuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRQZXJjZW50YWdlRGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRQZXJjZW50YWdlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImJ5dGVcIjpcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50Qnl0ZURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0Qnl0ZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICBjYXNlIFwidGltZVwiOlxuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRUaW1lRGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRUaW1lKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIGNhc2UgXCJvcmRpbmFsXCI6XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudE9yZGluYWxEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE9yZGluYWwoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE51bWJlcih7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgICAgICAgICAgbnVtYnJvXG4gICAgICAgICAgICB9KTtcbiAgICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBkZWNpbWFsIGJ5dGUgdW5pdCAoTUIpIGZvciB0aGUgcHJvdmlkZWQgbnVtYnJvIElOU1RBTkNFLlxuICogV2UgZ28gZnJvbSBvbmUgdW5pdCB0byBhbm90aGVyIHVzaW5nIHRoZSBkZWNpbWFsIHN5c3RlbSAoMTAwMCkuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGNvbXB1dGVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0RGVjaW1hbEJ5dGVVbml0KGluc3RhbmNlKSB7XG4gICAgbGV0IGRhdGEgPSBieXRlcy5kZWNpbWFsO1xuICAgIHJldHVybiBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBkYXRhLnN1ZmZpeGVzLCBkYXRhLnNjYWxlKS5zdWZmaXg7XG59XG5cbi8qKlxuICogR2V0IHRoZSBiaW5hcnkgYnl0ZSB1bml0IChNaUIpIGZvciB0aGUgcHJvdmlkZWQgbnVtYnJvIElOU1RBTkNFLlxuICogV2UgZ28gZnJvbSBvbmUgdW5pdCB0byBhbm90aGVyIHVzaW5nIHRoZSBkZWNpbWFsIHN5c3RlbSAoMTAyNCkuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGNvbXB1dGVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0QmluYXJ5Qnl0ZVVuaXQoaW5zdGFuY2UpIHtcbiAgICBsZXQgZGF0YSA9IGJ5dGVzLmJpbmFyeTtcbiAgICByZXR1cm4gZ2V0Rm9ybWF0Qnl0ZVVuaXRzKGluc3RhbmNlLl92YWx1ZSwgZGF0YS5zdWZmaXhlcywgZGF0YS5zY2FsZSkuc3VmZml4O1xufVxuXG4vKipcbiAqIEdldCB0aGUgZGVjaW1hbCBieXRlIHVuaXQgKE1CKSBmb3IgdGhlIHByb3ZpZGVkIG51bWJybyBJTlNUQU5DRS5cbiAqIFdlIGdvIGZyb20gb25lIHVuaXQgdG8gYW5vdGhlciB1c2luZyB0aGUgZGVjaW1hbCBzeXN0ZW0gKDEwMjQpLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBjb21wdXRlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldEJ5dGVVbml0KGluc3RhbmNlKSB7XG4gICAgbGV0IGRhdGEgPSBieXRlcy5nZW5lcmFsO1xuICAgIHJldHVybiBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBkYXRhLnN1ZmZpeGVzLCBkYXRhLnNjYWxlKS5zdWZmaXg7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSB2YWx1ZSBhbmQgdGhlIHN1ZmZpeCBjb21wdXRlZCBpbiBieXRlLlxuICogSXQgdXNlcyB0aGUgU1VGRklYRVMgYW5kIHRoZSBTQ0FMRSBwcm92aWRlZC5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBOdW1iZXIgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge1tTdHJpbmddfSBzdWZmaXhlcyAtIExpc3Qgb2Ygc3VmZml4ZXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZSAtIE51bWJlciBpbi1iZXR3ZWVuIHR3byB1bml0c1xuICogQHJldHVybiB7e3ZhbHVlOiBOdW1iZXIsIHN1ZmZpeDogU3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gZ2V0Rm9ybWF0Qnl0ZVVuaXRzKHZhbHVlLCBzdWZmaXhlcywgc2NhbGUpIHtcbiAgICBsZXQgc3VmZml4ID0gc3VmZml4ZXNbMF07XG4gICAgbGV0IGFicyA9IE1hdGguYWJzKHZhbHVlKTtcblxuICAgIGlmIChhYnMgPj0gc2NhbGUpIHtcbiAgICAgICAgZm9yIChsZXQgcG93ZXIgPSAxOyBwb3dlciA8IHN1ZmZpeGVzLmxlbmd0aDsgKytwb3dlcikge1xuICAgICAgICAgICAgbGV0IG1pbiA9IE1hdGgucG93KHNjYWxlLCBwb3dlcik7XG4gICAgICAgICAgICBsZXQgbWF4ID0gTWF0aC5wb3coc2NhbGUsIHBvd2VyICsgMSk7XG5cbiAgICAgICAgICAgIGlmIChhYnMgPj0gbWluICYmIGFicyA8IG1heCkge1xuICAgICAgICAgICAgICAgIHN1ZmZpeCA9IHN1ZmZpeGVzW3Bvd2VyXTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gbWluO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsdWVzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBbc2NhbGVdIFlCIG5ldmVyIHNldCB0aGUgc3VmZml4XG4gICAgICAgIGlmIChzdWZmaXggPT09IHN1ZmZpeGVzWzBdKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coc2NhbGUsIHN1ZmZpeGVzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgc3VmZml4ID0gc3VmZml4ZXNbc3VmZml4ZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge3ZhbHVlLCBzdWZmaXh9O1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYnl0ZXMgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULCBhbmQgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdEJ5dGUoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSwgbnVtYnJvKSB7XG4gICAgbGV0IGJhc2UgPSBwcm92aWRlZEZvcm1hdC5iYXNlIHx8IFwiYmluYXJ5XCI7XG4gICAgbGV0IGJhc2VJbmZvID0gYnl0ZXNbYmFzZV07XG5cbiAgICBsZXQge3ZhbHVlLCBzdWZmaXh9ID0gZ2V0Rm9ybWF0Qnl0ZVVuaXRzKGluc3RhbmNlLl92YWx1ZSwgYmFzZUluZm8uc3VmZml4ZXMsIGJhc2VJbmZvLnNjYWxlKTtcbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgaW5zdGFuY2U6IG51bWJybyh2YWx1ZSksXG4gICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgZGVmYXVsdHM6IHN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCgpXG4gICAgfSk7XG4gICAgbGV0IGFiYnJldmlhdGlvbnMgPSBzdGF0ZS5jdXJyZW50QWJicmV2aWF0aW9ucygpO1xuICAgIHJldHVybiBgJHtvdXRwdXR9JHthYmJyZXZpYXRpb25zLnNwYWNlZCA/IFwiIFwiIDogXCJcIn0ke3N1ZmZpeH1gO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYW4gb3JkaW5hbCB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0T3JkaW5hbChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlKSB7XG4gICAgbGV0IG9yZGluYWxGbiA9IHN0YXRlLmN1cnJlbnRPcmRpbmFsKCk7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGVcbiAgICB9KTtcbiAgICBsZXQgb3JkaW5hbCA9IG9yZGluYWxGbihpbnN0YW5jZS5fdmFsdWUpO1xuXG4gICAgcmV0dXJuIGAke291dHB1dH0ke29wdGlvbnMuc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCJ9JHtvcmRpbmFsfWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIHRpbWUgSEg6TU06U1MuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRUaW1lKGluc3RhbmNlKSB7XG4gICAgbGV0IGhvdXJzID0gTWF0aC5mbG9vcihpbnN0YW5jZS5fdmFsdWUgLyA2MCAvIDYwKTtcbiAgICBsZXQgbWludXRlcyA9IE1hdGguZmxvb3IoKGluc3RhbmNlLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApKSAvIDYwKTtcbiAgICBsZXQgc2Vjb25kcyA9IE1hdGgucm91bmQoaW5zdGFuY2UuX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkgLSAobWludXRlcyAqIDYwKSk7XG4gICAgcmV0dXJuIGAke2hvdXJzfTokeyhtaW51dGVzIDwgMTApID8gXCIwXCIgOiBcIlwifSR7bWludXRlc306JHsoc2Vjb25kcyA8IDEwKSA/IFwiMFwiIDogXCJcIn0ke3NlY29uZHN9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgcGVyY2VudGFnZSB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRQZXJjZW50YWdlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUsIG51bWJybykge1xuICAgIGxldCBwcmVmaXhTeW1ib2wgPSBwcm92aWRlZEZvcm1hdC5wcmVmaXhTeW1ib2w7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgaW5zdGFuY2U6IG51bWJybyhpbnN0YW5jZS5fdmFsdWUgKiAxMDApLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGVcbiAgICB9KTtcbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwcm92aWRlZEZvcm1hdCk7XG5cbiAgICBpZiAocHJlZml4U3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBgJSR7b3B0aW9ucy5zcGFjZVNlcGFyYXRlZCA/IFwiIFwiIDogXCJcIn0ke291dHB1dH1gO1xuICAgIH1cblxuICAgIHJldHVybiBgJHtvdXRwdXR9JHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSVgO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYSBwZXJjZW50YWdlIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRDdXJyZW5jeShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlKSB7XG4gICAgY29uc3QgY3VycmVudEN1cnJlbmN5ID0gc3RhdGUuY3VycmVudEN1cnJlbmN5KCk7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcHJvdmlkZWRGb3JtYXQpO1xuICAgIGxldCBkZWNpbWFsU2VwYXJhdG9yID0gdW5kZWZpbmVkO1xuICAgIGxldCBzcGFjZSA9IFwiXCI7XG4gICAgbGV0IGF2ZXJhZ2UgPSAhIW9wdGlvbnMudG90YWxMZW5ndGggfHwgISFvcHRpb25zLmZvcmNlQXZlcmFnZSB8fCBvcHRpb25zLmF2ZXJhZ2U7XG4gICAgbGV0IHBvc2l0aW9uID0gcHJvdmlkZWRGb3JtYXQuY3VycmVuY3lQb3NpdGlvbiB8fCBjdXJyZW50Q3VycmVuY3kucG9zaXRpb247XG4gICAgbGV0IHN5bWJvbCA9IHByb3ZpZGVkRm9ybWF0LmN1cnJlbmN5U3ltYm9sIHx8IGN1cnJlbnRDdXJyZW5jeS5zeW1ib2w7XG4gICAgY29uc3Qgc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSA9IG9wdGlvbnMuc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSAhPT0gdm9pZCAwXG4gICAgICAgID8gb3B0aW9ucy5zcGFjZVNlcGFyYXRlZEN1cnJlbmN5IDogb3B0aW9ucy5zcGFjZVNlcGFyYXRlZDtcblxuICAgIGlmIChzcGFjZVNlcGFyYXRlZEN1cnJlbmN5KSB7XG4gICAgICAgIHNwYWNlID0gXCIgXCI7XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uID09PSBcImluZml4XCIpIHtcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvciA9IHNwYWNlICsgc3ltYm9sICsgc3BhY2U7XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIGRlY2ltYWxTZXBhcmF0b3JcbiAgICB9KTtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gXCJwcmVmaXhcIikge1xuICAgICAgICBpZiAoaW5zdGFuY2UuX3ZhbHVlIDwgMCAmJiBvcHRpb25zLm5lZ2F0aXZlID09PSBcInNpZ25cIikge1xuICAgICAgICAgICAgb3V0cHV0ID0gYC0ke3NwYWNlfSR7c3ltYm9sfSR7b3V0cHV0LnNsaWNlKDEpfWA7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5zdGFuY2UuX3ZhbHVlID4gMCAmJiBvcHRpb25zLmZvcmNlU2lnbikge1xuICAgICAgICAgICAgb3V0cHV0ID0gYCske3NwYWNlfSR7c3ltYm9sfSR7b3V0cHV0LnNsaWNlKDEpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBzeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcG9zaXRpb24gfHwgcG9zaXRpb24gPT09IFwicG9zdGZpeFwiKSB7XG4gICAgICAgIHNwYWNlID0gYXZlcmFnZSA/IFwiXCIgOiBzcGFjZTtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyBzeW1ib2w7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBhdmVyYWdlIHZhbHVlIG91dCBvZiBWQUxVRS5cbiAqIFRoZSBvdGhlciBwYXJhbWV0ZXJzIGFyZSBjb21wdXRhdGlvbiBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIHZhbHVlIHRvIGNvbXB1dGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZm9yY2VBdmVyYWdlXSAtIGZvcmNlZCB1bml0IHVzZWQgdG8gY29tcHV0ZVxuICogQHBhcmFtIHt7fX0gYWJicmV2aWF0aW9ucyAtIHBhcnQgb2YgdGhlIGxhbmd1YWdlIHNwZWNpZmljYXRpb25cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc3BhY2VTZXBhcmF0ZWQgLSBgdHJ1ZWAgaWYgYSBzcGFjZSBtdXN0IGJlIGluc2VydGVkIGJldHdlZW4gdGhlIHZhbHVlIGFuZCB0aGUgYWJicmV2aWF0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gW3RvdGFsTGVuZ3RoXSAtIHRvdGFsIGxlbmd0aCBvZiB0aGUgb3V0cHV0IGluY2x1ZGluZyB0aGUgY2hhcmFjdGVyaXN0aWMgYW5kIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nLCBtYW50aXNzYVByZWNpc2lvbjogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUF2ZXJhZ2Uoe3ZhbHVlLCBmb3JjZUF2ZXJhZ2UsIGFiYnJldmlhdGlvbnMsIHNwYWNlU2VwYXJhdGVkID0gZmFsc2UsIHRvdGFsTGVuZ3RoID0gMH0pIHtcbiAgICBsZXQgYWJicmV2aWF0aW9uID0gXCJcIjtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IC0xO1xuXG4gICAgaWYgKChhYnMgPj0gTWF0aC5wb3coMTAsIDEyKSAmJiAhZm9yY2VBdmVyYWdlKSB8fCAoZm9yY2VBdmVyYWdlID09PSBcInRyaWxsaW9uXCIpKSB7XG4gICAgICAgIC8vIHRyaWxsaW9uXG4gICAgICAgIGFiYnJldmlhdGlvbiA9IGFiYnJldmlhdGlvbnMudHJpbGxpb247XG4gICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMTIpO1xuICAgIH0gZWxzZSBpZiAoKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhZm9yY2VBdmVyYWdlKSB8fCAoZm9yY2VBdmVyYWdlID09PSBcImJpbGxpb25cIikpIHtcbiAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICBhYmJyZXZpYXRpb24gPSBhYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgfSBlbHNlIGlmICgoYWJzIDwgTWF0aC5wb3coMTAsIDkpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgNikgJiYgIWZvcmNlQXZlcmFnZSkgfHwgKGZvcmNlQXZlcmFnZSA9PT0gXCJtaWxsaW9uXCIpKSB7XG4gICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy5taWxsaW9uO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDYpO1xuICAgIH0gZWxzZSBpZiAoKGFicyA8IE1hdGgucG93KDEwLCA2KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDMpICYmICFmb3JjZUF2ZXJhZ2UpIHx8IChmb3JjZUF2ZXJhZ2UgPT09IFwidGhvdXNhbmRcIikpIHtcbiAgICAgICAgLy8gdGhvdXNhbmRcbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9uYWxTcGFjZSA9IHNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwiO1xuXG4gICAgaWYgKGFiYnJldmlhdGlvbikge1xuICAgICAgICBhYmJyZXZpYXRpb24gPSBvcHRpb25hbFNwYWNlICsgYWJicmV2aWF0aW9uO1xuICAgIH1cblxuICAgIGlmICh0b3RhbExlbmd0aCkge1xuICAgICAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSB2YWx1ZS50b1N0cmluZygpLnNwbGl0KFwiLlwiKVswXTtcbiAgICAgICAgbWFudGlzc2FQcmVjaXNpb24gPSBNYXRoLm1heCh0b3RhbExlbmd0aCAtIGNoYXJhY3RlcmlzdGljLmxlbmd0aCwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHt2YWx1ZSwgYWJicmV2aWF0aW9uLCBtYW50aXNzYVByZWNpc2lvbn07XG59XG5cbi8qKlxuICogQ29tcHV0ZSBhbiBleHBvbmVudGlhbCBmb3JtIGZvciBWQUxVRSwgdGFraW5nIGludG8gYWNjb3VudCBDSEFSQUNURVJJU1RJQ1xuICogaWYgcHJvdmlkZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSB2YWx1ZSB0byBjb21wdXRlXG4gKiBAcGFyYW0ge251bWJlcn0gW2NoYXJhY3RlcmlzdGljUHJlY2lzaW9uXSAtIG9wdGlvbmFsIGNoYXJhY3RlcmlzdGljIGxlbmd0aFxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUV4cG9uZW50aWFsKHt2YWx1ZSwgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gPSAwfSkge1xuICAgIGxldCBbbnVtYmVyU3RyaW5nLCBleHBvbmVudGlhbF0gPSB2YWx1ZS50b0V4cG9uZW50aWFsKCkuc3BsaXQoXCJlXCIpO1xuICAgIGxldCBudW1iZXIgPSArbnVtYmVyU3RyaW5nO1xuXG4gICAgaWYgKCFjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IG51bWJlcixcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbjogYGUke2V4cG9uZW50aWFsfWBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgY2hhcmFjdGVyaXN0aWNMZW5ndGggPSAxOyAvLyBzZWUgYHRvRXhwb25lbnRpYWxgXG5cbiAgICBpZiAoY2hhcmFjdGVyaXN0aWNMZW5ndGggPCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbikge1xuICAgICAgICBudW1iZXIgPSBudW1iZXIgKiBNYXRoLnBvdygxMCwgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gLSBjaGFyYWN0ZXJpc3RpY0xlbmd0aCk7XG4gICAgICAgIGV4cG9uZW50aWFsID0gK2V4cG9uZW50aWFsIC0gKGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uIC0gY2hhcmFjdGVyaXN0aWNMZW5ndGgpO1xuICAgICAgICBleHBvbmVudGlhbCA9IGV4cG9uZW50aWFsID49IDAgPyBgKyR7ZXhwb25lbnRpYWx9YCA6IGV4cG9uZW50aWFsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiBudW1iZXIsXG4gICAgICAgIGFiYnJldmlhdGlvbjogYGUke2V4cG9uZW50aWFsfWBcbiAgICB9O1xufVxuXG4vKipcbiAqIFJldHVybiBhIHN0cmluZyBvZiBOVU1CRVIgemVyby5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gTGVuZ3RoIG9mIHRoZSBvdXRwdXRcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gemVyb2VzKG51bWJlcikge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyOyBpKyspIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiMFwiO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyBWQUxVRSB3aXRoIGEgUFJFQ0lTSU9OLWxvbmcgbWFudGlzc2EuXG4gKiBUaGlzIG1ldGhvZCBpcyBmb3IgbGFyZ2Uvc21hbGwgbnVtYmVycyBvbmx5IChhLmsuYS4gaW5jbHVkaW5nIGEgXCJlXCIpLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciB0byBwcmVjaXNlXG4gKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIC0gZGVzaXJlZCBsZW5ndGggZm9yIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB0b0ZpeGVkTGFyZ2UodmFsdWUsIHByZWNpc2lvbikge1xuICAgIGxldCByZXN1bHQgPSB2YWx1ZS50b1N0cmluZygpO1xuXG4gICAgbGV0IFtiYXNlLCBleHBdID0gcmVzdWx0LnNwbGl0KFwiZVwiKTtcblxuICAgIGxldCBbY2hhcmFjdGVyaXN0aWMsIG1hbnRpc3NhID0gXCJcIl0gPSBiYXNlLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmICgrZXhwID4gMCkge1xuICAgICAgICByZXN1bHQgPSBjaGFyYWN0ZXJpc3RpYyArIG1hbnRpc3NhICsgemVyb2VzKGV4cCAtIG1hbnRpc3NhLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByZWZpeCA9IFwiLlwiO1xuXG4gICAgICAgIGlmICgrY2hhcmFjdGVyaXN0aWMgPCAwKSB7XG4gICAgICAgICAgICBwcmVmaXggPSBgLTAke3ByZWZpeH1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJlZml4ID0gYDAke3ByZWZpeH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN1ZmZpeCA9ICh6ZXJvZXMoLWV4cCAtIDEpICsgTWF0aC5hYnMoY2hhcmFjdGVyaXN0aWMpICsgbWFudGlzc2EpLnN1YnN0cigwLCBwcmVjaXNpb24pO1xuICAgICAgICBpZiAoc3VmZml4Lmxlbmd0aCA8IHByZWNpc2lvbikge1xuICAgICAgICAgICAgc3VmZml4ICs9IHplcm9lcyhwcmVjaXNpb24gLSBzdWZmaXgubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBwcmVmaXggKyBzdWZmaXg7XG4gICAgfVxuXG4gICAgaWYgKCtleHAgPiAwICYmIHByZWNpc2lvbiA+IDApIHtcbiAgICAgICAgcmVzdWx0ICs9IGAuJHt6ZXJvZXMocHJlY2lzaW9uKX1gO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyBWQUxVRSB3aXRoIGEgUFJFQ0lTSU9OLWxvbmcgbWFudGlzc2EuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHByZWNpc2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIGxlbmd0aCBmb3IgdGhlIG1hbnRpc3NhXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSByb3VuZGluZ0Z1bmN0aW9uIC0gcm91bmRpbmcgZnVuY3Rpb24gdG8gYmUgdXNlZFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB0b0ZpeGVkKHZhbHVlLCBwcmVjaXNpb24sIHJvdW5kaW5nRnVuY3Rpb24gPSBNYXRoLnJvdW5kKSB7XG4gICAgaWYgKHZhbHVlLnRvU3RyaW5nKCkuaW5kZXhPZihcImVcIikgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0b0ZpeGVkTGFyZ2UodmFsdWUsIHByZWNpc2lvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIChyb3VuZGluZ0Z1bmN0aW9uKCtgJHt2YWx1ZX1lKyR7cHJlY2lzaW9ufWApIC8gKE1hdGgucG93KDEwLCBwcmVjaXNpb24pKSkudG9GaXhlZChwcmVjaXNpb24pO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBPVVRQVVQgd2l0aCBhIG1hbnRpc3NhIHByZWNpc2lvbiBvZiBQUkVDSVNJT04uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25hbE1hbnRpc3NhIC0gaWYgYHRydWVgLCB0aGUgbWFudGlzc2EgaXMgb21pdHRlZCB3aGVuIGl0J3Mgb25seSB6ZXJvZXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIHByZWNpc2lvbiBvZiB0aGUgbWFudGlzc2FcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdHJpbSAtIGlmIGB0cnVlYCwgdHJhaWxpbmcgemVyb2VzIGFyZSByZW1vdmVkIGZyb20gdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHNldE1hbnRpc3NhUHJlY2lzaW9uKG91dHB1dCwgdmFsdWUsIG9wdGlvbmFsTWFudGlzc2EsIHByZWNpc2lvbiwgdHJpbSwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgIGlmIChwcmVjaXNpb24gPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCA9IHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbiwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgbGV0IFtjdXJyZW50Q2hhcmFjdGVyaXN0aWMsIGN1cnJlbnRNYW50aXNzYSA9IFwiXCJdID0gcmVzdWx0LnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpO1xuXG4gICAgaWYgKGN1cnJlbnRNYW50aXNzYS5tYXRjaCgvXjArJC8pICYmIChvcHRpb25hbE1hbnRpc3NhIHx8IHRyaW0pKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50Q2hhcmFjdGVyaXN0aWM7XG4gICAgfVxuXG4gICAgbGV0IGhhc1RyYWlsaW5nWmVyb2VzID0gY3VycmVudE1hbnRpc3NhLm1hdGNoKC8wKyQvKTtcbiAgICBpZiAodHJpbSAmJiBoYXNUcmFpbGluZ1plcm9lcykge1xuICAgICAgICByZXR1cm4gYCR7Y3VycmVudENoYXJhY3RlcmlzdGljfS4ke2N1cnJlbnRNYW50aXNzYS50b1N0cmluZygpLnNsaWNlKDAsIGhhc1RyYWlsaW5nWmVyb2VzLmluZGV4KX1gO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgT1VUUFVUIHdpdGggYSBjaGFyYWN0ZXJpc3RpYyBwcmVjaXNpb24gb2YgUFJFQ0lTSU9OLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIGJlaW5nIGN1cnJlbnRseSBmb3JtYXR0ZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyAtIGB0cnVlYCBpZiB0aGUgY2hhcmFjdGVyaXN0aWMgaXMgb21pdHRlZCB3aGVuIGl0J3Mgb25seSB6ZXJvZXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIHByZWNpc2lvbiBvZiB0aGUgY2hhcmFjdGVyaXN0aWNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gc2V0Q2hhcmFjdGVyaXN0aWNQcmVjaXNpb24ob3V0cHV0LCB2YWx1ZSwgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYywgcHJlY2lzaW9uKSB7XG4gICAgbGV0IHJlc3VsdCA9IG91dHB1dDtcbiAgICBsZXQgW2N1cnJlbnRDaGFyYWN0ZXJpc3RpYywgY3VycmVudE1hbnRpc3NhXSA9IHJlc3VsdC50b1N0cmluZygpLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmIChjdXJyZW50Q2hhcmFjdGVyaXN0aWMubWF0Y2goL14tPzAkLykgJiYgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYykge1xuICAgICAgICBpZiAoIWN1cnJlbnRNYW50aXNzYSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5yZXBsYWNlKFwiMFwiLCBcIlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBgJHtjdXJyZW50Q2hhcmFjdGVyaXN0aWMucmVwbGFjZShcIjBcIiwgXCJcIil9LiR7Y3VycmVudE1hbnRpc3NhfWA7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5sZW5ndGggPCBwcmVjaXNpb24pIHtcbiAgICAgICAgbGV0IG1pc3NpbmdaZXJvcyA9IHByZWNpc2lvbiAtIGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWlzc2luZ1plcm9zOyBpKyspIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGAwJHtyZXN1bHR9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGluZGV4ZXMgd2hlcmUgYXJlIHRoZSBncm91cCBzZXBhcmF0aW9ucyBhZnRlciBzcGxpdHRpbmdcbiAqIGB0b3RhbExlbmd0aGAgaW4gZ3JvdXAgb2YgYGdyb3VwU2l6ZWAgc2l6ZS5cbiAqIEltcG9ydGFudDogd2Ugc3RhcnQgZ3JvdXBpbmcgZnJvbSB0aGUgcmlnaHQgaGFuZCBzaWRlLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB0b3RhbExlbmd0aCAtIHRvdGFsIGxlbmd0aCBvZiB0aGUgY2hhcmFjdGVyaXN0aWMgdG8gc3BsaXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBncm91cFNpemUgLSBsZW5ndGggb2YgZWFjaCBncm91cFxuICogQHJldHVybiB7W251bWJlcl19XG4gKi9cbmZ1bmN0aW9uIGluZGV4ZXNPZkdyb3VwU3BhY2VzKHRvdGFsTGVuZ3RoLCBncm91cFNpemUpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgbGV0IGNvdW50ZXIgPSAwO1xuICAgIGZvciAobGV0IGkgPSB0b3RhbExlbmd0aDsgaSA+IDA7IGktLSkge1xuICAgICAgICBpZiAoY291bnRlciA9PT0gZ3JvdXBTaXplKSB7XG4gICAgICAgICAgICByZXN1bHQudW5zaGlmdChpKTtcbiAgICAgICAgICAgIGNvdW50ZXIgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50ZXIrKztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlcGxhY2UgdGhlIGRlY2ltYWwgc2VwYXJhdG9yIHdpdGggREVDSU1BTFNFUEFSQVRPUiBhbmQgaW5zZXJ0IHRob3VzYW5kXG4gKiBzZXBhcmF0b3JzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIGJlaW5nIGN1cnJlbnRseSBmb3JtYXR0ZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdGhvdXNhbmRTZXBhcmF0ZWQgLSBgdHJ1ZWAgaWYgdGhlIGNoYXJhY3RlcmlzdGljIG11c3QgYmUgc2VwYXJhdGVkXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IGRlY2ltYWxTZXBhcmF0b3IgLSBzdHJpbmcgdG8gdXNlIGFzIGRlY2ltYWwgc2VwYXJhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHJlcGxhY2VEZWxpbWl0ZXJzKG91dHB1dCwgdmFsdWUsIHRob3VzYW5kU2VwYXJhdGVkLCBzdGF0ZSwgZGVjaW1hbFNlcGFyYXRvcikge1xuICAgIGxldCBkZWxpbWl0ZXJzID0gc3RhdGUuY3VycmVudERlbGltaXRlcnMoKTtcbiAgICBsZXQgdGhvdXNhbmRTZXBhcmF0b3IgPSBkZWxpbWl0ZXJzLnRob3VzYW5kcztcbiAgICBkZWNpbWFsU2VwYXJhdG9yID0gZGVjaW1hbFNlcGFyYXRvciB8fCBkZWxpbWl0ZXJzLmRlY2ltYWw7XG4gICAgbGV0IHRob3VzYW5kc1NpemUgPSBkZWxpbWl0ZXJzLnRob3VzYW5kc1NpemUgfHwgMztcblxuICAgIGxldCByZXN1bHQgPSBvdXRwdXQudG9TdHJpbmcoKTtcbiAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSByZXN1bHQuc3BsaXQoXCIuXCIpWzBdO1xuICAgIGxldCBtYW50aXNzYSA9IHJlc3VsdC5zcGxpdChcIi5cIilbMV07XG4gICAgY29uc3QgaGFzTmVnYXRpdmVTaWduID0gdmFsdWUgPCAwICYmIGNoYXJhY3RlcmlzdGljLmluZGV4T2YoXCItXCIpID09PSAwO1xuXG4gICAgaWYgKHRob3VzYW5kU2VwYXJhdGVkKSB7XG4gICAgICAgIGlmIChoYXNOZWdhdGl2ZVNpZ24pIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbmVnYXRpdmUgc2lnblxuICAgICAgICAgICAgY2hhcmFjdGVyaXN0aWMgPSBjaGFyYWN0ZXJpc3RpYy5zbGljZSgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbmRleGVzVG9JbnNlcnRUaG91c2FuZERlbGltaXRlcnMgPSBpbmRleGVzT2ZHcm91cFNwYWNlcyhjaGFyYWN0ZXJpc3RpYy5sZW5ndGgsIHRob3VzYW5kc1NpemUpO1xuICAgICAgICBpbmRleGVzVG9JbnNlcnRUaG91c2FuZERlbGltaXRlcnMuZm9yRWFjaCgocG9zaXRpb24sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLnNsaWNlKDAsIHBvc2l0aW9uICsgaW5kZXgpICsgdGhvdXNhbmRTZXBhcmF0b3IgKyBjaGFyYWN0ZXJpc3RpYy5zbGljZShwb3NpdGlvbiArIGluZGV4KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGhhc05lZ2F0aXZlU2lnbikge1xuICAgICAgICAgICAgLy8gQWRkIGJhY2sgdGhlIG5lZ2F0aXZlIHNpZ25cbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljID0gYC0ke2NoYXJhY3RlcmlzdGljfWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW1hbnRpc3NhKSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljICsgZGVjaW1hbFNlcGFyYXRvciArIG1hbnRpc3NhO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgcHJvdmlkZWQgQUJCUkVWSUFUSU9OIGF0IHRoZSBlbmQgb2YgT1VUUFVULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtzdHJpbmd9IGFiYnJldmlhdGlvbiAtIGFiYnJldmlhdGlvbiB0byBhcHBlbmRcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbikge1xuICAgIHJldHVybiBvdXRwdXQgKyBhYmJyZXZpYXRpb247XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwb3NpdGl2ZS9uZWdhdGl2ZSBzaWduIGFjY29yZGluZyB0byB0aGUgTkVHQVRJVkUgZmxhZy5cbiAqIElmIHRoZSB2YWx1ZSBpcyBuZWdhdGl2ZSBidXQgc3RpbGwgb3V0cHV0IGFzIDAsIHRoZSBuZWdhdGl2ZSBzaWduIGlzIHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtzdHJpbmd9IG5lZ2F0aXZlIC0gZmxhZyBmb3IgdGhlIG5lZ2F0aXZlIGZvcm0gKFwic2lnblwiIG9yIFwicGFyZW50aGVzaXNcIilcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydFNpZ24ob3V0cHV0LCB2YWx1ZSwgbmVnYXRpdmUpIHtcbiAgICBpZiAodmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBpZiAoK291dHB1dCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb3V0cHV0LnJlcGxhY2UoXCItXCIsIFwiXCIpO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSA+IDApIHtcbiAgICAgICAgcmV0dXJuIGArJHtvdXRwdXR9YDtcbiAgICB9XG5cbiAgICBpZiAobmVnYXRpdmUgPT09IFwic2lnblwiKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAoJHtvdXRwdXQucmVwbGFjZShcIi1cIiwgXCJcIil9KWA7XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwcm92aWRlZCBQUkVGSVggYXQgdGhlIHN0YXJ0IG9mIE9VVFBVVC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBhYmJyZXZpYXRpb24gdG8gcHJlcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0UHJlZml4KG91dHB1dCwgcHJlZml4KSB7XG4gICAgcmV0dXJuIHByZWZpeCArIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHByb3ZpZGVkIFBPU1RGSVggYXQgdGhlIGVuZCBvZiBPVVRQVVQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gcG9zdGZpeCAtIGFiYnJldmlhdGlvbiB0byBhcHBlbmRcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydFBvc3RmaXgob3V0cHV0LCBwb3N0Zml4KSB7XG4gICAgcmV0dXJuIG91dHB1dCArIHBvc3RmaXg7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIG51bWJlciB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICogVGhpcyBpcyB0aGUga2V5IG1ldGhvZCBvZiB0aGUgZnJhbWV3b3JrIVxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IFtwcm92aWRlZEZvcm1hdF0gLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IGRlY2ltYWxTZXBhcmF0b3IgLSBzdHJpbmcgdG8gdXNlIGFzIGRlY2ltYWwgc2VwYXJhdG9yXG4gKiBAcGFyYW0ge3t9fSBkZWZhdWx0cyAtIFNldCBvZiBkZWZhdWx0IHZhbHVlcyB1c2VkIGZvciBmb3JtYXR0aW5nXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE51bWJlcih7aW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSA9IGdsb2JhbFN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yLCBkZWZhdWx0cyA9IHN0YXRlLmN1cnJlbnREZWZhdWx0cygpfSkge1xuICAgIGxldCB2YWx1ZSA9IGluc3RhbmNlLl92YWx1ZTtcblxuICAgIGlmICh2YWx1ZSA9PT0gMCAmJiBzdGF0ZS5oYXNaZXJvRm9ybWF0KCkpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmdldFplcm9Gb3JtYXQoKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBkZWZhdWx0cywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgbGV0IHRvdGFsTGVuZ3RoID0gb3B0aW9ucy50b3RhbExlbmd0aDtcbiAgICBsZXQgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gPSB0b3RhbExlbmd0aCA/IDAgOiBvcHRpb25zLmNoYXJhY3RlcmlzdGljO1xuICAgIGxldCBvcHRpb25hbENoYXJhY3RlcmlzdGljID0gb3B0aW9ucy5vcHRpb25hbENoYXJhY3RlcmlzdGljO1xuICAgIGxldCBmb3JjZUF2ZXJhZ2UgPSBvcHRpb25zLmZvcmNlQXZlcmFnZTtcbiAgICBsZXQgYXZlcmFnZSA9ICEhdG90YWxMZW5ndGggfHwgISFmb3JjZUF2ZXJhZ2UgfHwgb3B0aW9ucy5hdmVyYWdlO1xuXG4gICAgLy8gZGVmYXVsdCB3aGVuIGF2ZXJhZ2luZyBpcyB0byBjaG9wIG9mZiBkZWNpbWFsc1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IHRvdGFsTGVuZ3RoID8gLTEgOiAoYXZlcmFnZSAmJiBwcm92aWRlZEZvcm1hdC5tYW50aXNzYSA9PT0gdW5kZWZpbmVkID8gMCA6IG9wdGlvbnMubWFudGlzc2EpO1xuICAgIGxldCBvcHRpb25hbE1hbnRpc3NhID0gdG90YWxMZW5ndGggPyBmYWxzZSA6IChwcm92aWRlZEZvcm1hdC5vcHRpb25hbE1hbnRpc3NhID09PSB1bmRlZmluZWQgPyBtYW50aXNzYVByZWNpc2lvbiA9PT0gLTEgOiBvcHRpb25zLm9wdGlvbmFsTWFudGlzc2EpO1xuICAgIGxldCB0cmltTWFudGlzc2EgPSBvcHRpb25zLnRyaW1NYW50aXNzYTtcbiAgICBsZXQgdGhvdXNhbmRTZXBhcmF0ZWQgPSBvcHRpb25zLnRob3VzYW5kU2VwYXJhdGVkO1xuICAgIGxldCBzcGFjZVNlcGFyYXRlZCA9IG9wdGlvbnMuc3BhY2VTZXBhcmF0ZWQ7XG4gICAgbGV0IG5lZ2F0aXZlID0gb3B0aW9ucy5uZWdhdGl2ZTtcbiAgICBsZXQgZm9yY2VTaWduID0gb3B0aW9ucy5mb3JjZVNpZ247XG4gICAgbGV0IGV4cG9uZW50aWFsID0gb3B0aW9ucy5leHBvbmVudGlhbDtcbiAgICBsZXQgcm91bmRpbmdGdW5jdGlvbiA9IG9wdGlvbnMucm91bmRpbmdGdW5jdGlvbjtcblxuICAgIGxldCBhYmJyZXZpYXRpb24gPSBcIlwiO1xuXG4gICAgaWYgKGF2ZXJhZ2UpIHtcbiAgICAgICAgbGV0IGRhdGEgPSBjb21wdXRlQXZlcmFnZSh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGZvcmNlQXZlcmFnZSxcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbnM6IHN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCksXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZDogc3BhY2VTZXBhcmF0ZWQsXG4gICAgICAgICAgICB0b3RhbExlbmd0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YWx1ZSA9IGRhdGEudmFsdWU7XG4gICAgICAgIGFiYnJldmlhdGlvbiArPSBkYXRhLmFiYnJldmlhdGlvbjtcblxuICAgICAgICBpZiAodG90YWxMZW5ndGgpIHtcbiAgICAgICAgICAgIG1hbnRpc3NhUHJlY2lzaW9uID0gZGF0YS5tYW50aXNzYVByZWNpc2lvbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHBvbmVudGlhbCkge1xuICAgICAgICBsZXQgZGF0YSA9IGNvbXB1dGVFeHBvbmVudGlhbCh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhbHVlID0gZGF0YS52YWx1ZTtcbiAgICAgICAgYWJicmV2aWF0aW9uID0gZGF0YS5hYmJyZXZpYXRpb24gKyBhYmJyZXZpYXRpb247XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IHNldE1hbnRpc3NhUHJlY2lzaW9uKHZhbHVlLnRvU3RyaW5nKCksIHZhbHVlLCBvcHRpb25hbE1hbnRpc3NhLCBtYW50aXNzYVByZWNpc2lvbiwgdHJpbU1hbnRpc3NhLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICBvdXRwdXQgPSBzZXRDaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbENoYXJhY3RlcmlzdGljLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbik7XG4gICAgb3V0cHV0ID0gcmVwbGFjZURlbGltaXRlcnMob3V0cHV0LCB2YWx1ZSwgdGhvdXNhbmRTZXBhcmF0ZWQsIHN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yKTtcblxuICAgIGlmIChhdmVyYWdlIHx8IGV4cG9uZW50aWFsKSB7XG4gICAgICAgIG91dHB1dCA9IGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKGZvcmNlU2lnbiB8fCB2YWx1ZSA8IDApIHtcbiAgICAgICAgb3V0cHV0ID0gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJZiBGT1JNQVQgaXMgbm9uLW51bGwgYW5kIG5vdCBqdXN0IGFuIG91dHB1dCwgcmV0dXJuIEZPUk1BVC5cbiAqIFJldHVybiBERUZBVUxURk9STUFUIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZWRGb3JtYXRcbiAqIEBwYXJhbSBkZWZhdWx0Rm9ybWF0XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZGVmYXVsdEZvcm1hdCkge1xuICAgIGlmICghcHJvdmlkZWRGb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwcm92aWRlZEZvcm1hdCk7XG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFwib3V0cHV0XCIpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3ZpZGVkRm9ybWF0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChudW1icm8pID0+ICh7XG4gICAgZm9ybWF0OiAoLi4uYXJncykgPT4gZm9ybWF0KC4uLmFyZ3MsIG51bWJybyksXG4gICAgZ2V0Qnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXRCeXRlVW5pdCguLi5hcmdzLCBudW1icm8pLFxuICAgIGdldEJpbmFyeUJ5dGVVbml0OiAoLi4uYXJncykgPT4gZ2V0QmluYXJ5Qnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBnZXREZWNpbWFsQnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXREZWNpbWFsQnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBmb3JtYXRPckRlZmF1bHRcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGVuVVMgPSByZXF1aXJlKFwiLi9lbi1VU1wiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmxldCBzdGF0ZSA9IHt9O1xuXG5sZXQgY3VycmVudExhbmd1YWdlVGFnID0gdW5kZWZpbmVkO1xubGV0IGxhbmd1YWdlcyA9IHt9O1xuXG5sZXQgemVyb0Zvcm1hdCA9IG51bGw7XG5cbmxldCBnbG9iYWxEZWZhdWx0cyA9IHt9O1xuXG5mdW5jdGlvbiBjaG9vc2VMYW5ndWFnZSh0YWcpIHsgY3VycmVudExhbmd1YWdlVGFnID0gdGFnOyB9XG5cbmZ1bmN0aW9uIGN1cnJlbnRMYW5ndWFnZURhdGEoKSB7IHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlVGFnXTsgfVxuXG4vKipcbiAqIFJldHVybiBhbGwgdGhlIHJlZ2lzdGVyIGxhbmd1YWdlc1xuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5sYW5ndWFnZXMgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBsYW5ndWFnZXMpO1xuXG4vL1xuLy8gQ3VycmVudCBsYW5ndWFnZSBhY2Nlc3NvcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIHRhZ1xuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuc3RhdGUuY3VycmVudExhbmd1YWdlID0gKCkgPT4gY3VycmVudExhbmd1YWdlVGFnO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRDdXJyZW5jeSA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgYWJicmV2aWF0aW9ucyBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLmFiYnJldmlhdGlvbnM7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRlbGltaXRlcnMgZGF0YVxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50RGVsaW1pdGVycyA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5kZWxpbWl0ZXJzO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBvcmRpbmFsIGZ1bmN0aW9uXG4gKlxuICogQHJldHVybiB7ZnVuY3Rpb259XG4gKi9cbnN0YXRlLmN1cnJlbnRPcmRpbmFsID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLm9yZGluYWw7XG5cbi8vXG4vLyBEZWZhdWx0c1xuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgZm9ybWF0dGluZyBkZWZhdWx0cy5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIGdsb2JhbGx5IGRlZmluZWQgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnREZWZhdWx0cyA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5kZWZhdWx0cywgZ2xvYmFsRGVmYXVsdHMpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgb3JkaW5hbCBkZWZhdWx0LWZvcm1hdC5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIG9yZGluYWwgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudE9yZGluYWxEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5vcmRpbmFsRm9ybWF0KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGJ5dGUgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBieXRlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuYnl0ZUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwZXJjZW50YWdlIGRlZmF1bHQtZm9ybWF0LlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgcGVyY2VudGFnZSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50UGVyY2VudGFnZURlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLnBlcmNlbnRhZ2VGb3JtYXQpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVuY3kgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0aW1lIGRlZmF1bHQtZm9ybWF0LlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgY3VycmVuY3kgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudFRpbWVEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS50aW1lRm9ybWF0KTtcblxuLyoqXG4gKiBTZXQgdGhlIGdsb2JhbCBmb3JtYXR0aW5nIGRlZmF1bHRzLlxuICpcbiAqIEBwYXJhbSB7e318c3RyaW5nfSBmb3JtYXQgLSBmb3JtYXR0aW5nIG9wdGlvbnMgdG8gdXNlIGFzIGRlZmF1bHRzXG4gKi9cbnN0YXRlLnNldERlZmF1bHRzID0gKGZvcm1hdCkgPT4ge1xuICAgIGZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQoZm9ybWF0KTtcbiAgICBpZiAodmFsaWRhdGluZy52YWxpZGF0ZUZvcm1hdChmb3JtYXQpKSB7XG4gICAgICAgIGdsb2JhbERlZmF1bHRzID0gZm9ybWF0O1xuICAgIH1cbn07XG5cbi8vXG4vLyBaZXJvIGZvcm1hdFxuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGZvcm1hdCBzdHJpbmcgZm9yIDAuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5zdGF0ZS5nZXRaZXJvRm9ybWF0ID0gKCkgPT4gemVyb0Zvcm1hdDtcblxuLyoqXG4gKiBTZXQgYSBTVFJJTkcgdG8gb3V0cHV0IHdoZW4gdGhlIHZhbHVlIGlzIDAuXG4gKlxuICogQHBhcmFtIHt7fXxzdHJpbmd9IHN0cmluZyAtIHN0cmluZyB0byBzZXRcbiAqL1xuc3RhdGUuc2V0WmVyb0Zvcm1hdCA9IChzdHJpbmcpID0+IHplcm9Gb3JtYXQgPSB0eXBlb2Yoc3RyaW5nKSA9PT0gXCJzdHJpbmdcIiA/IHN0cmluZyA6IG51bGw7XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgYSBmb3JtYXQgZm9yIDAgaGFzIGJlZW4gc2V0IGFscmVhZHkuXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuc3RhdGUuaGFzWmVyb0Zvcm1hdCA9ICgpID0+IHplcm9Gb3JtYXQgIT09IG51bGw7XG5cbi8vXG4vLyBHZXR0ZXJzL1NldHRlcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYW5ndWFnZSBkYXRhIGZvciB0aGUgcHJvdmlkZWQgVEFHLlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRhdGEgaWYgbm8gdGFnIGlzIHByb3ZpZGVkLlxuICpcbiAqIFRocm93IGFuIGVycm9yIGlmIHRoZSB0YWcgZG9lc24ndCBtYXRjaCBhbnkgcmVnaXN0ZXJlZCBsYW5ndWFnZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW3RhZ10gLSBsYW5ndWFnZSB0YWcgb2YgYSByZWdpc3RlcmVkIGxhbmd1YWdlXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUubGFuZ3VhZ2VEYXRhID0gKHRhZykgPT4ge1xuICAgIGlmICh0YWcpIHtcbiAgICAgICAgaWYgKGxhbmd1YWdlc1t0YWddKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW3RhZ107XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRhZyBcIiR7dGFnfVwiYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZURhdGEoKTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIHByb3ZpZGVkIERBVEEgYXMgYSBsYW5ndWFnZSBpZiBhbmQgb25seSBpZiB0aGUgZGF0YSBpcyB2YWxpZC5cbiAqIElmIHRoZSBkYXRhIGlzIG5vdCB2YWxpZCwgYW4gZXJyb3IgaXMgdGhyb3duLlxuICpcbiAqIFdoZW4gVVNFTEFOR1VBR0UgaXMgdHJ1ZSwgdGhlIHJlZ2lzdGVyZWQgbGFuZ3VhZ2UgaXMgdGhlbiB1c2VkLlxuICpcbiAqIEBwYXJhbSB7e319IGRhdGEgLSBsYW5ndWFnZSBkYXRhIHRvIHJlZ2lzdGVyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1c2VMYW5ndWFnZV0gLSBgdHJ1ZWAgaWYgdGhlIHByb3ZpZGVkIGRhdGEgc2hvdWxkIGJlY29tZSB0aGUgY3VycmVudCBsYW5ndWFnZVxuICovXG5zdGF0ZS5yZWdpc3Rlckxhbmd1YWdlID0gKGRhdGEsIHVzZUxhbmd1YWdlID0gZmFsc2UpID0+IHtcbiAgICBpZiAoIXZhbGlkYXRpbmcudmFsaWRhdGVMYW5ndWFnZShkYXRhKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGxhbmd1YWdlIGRhdGFcIik7XG4gICAgfVxuXG4gICAgbGFuZ3VhZ2VzW2RhdGEubGFuZ3VhZ2VUYWddID0gZGF0YTtcblxuICAgIGlmICh1c2VMYW5ndWFnZSkge1xuICAgICAgICBjaG9vc2VMYW5ndWFnZShkYXRhLmxhbmd1YWdlVGFnKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY3VycmVudCBsYW5ndWFnZSBhY2NvcmRpbmcgdG8gVEFHLlxuICogSWYgVEFHIGRvZXNuJ3QgbWF0Y2ggYSByZWdpc3RlcmVkIGxhbmd1YWdlLCBhbm90aGVyIGxhbmd1YWdlIG1hdGNoaW5nXG4gKiB0aGUgXCJsYW5ndWFnZVwiIHBhcnQgb2YgdGhlIHRhZyAoYWNjb3JkaW5nIHRvIEJDUDQ3OiBodHRwczovL3Rvb2xzLmlldGYub3JnL3JmYy9iY3AvYmNwNDcudHh0KS5cbiAqIElmIG5vbmUsIHRoZSBGQUxMQkFDS1RBRyBpcyB1c2VkLiBJZiB0aGUgRkFMTEJBQ0tUQUcgZG9lc24ndCBtYXRjaCBhIHJlZ2lzdGVyIGxhbmd1YWdlLFxuICogYGVuLVVTYCBpcyBmaW5hbGx5IHVzZWQuXG4gKlxuICogQHBhcmFtIHRhZ1xuICogQHBhcmFtIGZhbGxiYWNrVGFnXG4gKi9cbnN0YXRlLnNldExhbmd1YWdlID0gKHRhZywgZmFsbGJhY2tUYWcgPSBlblVTLmxhbmd1YWdlVGFnKSA9PiB7XG4gICAgaWYgKCFsYW5ndWFnZXNbdGFnXSkge1xuICAgICAgICBsZXQgc3VmZml4ID0gdGFnLnNwbGl0KFwiLVwiKVswXTtcblxuICAgICAgICBsZXQgbWF0Y2hpbmdMYW5ndWFnZVRhZyA9IE9iamVjdC5rZXlzKGxhbmd1YWdlcykuZmluZChlYWNoID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlYWNoLnNwbGl0KFwiLVwiKVswXSA9PT0gc3VmZml4O1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWxhbmd1YWdlc1ttYXRjaGluZ0xhbmd1YWdlVGFnXSkge1xuICAgICAgICAgICAgY2hvb3NlTGFuZ3VhZ2UoZmFsbGJhY2tUYWcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hvb3NlTGFuZ3VhZ2UobWF0Y2hpbmdMYW5ndWFnZVRhZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaG9vc2VMYW5ndWFnZSh0YWcpO1xufTtcblxuc3RhdGUucmVnaXN0ZXJMYW5ndWFnZShlblVTKTtcbmN1cnJlbnRMYW5ndWFnZVRhZyA9IGVuVVMubGFuZ3VhZ2VUYWc7XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGU7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBMb2FkIGxhbmd1YWdlcyBtYXRjaGluZyBUQUdTLiBTaWxlbnRseSBwYXNzIG92ZXIgdGhlIGZhaWxpbmcgbG9hZC5cbiAqXG4gKiBXZSBhc3N1bWUgaGVyZSB0aGF0IHdlIGFyZSBpbiBhIG5vZGUgZW52aXJvbm1lbnQsIHNvIHdlIGRvbid0IGNoZWNrIGZvciBpdC5cbiAqIEBwYXJhbSB7W1N0cmluZ119IHRhZ3MgLSBsaXN0IG9mIHRhZ3MgdG8gbG9hZFxuICogQHBhcmFtIHtOdW1icm99IG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKi9cbmZ1bmN0aW9uIGxvYWRMYW5ndWFnZXNJbk5vZGUodGFncywgbnVtYnJvKSB7XG4gICAgdGFncy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgICAgbGV0IGRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkYXRhID0gcmVxdWlyZShgLi4vbGFuZ3VhZ2VzLyR7dGFnfWApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFibGUgdG8gbG9hZCBcIiR7dGFnfVwiLiBObyBtYXRjaGluZyBsYW5ndWFnZSBmaWxlIGZvdW5kLmApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBudW1icm8ucmVnaXN0ZXJMYW5ndWFnZShkYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChudW1icm8pID0+ICh7XG4gICAgbG9hZExhbmd1YWdlc0luTm9kZTogKHRhZ3MpID0+IGxvYWRMYW5ndWFnZXNJbk5vZGUodGFncywgbnVtYnJvKVxufSk7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgQmlnTnVtYmVyID0gcmVxdWlyZShcImJpZ251bWJlci5qc1wiKTtcblxuLyoqXG4gKiBBZGQgYSBudW1iZXIgb3IgYSBudW1icm8gdG8gTi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIGF1Z2VuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIGFkZGVuZFxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBhZGQobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5wbHVzKG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogU3VidHJhY3QgYSBudW1iZXIgb3IgYSBudW1icm8gZnJvbSBOLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbWludWVuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIHN1YnRyYWhlbmRcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gc3VidHJhY3Qobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5taW51cyhvdGhlclZhbHVlKS50b051bWJlcigpO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIE11bHRpcGx5IE4gYnkgYSBudW1iZXIgb3IgYSBudW1icm8uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBtdWx0aXBsaWNhbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBtdWx0aXBsaWVyXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7TnVtYnJvfSBuXG4gKi9cbmZ1bmN0aW9uIG11bHRpcGx5KG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUudGltZXMob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBEaXZpZGUgTiBieSBhIG51bWJlciBvciBhIG51bWJyby5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIGRpdmlkZW5kXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyIC0gZGl2aXNvclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBkaXZpZGUobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5kaXZpZGVkQnkob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBTZXQgTiB0byB0aGUgT1RIRVIgKG9yIHRoZSB2YWx1ZSBvZiBPVEhFUiB3aGVuIGl0J3MgYSBudW1icm8gaW5zdGFuY2UpLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbnVtYnJvIGluc3RhbmNlIHRvIG11dGF0ZVxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIG5ldyB2YWx1ZSB0byBhc3NpZ24gdG8gTlxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBzZXQgKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBvdGhlcjtcblxuICAgIGlmIChudW1icm8uaXNOdW1icm8ob3RoZXIpKSB7XG4gICAgICAgIHZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG4uX3ZhbHVlID0gdmFsdWU7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIE4gYW5kIE9USEVSLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBkaWZmZXJlbmNlKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgY2xvbmUgPSBudW1icm8obi5fdmFsdWUpO1xuICAgIHN1YnRyYWN0KGNsb25lLCBvdGhlciwgbnVtYnJvKTtcblxuICAgIHJldHVybiBNYXRoLmFicyhjbG9uZS5fdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG51bWJybyA9PiAoe1xuICAgIGFkZDogKG4sIG90aGVyKSA9PiBhZGQobiwgb3RoZXIsIG51bWJybyksXG4gICAgc3VidHJhY3Q6IChuLCBvdGhlcikgPT4gc3VidHJhY3Qobiwgb3RoZXIsIG51bWJybyksXG4gICAgbXVsdGlwbHk6IChuLCBvdGhlcikgPT4gbXVsdGlwbHkobiwgb3RoZXIsIG51bWJybyksXG4gICAgZGl2aWRlOiAobiwgb3RoZXIpID0+IGRpdmlkZShuLCBvdGhlciwgbnVtYnJvKSxcbiAgICBzZXQ6IChuLCBvdGhlcikgPT4gc2V0KG4sIG90aGVyLCBudW1icm8pLFxuICAgIGRpZmZlcmVuY2U6IChuLCBvdGhlcikgPT4gZGlmZmVyZW5jZShuLCBvdGhlciwgbnVtYnJvKVxufSk7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgVkVSU0lPTiA9IFwiMi4xLjJcIjtcblxuY29uc3QgZ2xvYmFsU3RhdGUgPSByZXF1aXJlKFwiLi9nbG9iYWxTdGF0ZVwiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRpbmdcIik7XG5jb25zdCBsb2FkZXIgPSByZXF1aXJlKFwiLi9sb2FkaW5nXCIpKG51bWJybyk7XG5jb25zdCB1bmZvcm1hdHRlciA9IHJlcXVpcmUoXCIuL3VuZm9ybWF0dGluZ1wiKTtcbmxldCBmb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi9mb3JtYXR0aW5nXCIpKG51bWJybyk7XG5sZXQgbWFuaXB1bGF0ZSA9IHJlcXVpcmUoXCIuL21hbmlwdWxhdGluZ1wiKShudW1icm8pO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmNsYXNzIE51bWJybyB7XG4gICAgY29uc3RydWN0b3IobnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVtYmVyO1xuICAgIH1cblxuICAgIGNsb25lKCkgeyByZXR1cm4gbnVtYnJvKHRoaXMuX3ZhbHVlKTsgfVxuXG4gICAgZm9ybWF0KGZvcm1hdCA9IHt9KSB7IHJldHVybiBmb3JtYXR0ZXIuZm9ybWF0KHRoaXMsIGZvcm1hdCk7IH1cblxuICAgIGZvcm1hdEN1cnJlbmN5KGZvcm1hdCkge1xuICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZm9ybWF0ID0gcGFyc2luZy5wYXJzZUZvcm1hdChmb3JtYXQpO1xuICAgICAgICB9XG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdHRlci5mb3JtYXRPckRlZmF1bHQoZm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICBmb3JtYXQub3V0cHV0ID0gXCJjdXJyZW5jeVwiO1xuICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIGZvcm1hdFRpbWUoZm9ybWF0ID0ge30pIHtcbiAgICAgICAgZm9ybWF0Lm91dHB1dCA9IFwidGltZVwiO1xuICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIGJpbmFyeUJ5dGVVbml0cygpIHsgcmV0dXJuIGZvcm1hdHRlci5nZXRCaW5hcnlCeXRlVW5pdCh0aGlzKTt9XG5cbiAgICBkZWNpbWFsQnl0ZVVuaXRzKCkgeyByZXR1cm4gZm9ybWF0dGVyLmdldERlY2ltYWxCeXRlVW5pdCh0aGlzKTt9XG5cbiAgICBieXRlVW5pdHMoKSB7IHJldHVybiBmb3JtYXR0ZXIuZ2V0Qnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgZGlmZmVyZW5jZShvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5kaWZmZXJlbmNlKHRoaXMsIG90aGVyKTsgfVxuXG4gICAgYWRkKG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLmFkZCh0aGlzLCBvdGhlcik7IH1cblxuICAgIHN1YnRyYWN0KG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLnN1YnRyYWN0KHRoaXMsIG90aGVyKTsgfVxuXG4gICAgbXVsdGlwbHkob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUubXVsdGlwbHkodGhpcywgb3RoZXIpOyB9XG5cbiAgICBkaXZpZGUob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUuZGl2aWRlKHRoaXMsIG90aGVyKTsgfVxuXG4gICAgc2V0KGlucHV0KSB7IHJldHVybiBtYW5pcHVsYXRlLnNldCh0aGlzLCBub3JtYWxpemVJbnB1dChpbnB1dCkpOyB9XG5cbiAgICB2YWx1ZSgpIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG5cbiAgICB2YWx1ZU9mKCkgeyByZXR1cm4gdGhpcy5fdmFsdWU7IH1cbn1cblxuLyoqXG4gKiBNYWtlIGl0cyBiZXN0IHRvIGNvbnZlcnQgaW5wdXQgaW50byBhIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge251bWJyb3xzdHJpbmd8bnVtYmVyfSBpbnB1dCAtIElucHV0IHRvIGNvbnZlcnRcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplSW5wdXQoaW5wdXQpIHtcbiAgICBsZXQgcmVzdWx0ID0gaW5wdXQ7XG4gICAgaWYgKG51bWJyby5pc051bWJybyhpbnB1dCkpIHtcbiAgICAgICAgcmVzdWx0ID0gaW5wdXQuX3ZhbHVlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJlc3VsdCA9IG51bWJyby51bmZvcm1hdChpbnB1dCk7XG4gICAgfSBlbHNlIGlmIChpc05hTihpbnB1dCkpIHtcbiAgICAgICAgcmVzdWx0ID0gTmFOO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIG51bWJybyhpbnB1dCkge1xuICAgIHJldHVybiBuZXcgTnVtYnJvKG5vcm1hbGl6ZUlucHV0KGlucHV0KSk7XG59XG5cbm51bWJyby52ZXJzaW9uID0gVkVSU0lPTjtcblxubnVtYnJvLmlzTnVtYnJvID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIE51bWJybztcbn07XG5cbi8vXG4vLyBgbnVtYnJvYCBzdGF0aWMgbWV0aG9kc1xuLy9cblxubnVtYnJvLmxhbmd1YWdlID0gZ2xvYmFsU3RhdGUuY3VycmVudExhbmd1YWdlO1xubnVtYnJvLnJlZ2lzdGVyTGFuZ3VhZ2UgPSBnbG9iYWxTdGF0ZS5yZWdpc3Rlckxhbmd1YWdlO1xubnVtYnJvLnNldExhbmd1YWdlID0gZ2xvYmFsU3RhdGUuc2V0TGFuZ3VhZ2U7XG5udW1icm8ubGFuZ3VhZ2VzID0gZ2xvYmFsU3RhdGUubGFuZ3VhZ2VzO1xubnVtYnJvLmxhbmd1YWdlRGF0YSA9IGdsb2JhbFN0YXRlLmxhbmd1YWdlRGF0YTtcbm51bWJyby56ZXJvRm9ybWF0ID0gZ2xvYmFsU3RhdGUuc2V0WmVyb0Zvcm1hdDtcbm51bWJyby5kZWZhdWx0Rm9ybWF0ID0gZ2xvYmFsU3RhdGUuY3VycmVudERlZmF1bHRzO1xubnVtYnJvLnNldERlZmF1bHRzID0gZ2xvYmFsU3RhdGUuc2V0RGVmYXVsdHM7XG5udW1icm8uZGVmYXVsdEN1cnJlbmN5Rm9ybWF0ID0gZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdDtcbm51bWJyby52YWxpZGF0ZSA9IHZhbGlkYXRvci52YWxpZGF0ZTtcbm51bWJyby5sb2FkTGFuZ3VhZ2VzSW5Ob2RlID0gbG9hZGVyLmxvYWRMYW5ndWFnZXNJbk5vZGU7XG5udW1icm8udW5mb3JtYXQgPSB1bmZvcm1hdHRlci51bmZvcm1hdDtcblxubW9kdWxlLmV4cG9ydHMgPSBudW1icm87XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIHByZWZpeC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VQcmVmaXgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL157KFtefV0qKX0vKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnByZWZpeCA9IG1hdGNoWzFdO1xuICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIHBvc3RmaXguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlUG9zdGZpeChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYXRjaCA9IHN0cmluZy5tYXRjaCgveyhbXn1dKil9JC8pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXN1bHQucG9zdGZpeCA9IG1hdGNoWzFdO1xuXG4gICAgICAgIHJldHVybiBzdHJpbmcuc2xpY2UoMCwgLW1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgb3V0cHV0IHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICovXG5mdW5jdGlvbiBwYXJzZU91dHB1dChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIiRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImN1cnJlbmN5XCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIlXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJwZXJjZW50XCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJiZFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwiYnl0ZVwiO1xuICAgICAgICByZXN1bHQuYmFzZSA9IFwiZ2VuZXJhbFwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwiYnl0ZVwiO1xuICAgICAgICByZXN1bHQuYmFzZSA9IFwiYmluYXJ5XCI7XG4gICAgICAgIHJldHVybjtcblxuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcImRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImRlY2ltYWxcIjtcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiOlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwidGltZVwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwib1wiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwib3JkaW5hbFwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgdGhvdXNhbmQgc2VwYXJhdGVkIHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZVRob3VzYW5kU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiLFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LnRob3VzYW5kU2VwYXJhdGVkID0gdHJ1ZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHNwYWNlIHNlcGFyYXRlZCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VTcGFjZVNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIiBcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5zcGFjZVNlcGFyYXRlZCA9IHRydWU7XG4gICAgICAgIHJlc3VsdC5zcGFjZVNlcGFyYXRlZEN1cnJlbmN5ID0gdHJ1ZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHRvdGFsIGxlbmd0aC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VUb3RhbExlbmd0aChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYXRjaCA9IHN0cmluZy5tYXRjaCgvWzEtOV0rWzAtOV0qLyk7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnRvdGFsTGVuZ3RoID0gK21hdGNoWzBdO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgY2hhcmFjdGVyaXN0aWMgbGVuZ3RoLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUNoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IGNoYXJhY3RlcmlzdGljID0gc3RyaW5nLnNwbGl0KFwiLlwiKVswXTtcbiAgICBsZXQgbWF0Y2ggPSBjaGFyYWN0ZXJpc3RpYy5tYXRjaCgvMCsvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LmNoYXJhY3RlcmlzdGljID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgbWFudGlzc2EgbGVuZ3RoLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IG1hbnRpc3NhID0gc3RyaW5nLnNwbGl0KFwiLlwiKVsxXTtcbiAgICBpZiAobWFudGlzc2EpIHtcbiAgICAgICAgbGV0IG1hdGNoID0gbWFudGlzc2EubWF0Y2goLzArLyk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgcmVzdWx0Lm1hbnRpc3NhID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBhdmVyYWdlIHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJhXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuYXZlcmFnZSA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIGEgZm9yY2VkIGF2ZXJhZ2UgcHJlY2lzaW9uLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUZvcmNlQXZlcmFnZShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIktcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcInRob3VzYW5kXCI7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcuaW5kZXhPZihcIk1cIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcIm1pbGxpb25cIjtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5pbmRleE9mKFwiQlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlQXZlcmFnZSA9IFwiYmlsbGlvblwiO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nLmluZGV4T2YoXCJUXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJ0cmlsbGlvblwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBmaW5kaW5nIGlmIHRoZSBtYW50aXNzYSBpcyBvcHRpb25hbC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VPcHRpb25hbE1hbnRpc3NhKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXFxbXFwuXS8pKSB7XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbE1hbnRpc3NhID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5tYXRjaCgvXFwuLykpIHtcbiAgICAgICAgcmVzdWx0Lm9wdGlvbmFsTWFudGlzc2EgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgZmluZGluZyBpZiB0aGUgY2hhcmFjdGVyaXN0aWMgaXMgb3B0aW9uYWwuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlT3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIi5cIikgIT09IC0xKSB7XG4gICAgICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHN0cmluZy5zcGxpdChcIi5cIilbMF07XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbENoYXJhY3RlcmlzdGljID0gY2hhcmFjdGVyaXN0aWMuaW5kZXhPZihcIjBcIikgPT09IC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgbmVnYXRpdmUgZm9ybWF0LiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU5lZ2F0aXZlKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXlxcKz9cXChbXildKlxcKSQvKSkge1xuICAgICAgICByZXN1bHQubmVnYXRpdmUgPSBcInBhcmVudGhlc2lzXCI7XG4gICAgfVxuICAgIGlmIChzdHJpbmcubWF0Y2goL15cXCs/LS8pKSB7XG4gICAgICAgIHJlc3VsdC5uZWdhdGl2ZSA9IFwic2lnblwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBmaW5kaW5nIGlmIHRoZSBzaWduIGlzIG1hbmRhdG9yeS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VGb3JjZVNpZ24oc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLm1hdGNoKC9eXFwrLykpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlU2lnbiA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGFuZCBhY2N1bXVsYXRpbmcgdGhlIHZhbHVlcyBpZSBSRVNVTFQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7TnVtYnJvRm9ybWF0fSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUZvcm1hdChzdHJpbmcsIHJlc3VsdCA9IHt9KSB7XG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9XG5cbiAgICBzdHJpbmcgPSBwYXJzZVByZWZpeChzdHJpbmcsIHJlc3VsdCk7XG4gICAgc3RyaW5nID0gcGFyc2VQb3N0Zml4KHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU91dHB1dChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VUb3RhbExlbmd0aChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VPcHRpb25hbENoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlRm9yY2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU9wdGlvbmFsTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlVGhvdXNhbmRTZXBhcmF0ZWQoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlU3BhY2VTZXBhcmF0ZWQoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlTmVnYXRpdmUoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlRm9yY2VTaWduKHN0cmluZywgcmVzdWx0KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHBhcnNlRm9ybWF0XG59O1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGFsbFN1ZmZpeGVzID0gW1xuICAgIHtrZXk6IFwiWmlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgNyl9LFxuICAgIHtrZXk6IFwiWkJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA3KX0sXG4gICAge2tleTogXCJZaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA4KX0sXG4gICAge2tleTogXCJZQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDgpfSxcbiAgICB7a2V5OiBcIlRpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDQpfSxcbiAgICB7a2V5OiBcIlRCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNCl9LFxuICAgIHtrZXk6IFwiUGlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgNSl9LFxuICAgIHtrZXk6IFwiUEJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA1KX0sXG4gICAge2tleTogXCJNaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCAyKX0sXG4gICAge2tleTogXCJNQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDIpfSxcbiAgICB7a2V5OiBcIktpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDEpfSxcbiAgICB7a2V5OiBcIktCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgMSl9LFxuICAgIHtrZXk6IFwiR2lCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgMyl9LFxuICAgIHtrZXk6IFwiR0JcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCAzKX0sXG4gICAge2tleTogXCJFaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA2KX0sXG4gICAge2tleTogXCJFQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDYpfSxcbiAgICB7a2V5OiBcIkJcIiwgZmFjdG9yOiAxfVxuXTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIFJlZ0V4cCB3aGVyZSBTIGdldCBhbGwgUmVnRXhwIHNwZWNpZmljIGNoYXJhY3RlcnMgZXNjYXBlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcyAtIHN0cmluZyByZXByZXNlbnRpbmcgYSBSZWdFeHBcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKC9bLS9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCBcIlxcXFwkJlwiKTtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBjb21wdXRlIHRoZSB1bmZvcm1hdHRlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEBwYXJhbSB7Kn0gZGVsaW1pdGVycyAtIERlbGltaXRlcnMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVuY3lTeW1ib2xdIC0gc3ltYm9sIHVzZWQgZm9yIGN1cnJlbmN5IHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcmRpbmFsIC0gZnVuY3Rpb24gdXNlZCB0byBnZW5lcmF0ZSBhbiBvcmRpbmFsIG91dCBvZiBhIG51bWJlclxuICogQHBhcmFtIHtzdHJpbmd9IHplcm9Gb3JtYXQgLSBzdHJpbmcgcmVwcmVzZW50aW5nIHplcm9cbiAqIEBwYXJhbSB7Kn0gYWJicmV2aWF0aW9ucyAtIGFiYnJldmlhdGlvbnMgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IGZvcm1hdCAtIGZvcm1hdCB1c2VkIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfVxuICovXG5mdW5jdGlvbiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wgPSBcIlwiLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpIHtcbiAgICBpZiAoIWlzTmFOKCtpbnB1dFN0cmluZykpIHtcbiAgICAgICAgcmV0dXJuICtpbnB1dFN0cmluZztcbiAgICB9XG5cbiAgICBsZXQgc3RyaXBwZWQgPSBcIlwiO1xuICAgIC8vIE5lZ2F0aXZlXG5cbiAgICBsZXQgbmV3SW5wdXQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKC8oXlteKF0qKVxcKCguKilcXCkoW14pXSokKS8sIFwiJDEkMiQzXCIpO1xuXG4gICAgaWYgKG5ld0lucHV0ICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICByZXR1cm4gLTEgKiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShuZXdJbnB1dCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCk7XG4gICAgfVxuXG4gICAgLy8gQnl0ZVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGxTdWZmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgc3VmZml4ID0gYWxsU3VmZml4ZXNbaV07XG4gICAgICAgIHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShzdWZmaXgua2V5LCBcIlwiKTtcblxuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpICogc3VmZml4LmZhY3RvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFBlcmNlbnRcblxuICAgIHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShcIiVcIiwgXCJcIik7XG5cbiAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkgLyAxMDA7XG4gICAgfVxuXG4gICAgLy8gT3JkaW5hbFxuXG4gICAgbGV0IHBvc3NpYmxlT3JkaW5hbFZhbHVlID0gcGFyc2VGbG9hdChpbnB1dFN0cmluZyk7XG5cbiAgICBpZiAoaXNOYU4ocG9zc2libGVPcmRpbmFsVmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbGV0IG9yZGluYWxTdHJpbmcgPSBvcmRpbmFsKHBvc3NpYmxlT3JkaW5hbFZhbHVlKTtcbiAgICBpZiAob3JkaW5hbFN0cmluZyAmJiBvcmRpbmFsU3RyaW5nICE9PSBcIi5cIikgeyAvLyBpZiBvcmRpbmFsIGlzIFwiLlwiIGl0IHdpbGwgYmUgY2F1Z2h0IG5leHQgcm91bmQgaW4gdGhlICtpbnB1dFN0cmluZ1xuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UobmV3IFJlZ0V4cChgJHtlc2NhcGVSZWdFeHAob3JkaW5hbFN0cmluZyl9JGApLCBcIlwiKTtcblxuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQXZlcmFnZVxuXG4gICAgbGV0IGludmVyc2VkQWJicmV2aWF0aW9ucyA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGFiYnJldmlhdGlvbnMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBpbnZlcnNlZEFiYnJldmlhdGlvbnNbYWJicmV2aWF0aW9uc1trZXldXSA9IGtleTtcbiAgICB9KTtcblxuICAgIGxldCBhYmJyZXZpYXRpb25WYWx1ZXMgPSBPYmplY3Qua2V5cyhpbnZlcnNlZEFiYnJldmlhdGlvbnMpLnNvcnQoKS5yZXZlcnNlKCk7XG4gICAgbGV0IG51bWJlck9mQWJicmV2aWF0aW9ucyA9IGFiYnJldmlhdGlvblZhbHVlcy5sZW5ndGg7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mQWJicmV2aWF0aW9uczsgaSsrKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IGFiYnJldmlhdGlvblZhbHVlc1tpXTtcbiAgICAgICAgbGV0IGtleSA9IGludmVyc2VkQWJicmV2aWF0aW9uc1t2YWx1ZV07XG5cbiAgICAgICAgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKHZhbHVlLCBcIlwiKTtcbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgbGV0IGZhY3RvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZGVmYXVsdC1jYXNlXG4gICAgICAgICAgICAgICAgY2FzZSBcInRob3VzYW5kXCI6XG4gICAgICAgICAgICAgICAgICAgIGZhY3RvciA9IE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1pbGxpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDYpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmlsbGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmlsbGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgMTIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkgKiBmYWN0b3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgaW4gb25lIHBhc3MgYWxsIGZvcm1hdHRpbmcgc3ltYm9scy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEBwYXJhbSB7Kn0gZGVsaW1pdGVycyAtIERlbGltaXRlcnMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVuY3lTeW1ib2xdIC0gc3ltYm9sIHVzZWQgZm9yIGN1cnJlbmN5IHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdTeW1ib2xzKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCA9IFwiXCIpIHtcbiAgICAvLyBDdXJyZW5jeVxuXG4gICAgbGV0IHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShjdXJyZW5jeVN5bWJvbCwgXCJcIik7XG5cbiAgICAvLyBUaG91c2FuZCBzZXBhcmF0b3JzXG5cbiAgICBzdHJpcHBlZCA9IHN0cmlwcGVkLnJlcGxhY2UobmV3IFJlZ0V4cChgKFswLTldKSR7ZXNjYXBlUmVnRXhwKGRlbGltaXRlcnMudGhvdXNhbmRzKX0oWzAtOV0pYCwgXCJnXCIpLCBcIiQxJDJcIik7XG5cbiAgICAvLyBEZWNpbWFsXG5cbiAgICBzdHJpcHBlZCA9IHN0cmlwcGVkLnJlcGxhY2UoZGVsaW1pdGVycy5kZWNpbWFsLCBcIi5cIik7XG5cbiAgICByZXR1cm4gc3RyaXBwZWQ7XG59XG5cbi8qKlxuICogVW5mb3JtYXQgYSBudW1icm8tZ2VuZXJhdGVkIHN0cmluZyB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gb3JkaW5hbCAtIGZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgYW4gb3JkaW5hbCBvdXQgb2YgYSBudW1iZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6ZXJvRm9ybWF0IC0gc3RyaW5nIHJlcHJlc2VudGluZyB6ZXJvXG4gKiBAcGFyYW0geyp9IGFiYnJldmlhdGlvbnMgLSBhYmJyZXZpYXRpb25zIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gdW5mb3JtYXRWYWx1ZShpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wgPSBcIlwiLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpIHtcbiAgICBpZiAoaW5wdXRTdHJpbmcgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBaZXJvIEZvcm1hdFxuXG4gICAgaWYgKGlucHV0U3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGxldCB2YWx1ZSA9IHJlbW92ZUZvcm1hdHRpbmdTeW1ib2xzKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCk7XG4gICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHZhbHVlLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgSU5QVVRTVFJJTkcgcmVwcmVzZW50cyBhIHRpbWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIGNoZWNrXG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUaW1lKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzKSB7XG4gICAgbGV0IHNlcGFyYXRvcnMgPSBpbnB1dFN0cmluZy5pbmRleE9mKFwiOlwiKSAmJiBkZWxpbWl0ZXJzLnRob3VzYW5kcyAhPT0gXCI6XCI7XG5cbiAgICBpZiAoIXNlcGFyYXRvcnMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBzZWdtZW50cyA9IGlucHV0U3RyaW5nLnNwbGl0KFwiOlwiKTtcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgaG91cnMgPSArc2VnbWVudHNbMF07XG4gICAgbGV0IG1pbnV0ZXMgPSArc2VnbWVudHNbMV07XG4gICAgbGV0IHNlY29uZHMgPSArc2VnbWVudHNbMl07XG5cbiAgICByZXR1cm4gIWlzTmFOKGhvdXJzKSAmJiAhaXNOYU4obWludXRlcykgJiYgIWlzTmFOKHNlY29uZHMpO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIGEgdGltZSB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHVuZm9ybWF0VGltZShpbnB1dFN0cmluZykge1xuICAgIGxldCBzZWdtZW50cyA9IGlucHV0U3RyaW5nLnNwbGl0KFwiOlwiKTtcblxuICAgIGxldCBob3VycyA9ICtzZWdtZW50c1swXTtcbiAgICBsZXQgbWludXRlcyA9ICtzZWdtZW50c1sxXTtcbiAgICBsZXQgc2Vjb25kcyA9ICtzZWdtZW50c1syXTtcblxuICAgIHJldHVybiBzZWNvbmRzICsgNjAgKiBtaW51dGVzICsgMzYwMCAqIGhvdXJzO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IGZvcm1hdCAtIGZvcm1hdCB1c2VkICB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiB1bmZvcm1hdChpbnB1dFN0cmluZywgZm9ybWF0KSB7XG4gICAgLy8gQXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xuICAgIGNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5cbiAgICBsZXQgZGVsaW1pdGVycyA9IGdsb2JhbFN0YXRlLmN1cnJlbnREZWxpbWl0ZXJzKCk7XG4gICAgbGV0IGN1cnJlbmN5U3ltYm9sID0gZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5KCkuc3ltYm9sO1xuICAgIGxldCBvcmRpbmFsID0gZ2xvYmFsU3RhdGUuY3VycmVudE9yZGluYWwoKTtcbiAgICBsZXQgemVyb0Zvcm1hdCA9IGdsb2JhbFN0YXRlLmdldFplcm9Gb3JtYXQoKTtcbiAgICBsZXQgYWJicmV2aWF0aW9ucyA9IGdsb2JhbFN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCk7XG5cbiAgICBsZXQgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIGlucHV0U3RyaW5nID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGlmIChtYXRjaGVzVGltZShpbnB1dFN0cmluZywgZGVsaW1pdGVycykpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdW5mb3JtYXRUaW1lKGlucHV0U3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gdW5mb3JtYXRWYWx1ZShpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dFN0cmluZyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB2YWx1ZSA9IGlucHV0U3RyaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHVuZm9ybWF0XG59O1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmxldCB1bmZvcm1hdHRlciA9IHJlcXVpcmUoXCIuL3VuZm9ybWF0dGluZ1wiKTtcblxuLy8gU2ltcGxpZmllZCByZWdleHAgc3VwcG9ydGluZyBvbmx5IGBsYW5ndWFnZWAsIGBzY3JpcHRgLCBhbmQgYHJlZ2lvbmBcbmNvbnN0IGJjcDQ3UmVnRXhwID0gL15bYS16XXsyLDN9KC1bYS16QS1aXXs0fSk/KC0oW0EtWl17Mn18WzAtOV17M30pKT8kLztcblxuY29uc3QgdmFsaWRPdXRwdXRWYWx1ZXMgPSBbXG4gICAgXCJjdXJyZW5jeVwiLFxuICAgIFwicGVyY2VudFwiLFxuICAgIFwiYnl0ZVwiLFxuICAgIFwidGltZVwiLFxuICAgIFwib3JkaW5hbFwiLFxuICAgIFwibnVtYmVyXCJcbl07XG5cbmNvbnN0IHZhbGlkRm9yY2VBdmVyYWdlVmFsdWVzID0gW1xuICAgIFwidHJpbGxpb25cIixcbiAgICBcImJpbGxpb25cIixcbiAgICBcIm1pbGxpb25cIixcbiAgICBcInRob3VzYW5kXCJcbl07XG5cbmNvbnN0IHZhbGlkQ3VycmVuY3lQb3NpdGlvbiA9IFtcbiAgICBcInByZWZpeFwiLFxuICAgIFwiaW5maXhcIixcbiAgICBcInBvc3RmaXhcIlxuXTtcblxuY29uc3QgdmFsaWROZWdhdGl2ZVZhbHVlcyA9IFtcbiAgICBcInNpZ25cIixcbiAgICBcInBhcmVudGhlc2lzXCJcbl07XG5cbmNvbnN0IHZhbGlkTWFuZGF0b3J5QWJicmV2aWF0aW9ucyA9IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIHRob3VzYW5kOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIG1pbGxpb246IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgYmlsbGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB0cmlsbGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtYW5kYXRvcnk6IHRydWVcbn07XG5cbmNvbnN0IHZhbGlkQWJicmV2aWF0aW9ucyA9IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIHRob3VzYW5kOiBcInN0cmluZ1wiLFxuICAgICAgICBtaWxsaW9uOiBcInN0cmluZ1wiLFxuICAgICAgICBiaWxsaW9uOiBcInN0cmluZ1wiLFxuICAgICAgICB0cmlsbGlvbjogXCJzdHJpbmdcIlxuICAgIH1cbn07XG5cbmNvbnN0IHZhbGlkQmFzZVZhbHVlcyA9IFtcbiAgICBcImRlY2ltYWxcIixcbiAgICBcImJpbmFyeVwiLFxuICAgIFwiZ2VuZXJhbFwiXG5dO1xuXG5jb25zdCB2YWxpZEZvcm1hdCA9IHtcbiAgICBvdXRwdXQ6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkT3V0cHV0VmFsdWVzXG4gICAgfSxcbiAgICBiYXNlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEJhc2VWYWx1ZXMsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwiYnl0ZVwiLFxuICAgICAgICBtZXNzYWdlOiBcImBiYXNlYCBtdXN0IGJlIHByb3ZpZGVkIG9ubHkgd2hlbiB0aGUgb3V0cHV0IGlzIGBieXRlYFwiLFxuICAgICAgICBtYW5kYXRvcnk6IChmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwiYnl0ZVwiXG4gICAgfSxcbiAgICBjaGFyYWN0ZXJpc3RpYzoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICByZXN0cmljdGlvbjogKG51bWJlcikgPT4gbnVtYmVyID49IDAsXG4gICAgICAgIG1lc3NhZ2U6IFwidmFsdWUgbXVzdCBiZSBwb3NpdGl2ZVwiXG4gICAgfSxcbiAgICBwcmVmaXg6IFwic3RyaW5nXCIsXG4gICAgcG9zdGZpeDogXCJzdHJpbmdcIixcbiAgICBmb3JjZUF2ZXJhZ2U6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkRm9yY2VBdmVyYWdlVmFsdWVzXG4gICAgfSxcbiAgICBhdmVyYWdlOiBcImJvb2xlYW5cIixcbiAgICBjdXJyZW5jeVBvc2l0aW9uOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEN1cnJlbmN5UG9zaXRpb25cbiAgICB9LFxuICAgIGN1cnJlbmN5U3ltYm9sOiBcInN0cmluZ1wiLFxuICAgIHRvdGFsTGVuZ3RoOiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyKSA9PiBudW1iZXIgPj0gMCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbjogKG51bWJlciwgZm9ybWF0KSA9PiAhZm9ybWF0LmV4cG9uZW50aWFsLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiYHRvdGFsTGVuZ3RoYCBpcyBpbmNvbXBhdGlibGUgd2l0aCBgZXhwb25lbnRpYWxgXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAgbWFudGlzc2E6IHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIpID0+IG51bWJlciA+PSAwLFxuICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgIH0sXG4gICAgb3B0aW9uYWxNYW50aXNzYTogXCJib29sZWFuXCIsXG4gICAgdHJpbU1hbnRpc3NhOiBcImJvb2xlYW5cIixcbiAgICByb3VuZGluZ0Z1bmN0aW9uOiBcImZ1bmN0aW9uXCIsXG4gICAgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYzogXCJib29sZWFuXCIsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZEN1cnJlbmN5OiBcImJvb2xlYW5cIixcbiAgICBhYmJyZXZpYXRpb25zOiB2YWxpZEFiYnJldmlhdGlvbnMsXG4gICAgbmVnYXRpdmU6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkTmVnYXRpdmVWYWx1ZXNcbiAgICB9LFxuICAgIGZvcmNlU2lnbjogXCJib29sZWFuXCIsXG4gICAgZXhwb25lbnRpYWw6IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICB9LFxuICAgIHByZWZpeFN5bWJvbDoge1xuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIsIGZvcm1hdCkgPT4gZm9ybWF0Lm91dHB1dCA9PT0gXCJwZXJjZW50XCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiYHByZWZpeFN5bWJvbGAgY2FuIGJlIHByb3ZpZGVkIG9ubHkgd2hlbiB0aGUgb3V0cHV0IGlzIGBwZXJjZW50YFwiXG4gICAgfVxufTtcblxuY29uc3QgdmFsaWRMYW5ndWFnZSA9IHtcbiAgICBsYW5ndWFnZVRhZzoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICBtYW5kYXRvcnk6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAodGFnKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGFnLm1hdGNoKGJjcDQ3UmVnRXhwKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZTogXCJ0aGUgbGFuZ3VhZ2UgdGFnIG11c3QgZm9sbG93IHRoZSBCQ1AgNDcgc3BlY2lmaWNhdGlvbiAoc2VlIGh0dHBzOi8vdG9vbHMuaWVmdC5vcmcvaHRtbC9iY3A0NylcIlxuICAgIH0sXG4gICAgZGVsaW1pdGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgdGhvdXNhbmRzOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVjaW1hbDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIHRob3VzYW5kc1NpemU6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBhYmJyZXZpYXRpb25zOiB2YWxpZE1hbmRhdG9yeUFiYnJldmlhdGlvbnMsXG4gICAgc3BhY2VTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIHNwYWNlU2VwYXJhdGVkQ3VycmVuY3k6IFwiYm9vbGVhblwiLFxuICAgIG9yZGluYWw6IHtcbiAgICAgICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICB9LFxuICAgIGN1cnJlbmN5OiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICBzeW1ib2w6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGNvZGU6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBkZWZhdWx0czogXCJmb3JtYXRcIixcbiAgICBvcmRpbmFsRm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIGJ5dGVGb3JtYXQ6IFwiZm9ybWF0XCIsXG4gICAgcGVyY2VudGFnZUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICBjdXJyZW5jeUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICB0aW1lRGVmYXVsdHM6IFwiZm9ybWF0XCIsXG4gICAgZm9ybWF0czoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgZm91ckRpZ2l0czoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsczoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsc05vQ3VycmVuY3k6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZvcm1hdFwiLFxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bGxXaXRoTm9EZWNpbWFsczoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIENoZWNrIHRoZSB2YWxpZGl0eSBvZiB0aGUgcHJvdmlkZWQgaW5wdXQgYW5kIGZvcm1hdC5cbiAqIFRoZSBjaGVjayBpcyBOT1QgbGF6eS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8TnVtYnJvfSBpbnB1dCAtIGlucHV0IHRvIGNoZWNrXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIHdoZW4gZXZlcnl0aGluZyBpcyBjb3JyZWN0XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlKGlucHV0LCBmb3JtYXQpIHtcbiAgICBsZXQgdmFsaWRJbnB1dCA9IHZhbGlkYXRlSW5wdXQoaW5wdXQpO1xuICAgIGxldCBpc0Zvcm1hdFZhbGlkID0gdmFsaWRhdGVGb3JtYXQoZm9ybWF0KTtcblxuICAgIHJldHVybiB2YWxpZElucHV0ICYmIGlzRm9ybWF0VmFsaWQ7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBudW1icm8gaW5wdXQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfE51bWJyb30gaW5wdXQgLSBpbnB1dCB0byBjaGVja1xuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSB3aGVuIGV2ZXJ5dGhpbmcgaXMgY29ycmVjdFxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUlucHV0KGlucHV0KSB7XG4gICAgbGV0IHZhbHVlID0gdW5mb3JtYXR0ZXIudW5mb3JtYXQoaW5wdXQpO1xuXG4gICAgcmV0dXJuICEhdmFsdWU7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBwcm92aWRlZCBmb3JtYXQgVE9WQUxJREFURSBhZ2FpbnN0IFNQRUMuXG4gKlxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHRvVmFsaWRhdGUgLSBmb3JtYXQgdG8gY2hlY2tcbiAqIEBwYXJhbSB7Kn0gc3BlYyAtIHNwZWNpZmljYXRpb24gYWdhaW5zdCB3aGljaCB0byBjaGVja1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIHByZWZpeCB1c2UgZm9yIGVycm9yIG1lc3NhZ2VzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBNYW5kYXRvcnlDaGVjayAtIGB0cnVlYCB3aGVuIHRoZSBjaGVjayBmb3IgbWFuZGF0b3J5IGtleSBtdXN0IGJlIHNraXBwZWRcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgd2hlbiBldmVyeXRoaW5nIGlzIGNvcnJlY3RcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTcGVjKHRvVmFsaWRhdGUsIHNwZWMsIHByZWZpeCwgc2tpcE1hbmRhdG9yeUNoZWNrID0gZmFsc2UpIHtcbiAgICBsZXQgcmVzdWx0cyA9IE9iamVjdC5rZXlzKHRvVmFsaWRhdGUpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICghc3BlY1trZXldKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gSW52YWxpZCBrZXk6ICR7a2V5fWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB2YWx1ZSA9IHRvVmFsaWRhdGVba2V5XTtcbiAgICAgICAgbGV0IGRhdGEgPSBzcGVjW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBkYXRhID0ge3R5cGU6IGRhdGF9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gXCJmb3JtYXRcIikgeyAvLyBhbGwgZm9ybWF0cyBhcmUgcGFydGlhbCAoYS5rLmEgd2lsbCBiZSBtZXJnZWQgd2l0aCBzb21lIGRlZmF1bHQgdmFsdWVzKSB0aHVzIG5vIG5lZWQgdG8gY2hlY2sgbWFuZGF0b3J5IHZhbHVlc1xuICAgICAgICAgICAgbGV0IHZhbGlkID0gdmFsaWRhdGVTcGVjKHZhbHVlLCB2YWxpZEZvcm1hdCwgYFtWYWxpZGF0ZSAke2tleX1dYCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICghdmFsaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gdHlwZSBtaXNtYXRjaGVkOiBcIiR7ZGF0YS50eXBlfVwiIGV4cGVjdGVkLCBcIiR7dHlwZW9mIHZhbHVlfVwiIHByb3ZpZGVkYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucmVzdHJpY3Rpb25zICYmIGRhdGEucmVzdHJpY3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgbGV0IGxlbmd0aCA9IGRhdGEucmVzdHJpY3Rpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQge3Jlc3RyaWN0aW9uLCBtZXNzYWdlfSA9IGRhdGEucmVzdHJpY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmICghcmVzdHJpY3Rpb24odmFsdWUsIHRvVmFsaWRhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gaW52YWxpZCB2YWx1ZTogJHttZXNzYWdlfWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnJlc3RyaWN0aW9uICYmICFkYXRhLnJlc3RyaWN0aW9uKHZhbHVlLCB0b1ZhbGlkYXRlKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiAke2RhdGEubWVzc2FnZX1gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS52YWxpZFZhbHVlcyAmJiBkYXRhLnZhbGlkVmFsdWVzLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiBtdXN0IGJlIGFtb25nICR7SlNPTi5zdHJpbmdpZnkoZGF0YS52YWxpZFZhbHVlcyl9LCBcIiR7dmFsdWV9XCIgcHJvdmlkZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgICAgICAgICAgbGV0IHZhbGlkID0gdmFsaWRhdGVTcGVjKHZhbHVlLCBkYXRhLmNoaWxkcmVuLCBgW1ZhbGlkYXRlICR7a2V5fV1gKTtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgaWYgKCFza2lwTWFuZGF0b3J5Q2hlY2spIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKC4uLk9iamVjdC5rZXlzKHNwZWMpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgZGF0YSA9IHNwZWNba2V5XTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGRhdGEgPSB7dHlwZTogZGF0YX07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkYXRhLm1hbmRhdG9yeSkge1xuICAgICAgICAgICAgICAgIGxldCBtYW5kYXRvcnkgPSBkYXRhLm1hbmRhdG9yeTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hbmRhdG9yeSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hbmRhdG9yeSA9IG1hbmRhdG9yeSh0b1ZhbGlkYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobWFuZGF0b3J5ICYmIHRvVmFsaWRhdGVba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSBNaXNzaW5nIG1hbmRhdG9yeSBrZXkgXCIke2tleX1cImApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cy5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4ge1xuICAgICAgICByZXR1cm4gYWNjICYmIGN1cnJlbnQ7XG4gICAgfSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHByb3ZpZGVkIEZPUk1BVC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpIHtcbiAgICByZXR1cm4gdmFsaWRhdGVTcGVjKGZvcm1hdCwgdmFsaWRGb3JtYXQsIFwiW1ZhbGlkYXRlIGZvcm1hdF1cIik7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHByb3ZpZGVkIExBTkdVQUdFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvTGFuZ3VhZ2V9IGxhbmd1YWdlIC0gbGFuZ3VhZ2UgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgICByZXR1cm4gdmFsaWRhdGVTcGVjKGxhbmd1YWdlLCB2YWxpZExhbmd1YWdlLCBcIltWYWxpZGF0ZSBsYW5ndWFnZV1cIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHZhbGlkYXRlLFxuICAgIHZhbGlkYXRlRm9ybWF0LFxuICAgIHZhbGlkYXRlSW5wdXQsXG4gICAgdmFsaWRhdGVMYW5ndWFnZVxufTtcbiJdfQ==
