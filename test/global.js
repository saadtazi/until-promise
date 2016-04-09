import sinon from 'sinon';

beforeEach(function () {
  global.sandbox = sinon.sandbox.create();
});

afterEach(function () {
  global.sandbox.restore();
});
