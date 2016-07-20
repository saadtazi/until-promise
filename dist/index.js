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

  // setTimeout, the Promise way...
  var delay = function delay(duration) {
    return new Prom(function (resolve) {
      return setTimeout(function () {
        return resolve();
      }, duration);
    });
  };

  function buildResultsMessage(results) {
    return "Returned value were: " + results;
  }

  var pollUntil = function pollUntil(func, conditionFunction) {
    var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var _ref$wait = _ref.wait;
    var wait = _ref$wait === undefined ? 0 : _ref$wait;
    var duration = _ref.duration;
    var retries = _ref.retries;

    var nbAttempts = 0;
    var startedAt = Date.now();
    var alreadyFailed = false;

    var hasExpired = function hasExpired() {
      return duration && startedAt + duration < Date.now();
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
      var timeout = void 0;

      var fail = function fail(msg) {
        if (alreadyFailed) {
          return;
        }
        alreadyFailed = true;
        // time it took to fail
        // mostly for testing and validation
        var err = new Error(msg);
        err.duration = Date.now() - startedAt;
        err.nbAttempts = nbAttempts;

        reject(err);
      };

      if (duration) {
        timeout = setTimeout(function () {
          if (!alreadyFailed) {
            fail("condition not satified after " + (Date.now() - startedAt) + "ms");
          }
        }, duration);
      }

      // define a recursive function that gets executed
      // until timeout or `X` times or the condition is satisfied
      var executeAndCheckCondition = function executeAndCheckCondition() {
        nbAttempts++;
        var receivedResults = [];

        // just in case `func` does not return a promise...
        return Prom.resolve(func()).then(function (res) {
          receivedResults.push(res);

          if (conditionFunction(res)) {
            // success
            if (timeout) {
              clearTimeout(timeout);
            }
            return resolve(res);
          }

          if (hasTriedEnough()) {
            return fail("condition not satified after " + retries + " attempts. " + buildResultsMessage(receivedResults));
          }
          delay(wait).then(function () {
            if (!alreadyFailed) {
              // there is no guarantee that setTimeout() will run
              // when it is suppose to run... So we make sure...
              if (hasExpired()) {
                return fail("condition not satified after " + (Date.now() - startedAt) + "ms. " + buildResultsMessage(receivedResults));
              }
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
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2$promise = _ref2.promise;
    var promise = _ref2$promise === undefined ? Promise : _ref2$promise;

    Prom = promise;
  }

  exports.default = pollUntil;
});