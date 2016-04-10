(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
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
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.setup = setup;
  var Prom = Promise;

  var delay = function delay(duration) {
    return new Prom(function (resolve) {
      return setTimeout(function () {
        return resolve();
      }, duration);
    });
  };

  var pollUntil = function pollUntil(func, conditionFunction) {
    var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var _ref$wait = _ref.wait;
    var wait = _ref$wait === undefined ? 0 : _ref$wait;
    var duration = _ref.duration;
    var retries = _ref.retries;

    var nbAttempts = 0;
    var startedAt = Date.now();

    var hasExpired = function hasExpired() {
      return duration && startedAt + duration < Date.now() - wait;
    };

    var hasTriedEnough = function hasTriedEnough() {
      if (retries) {
        return nbAttempts >= retries;
      }
      return false;
    };

    return new Prom(function (resolve, reject) {
      // to fail "exactly" after `duration`,
      // we have to reject in a `setInterval()`
      var interval = void 0;

      var fail = function fail(err) {
        if (interval) {
          clearInterval(interval);
        }
        reject(err);
      };

      if (duration) {
        interval = setInterval(function () {
          if (hasExpired()) {
            fail(new Error("condition not satified after " + (Date.now() - startedAt) + "ms"));
          }
        }, wait);
      }

      // define a recursive function that gets executed
      // until timeout or the condition is satisfied
      var executeAndCheckCondition = function executeAndCheckCondition() {
        nbAttempts++;
        // just in case `func` does not return a promise...
        return Prom.resolve(func()).then(function (res) {
          if (conditionFunction(res)) {
            // success
            if (interval) {
              clearInterval(interval);
            }
            return resolve(res);
          }
          if (hasTriedEnough()) {
            // we already `reject()` in `setInterval()`
            return fail(new Error("condition not satified after " + retries + " attempts"));
          }
          // no need to execute another time if wait
          // no timeout and not satisfied? retry after `wait`ms
          delay(wait).then(function () {
            if (hasExpired()) {
              return fail(new Error("condition not satified after " + (Date.now() - startedAt) + "ms"));
            }
            executeAndCheckCondition();
          });
        });
      };
      // execute the recursive function
      executeAndCheckCondition();
    });
  };

  function setup() {
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2$promise = _ref2.promise;
    var promise = _ref2$promise === undefined ? Promise : _ref2$promise;

    Prom = promise;
  }

  exports.default = pollUntil;
});