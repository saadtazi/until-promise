A library that executes a function until its returned value satisfies some criteria.

[![Dependency Status](https://david-dm.org/saadtazi/until-promise.svg)](https://david-dm.org/saadtazi/until-promise) [![Coverage Status](https://coveralls.io/repos/github/saadtazi/until-promise/badge.svg?branch=master)](https://coveralls.io/github/saadtazi/until-promise?branch=master) [![Build Status](https://travis-ci.org/saadtazi/until-promise.svg)](https://travis-ci.org/saadtazi/until-promise)

# until-promise

```
until(aFunction, aConditionFunction, someOptions).then(...);
```

Supports 3 modes:
* *infinite*: (no `duration` or `retries` option)
* `retries` option (`retries` option): the
* `duration` option:

In theory (...and in practice), you can combine `retries` and `duration` options.

To throttle the calls, you can pass `wait` option. The first call is done immediately. Then, if the condition is not satisfied, it waits `wait`ms before executing the function a second time (...and so on...)

# Usage

```js
import until from 'until-promise';

until(
  // a function that takes no param
  // can return any value... such as a Promise..
  // `.bind(...)` as much a you want!
  () => { return aValue; },
  // a function that will be called with the returned/resolved value of the first function
  // and that should return true if the condition is satisfied
  (res) => { return res.prop === 'expectedValue'; },
  // optional options:
  {
    // * wait: number of milliseconds between 2 function calls
    wait: 500,
    // * duration: the maximum number of milliseconds before rejecting
    duration: 2000
    // * retries: maximum number of retries before rejecting
    retries: 3
  }
).then(() => {
  // do what you have to do
});
```

# Setup

This library also expose a `setup({ promise })` function that allows to:
* specify a Promise library like `bluebird` if needed (defaults to `Promise` which is available in nodejs and most [modern browser](http://caniuse.com/#search=promise))

*Gotcha*
* When used with `duration` option, we cannot guarantee that it will take exactly or a most `duration`ms, not only because of [the nature of Javascript time](http://ejohn.org/blog/accuracy-of-javascript-time/). [Additional info here](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout#Notes).

If the condition is never satisfied and `duration` is not a multiple of `wait`,
then the returned promise might fail after `Math.ceil(failAfter / wait) * wait` ( which is `> failAfter`)


This will resolve after ~600ms:
```js
let a = 1;
setTimeout(() => { a = 2; }, 500);
return until(
  function () { return Promise.resolve(a); },
  (res) => res === 2,
  { wait: 200, duration: 1000 }
);
```

This is rejected after ~1000ms, even if `duration` is `900`:
```js
let a = 1;
setTimeout(() => { a = 2; }, 5000);
return until(
  function () { return Promise.resolve(a); },
  (res) => res === 2,
  { wait: 200, duration: 900 }

);
```

## Custom Promise Library

### Note

> This library has **no** dependencies on bluebird. Just a `dev dependency` so I can test `setup({ promise })` function.

If you want to use a custom Promise library (to benefit
from some extra chaining methods exposed by this library for example...),
use can use `setup({ promise: customPromiseLibrary});`

Here is an example with [`bluebird`](http://bluebirdjs.com/docs/getting-started.html):

```
import until, {setup as untilSetup } from 'until-promise';
import bluebird as bluebird;

untilSetup({promise: bluebird});

return until(doSomething, conditionFunction)
  // `map` is available with bluebird, not with regular Promise
  .map(() => {...} );
```

Note that this should be done only once: any call to `setup()` from a module will affect another module that also import `until-promise` in the same process.

**FYI:** instead of using `setup()`, you can also wrap the `until()` call into a `promiseLib.resolve()`, like this:

```
return Bluebird.resolve(until(doSomething, conditionFunction)
  .map(() => {...} );
```

## Dev Tips

### release new version

You got a green build for a branch, you merged that branch in master, master is clean... So:
* `npm version [major|minor|patch]`
