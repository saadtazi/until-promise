const defaultOptions = {
  wait: 0,
  captureResults: 0,
  Promise,
  onError({ errorType, reject, nbAttempts, startedAt, capturedResults }, options) {
    let err = new Error(`condition not satified after ${Date.now() - startedAt}ms / nbAttempts: ${nbAttempts}`);
    err.duration = Date.now() - startedAt;
    Object.assign(err, { nbAttempts, errorType, startedAt, capturedResults, options });
    reject(err);
  }
};

let modifiedOptions = { ...defaultOptions };

// setTimeout, the Promise way...
const delay = (duration) =>
  new modifiedOptions.Promise((resolve) =>
    setTimeout(() => resolve(), duration)
);

const pollUntil = (func, conditionFunction, options = {}) => {
  const { Promise, wait, duration, retries, onError, captureResults = 0 } = { ...modifiedOptions, ...options };
  let nbAttempts = 0;
  const startedAt = Date.now();
  let alreadyFailed = false;

  const hasTriedEnough = () => {
    if (retries) { return nbAttempts >= retries; }
    return false;
  };
  return new Promise((resolve, reject) => {
    // to fail "exactly" after `duration`,
    // we have to reject in a `setInterval()`
    let timeout;
    let capturedResults = [];

    if (duration) {
      timeout = setTimeout(() => {
        if (!alreadyFailed) {
          alreadyFailed = true;
          return onError({ errorType: 'duration', reject, nbAttempts, startedAt, capturedResults }, options);
        }
      }, duration);
    }

    // define a recursive function that gets executed
    // until timeout or `X` times or the condition is satisfied
    const executeAndCheckCondition = () => {
      nbAttempts++;
      // just in case `func` does not return a promise...
      return Promise.resolve(func())
        .then((res) => {
          if (captureResults) {
            capturedResults = [...capturedResults.slice(1 - captureResults), res];
          }
          if (conditionFunction(res)) {
            // success
            if (timeout) { clearTimeout(timeout); }
            return resolve(res);
          }
          if (hasTriedEnough()) {
            alreadyFailed = true;
            return onError({ errorType: 'retries', reject, nbAttempts, startedAt, capturedResults }, options);
          }
          delay(wait).then(() => {
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

export function setup(options = {}) {
  modifiedOptions = { ...modifiedOptions, ...options };
  return modifiedOptions;
}

export function reset() {
  modifiedOptions = { ...defaultOptions };
  return modifiedOptions;
}

export default pollUntil;
