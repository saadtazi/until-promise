(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.index = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.setup = setup;
  exports.reset = reset;

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  var defaultOptions = {
    wait: 0,
    captureResults: 0,
    Promise: Promise,
    onError: function onError(_ref, options) {
      var errorType = _ref.errorType;
      var reject = _ref.reject;
      var nbAttempts = _ref.nbAttempts;
      var startedAt = _ref.startedAt;
      var capturedResults = _ref.capturedResults;

      var err = new Error('condition not satified after ' + (Date.now() - startedAt) + 'ms / nbAttempts: ' + nbAttempts);
      err.duration = Date.now() - startedAt;
      Object.assign(err, { nbAttempts: nbAttempts, errorType: errorType, startedAt: startedAt, capturedResults: capturedResults, options: options });
      reject(err);
    }
  };

  var modifiedOptions = _extends({}, defaultOptions);

  // setTimeout, the Promise way...
  var delay = function delay(duration) {
    return new modifiedOptions.Promise(function (resolve) {
      return setTimeout(function () {
        return resolve();
      }, duration);
    });
  };

  var pollUntil = function pollUntil(func, conditionFunction) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var _modifiedOptions$opti = _extends({}, modifiedOptions, options);

    var Promise = _modifiedOptions$opti.Promise;
    var wait = _modifiedOptions$opti.wait;
    var duration = _modifiedOptions$opti.duration;
    var retries = _modifiedOptions$opti.retries;
    var onError = _modifiedOptions$opti.onError;
    var _modifiedOptions$opti2 = _modifiedOptions$opti.captureResults;
    var captureResults = _modifiedOptions$opti2 === undefined ? 0 : _modifiedOptions$opti2;

    var nbAttempts = 0;
    var startedAt = Date.now();
    var alreadyFailed = false;

    var hasTriedEnough = function hasTriedEnough() {
      if (retries) {
        return nbAttempts >= retries;
      }
      return false;
    };
    return new Promise(function (resolve, reject) {
      // to fail "exactly" after `duration`,
      // we have to reject in a `setInterval()`
      var timeout = void 0;
      var capturedResults = [];

      if (duration) {
        timeout = setTimeout(function () {
          if (!alreadyFailed) {
            alreadyFailed = true;
            return onError({ errorType: 'duration', reject: reject, nbAttempts: nbAttempts, startedAt: startedAt, capturedResults: capturedResults }, options);
          }
        }, duration);
      }

      // define a recursive function that gets executed
      // until timeout or `X` times or the condition is satisfied
      var executeAndCheckCondition = function executeAndCheckCondition() {
        nbAttempts++;
        // just in case `func` does not return a promise...
        return Promise.resolve(func()).then(function (res) {
          if (captureResults) {
            capturedResults = [].concat(_toConsumableArray(capturedResults.slice(1 - captureResults)), [res]);
          }
          if (conditionFunction(res)) {
            // success
            if (timeout) {
              clearTimeout(timeout);
            }
            return resolve(res);
          }
          if (hasTriedEnough()) {
            alreadyFailed = true;
            return onError({ errorType: 'retries', reject: reject, nbAttempts: nbAttempts, startedAt: startedAt, capturedResults: capturedResults }, options);
          }
          delay(wait).then(function () {
            if (!alreadyFailed) {
              executeAndCheckCondition();
            }
          });
        });
      };
      // execute the recursive function
      executeAndCheckCondition();
    });
  };

  function setup() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    modifiedOptions = _extends({}, modifiedOptions, options);
    return modifiedOptions;
  }

  function reset() {
    modifiedOptions = _extends({}, defaultOptions);
    return modifiedOptions;
  }

  exports.default = pollUntil;
});