var uutest = require('../lib/index');

var suite = new uutest.Suite();

suite.test("add a test", function(assert) {
  var _suite = new uutest.Suite();

  _suite.test("foo", function(){});

  assert.equal(_suite.tests.length, 1);
  assert.pass();
});

suite.test("suite events", function(assert) {
  var _suite = new uutest.Suite();
  var counter = 3;

  _suite.test("pass", function(a) {
    a.pass();
  });
  _suite.test("fail", function(a) {
    a.fail(new Error("failed!"));
  });

  _suite.on('pass', _check)
  _suite.on('fail', _check)
  _suite.on('done', _check)

  function _check() {
    if (--counter) return;
    assert.pass();
  }

  _suite.run();
});

suite.register(module);