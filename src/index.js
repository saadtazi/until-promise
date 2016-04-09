let Prom = Promise;

const delay = (duration) =>
  new Prom((resolve) =>
    setTimeout(() => resolve(), duration)
  );

const pollUntil = (func, conditionFunction, { wait = 0, duration, retries } = {}) => {
  let nbAttempts = 0;
  const startedAt = Date.now();

  const hasExpired = () =>
    duration && (startedAt + duration < Date.now() - wait);

  const hasTriedEnough = () => {
    if (retries) { return nbAttempts >= retries; }
    return false;
  };

  return new Prom((resolve, reject) => {
    // to fail "exactly" after `duration`,
    // we have to reject in a `setInterval()`
    let interval;

    const fail = (err) => {
      if (interval) {
        clearInterval(interval);
      }
      reject(err);
    };

    if (duration) {
      interval = setInterval(() => {
        if (hasExpired()) {
          fail(new Error(`condition not satified after ${Date.now() - startedAt}ms`));
        }
      }, wait);
    }

    // define a recursive function that gets executed
    // until timeout or the condition is satisfied
    const executeAndCheckCondition = () => {
      nbAttempts++;
      // just in case `func` does not return a promise...
      return Prom.resolve(func())
        .then((res) => {
          if (conditionFunction(res)) {
            // success
            if (interval) { clearInterval(interval); }
            return resolve(res);
          }
          if (hasTriedEnough()) {
            // we already `reject()` in `setInterval()`
            return fail(new Error(`condition not satified after ${retries} attempts`));
          }
          // no need to execute another time if wait
          // no timeout and not satisfied? retry after `wait`ms
          delay(wait).then(() => {
            if (hasExpired()) {
              return fail(new Error(`condition not satified after ${Date.now() - startedAt}ms`));
            }
            executeAndCheckCondition();
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
