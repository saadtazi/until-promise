let Prom = Promise;

// setTimeout, the Promise way...
const delay = (duration) =>
  new Prom((resolve) =>
    setTimeout(() => resolve(), duration)
  );

function buildResultsMessage(results) {
  return `Returned value were: ${results}`;
}

const pollUntil = (func, conditionFunction, { wait = 0, duration, retries } = {}) => {
  let nbAttempts = 0;
  const startedAt = Date.now();
  let alreadyFailed = false;
  const receivedResults = [];

  const hasExpired = () =>
    duration && (startedAt + duration < Date.now());

  const hasTriedEnough = () => {
    if (retries) { return nbAttempts >= retries; }
    return false;
  };

  return new Prom((resolve, reject) => {
    // to fail "exactly" after `duration`,
    // we have to reject in a `setInterval()`
    let timeout;

    const fail = (msg) => {
      if (alreadyFailed) { return; }
      alreadyFailed = true;
      // time it took to fail
      // mostly for testing and validation
      let err = new Error(msg);
      err.duration = Date.now() - startedAt;
      err.nbAttempts = nbAttempts;

      reject(err);
    };

    if (duration) {
      timeout = setTimeout(() => {
        if (!alreadyFailed) {
          fail(`condition not satified after ${Date.now() - startedAt}ms. \
${buildResultsMessage(receivedResults)}`);
        }
      }, duration);
    }

    // define a recursive function that gets executed
    // until timeout or `X` times or the condition is satisfied
    const executeAndCheckCondition = () => {
      nbAttempts++;

      // just in case `func` does not return a promise...
      return Prom.resolve(func())
        .then((res) => {
          receivedResults.push(res);

          if (conditionFunction(res)) {
            // success
            if (timeout) { clearTimeout(timeout); }
            return resolve(res);
          }

          if (hasTriedEnough()) {
            return fail(`condition not satified after ${retries} attempts. \
${buildResultsMessage(receivedResults)}`);
          }
          delay(wait).then(() => {
            if (!alreadyFailed) {
              // there is no guarantee that setTimeout() will run
              // when it is suppose to run... So we make sure...
              if (hasExpired()) {
                return fail(`condition not satified after \
${Date.now() - startedAt}ms. ${buildResultsMessage(receivedResults)}`);
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

export function setup({ promise = Promise } = {}) {
  Prom = promise;
}

export default pollUntil;
