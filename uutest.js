//
// uutest - Async Unit Testing v0.3.0
// http://github.com/akdubya/uutest
//
// Copyright (c) 2010, Aleksander Williams
// Released under the MIT License.
//

(function(uutest){

var runner;

function Assert(unit) {
  this.unit = unit;
}

Assert.prototype.ok = function(actual) {
  this.equal(actual, true);
};

Assert.prototype.equal = function(actual, expected) {
  if (actual === expected) return;
  throw wrapAssertionError(new Error(), actual, expected, "does not equal");
};

Assert.prototype.notEqual = function(actual, expected) {
  if (actual !== expected) return;
  throw wrapAssertionError(new Error(), actual, expected, "equals");
};

Assert.prototype.match = function(actual, expected) {
  if (expected.test(actual)) return;
  throw wrapAssertionError(new Error(), actual, expected, "does not match");
};

Assert.prototype.ifError = function(err) {
  if (err) throw err;
};

Assert.prototype.trap = function(block) {
  var unit = this.unit;
  return function() {
    try {
      block.apply(this, Array.prototype.slice.call(arguments));
    } catch(err) {
      unit.fail(err);
    }
  }
};

Assert.prototype.trapError = function() {
  var unit = this.unit;
  return function(err) {
    if (err) unit.fail(err);
  };
};

Assert.prototype.pass = function() {
  this.unit.pass();
};

Assert.prototype.fail = function(err) {
  this.unit.fail(err);
};

uutest.Assert = Assert;

function Test(id, test, timeout, callback, teardown) {
  this.id = id;
  this.test = test;
  this.callback = callback;
  this.timeout = timeout;
  this.teardown = teardown;
  this.assert = new Assert(this);
}

Test.prototype.run = function() {
  var self = this;
  self.tmp = {};
  self.timer = setTimeout(function() {
    self.fail(new Error("TimeoutError"));
  }, self.timeout);
  try {
    self.test.call(self, self.assert);
  } catch(err) {
    self.fail(err);
  }
};

Test.prototype.pass = function() {
  clearTimeout(this.timer);
  if (this.teardown) {
    try {
      this.teardown.call(this, this.tmp);
    } catch(e) {
      //
    }
  }
  this.callback();
};

Test.prototype.fail = function(err) {
  clearTimeout(this.timer);
  if (this.teardown) {
    try {
      this.teardown.call(this, this.tmp);
    } catch(e) {
      //
    }
  }
  this.callback(err);
};

uutest.Test = Test;

function Suite(options) {
  var opts = Suite.defaults;
  if (options) {
    for (var k in options) {
      opts[k] = options[k];
    }
  }
  this.options = opts;
  this.tests = [];
  this._events = {};
}

Suite.prototype.test = function(name, fn, td) {
  var self = this;
  self.tests.push(new Test(name, fn, self.options.timeout, function(err) {
    if (err) {
      err.testName = name;
      self.emit('fail', err);
    } else {
      self.emit('pass', name);
    }
    self.pending--;
    self.check();
  }, td));
};

Suite.prototype.run = function() {
  if (this.pending) return;
  var self = this, len = self.tests.length;
  self.pending = len;
  for (var i=0; i<len; i++) {
    self.tests[i].run();
  }
  if (!len) self.check();
};

Suite.prototype.check = function() {
  if (this.pending) return;
  this.emit('done');
};

Suite.prototype.on = function(type, fn) {
  this._events[type] = fn;
  return this;
};

Suite.prototype.emit = function(type) {
  var event = this._events[type];
  if (event) {
    event.apply(this, Array.prototype.slice.call(arguments, 1));
  }
};

Suite.prototype.register = function(module) {
  if (!runner) uutest.initRunner();
  runner.suite(this);
  if (require.main === module) {
    runner.run();
  }
};

Suite.defaults = {
  timeout: 1000
};

uutest.Suite = Suite;

function Runner(options) {
  var opts = Runner.defaults;
  if (options) {
    for (var k in options) {
      opts[k] = options[k];
    }
  }
  this.options = opts;
  this.suites = [];
}

Runner.prototype.suite = function(suite) {
  var self = this;
  suite.on('pass', function(name) {
    self.passed++;
    self.emit('pass', name);
  });
  suite.on('fail', function(err) {
    self.failed++;
    self.errors.push(err);
    self.emit('fail', err);
  });
  suite.on('done', function() {
    self.pending--;
    self.check();
  });
  self.suites.push(suite);
};

Runner.prototype.run = function() {
  if (this.pending) return;
  var self = this, len = self.suites.length;
  self.passed = self.failed = 0;
  self.errors = [];
  self.start = new Date().getTime();
  self.pending = len;
  for (var i=0; i<len; i++) {
    self.suites[i].run();
  }
};

Runner.prototype.check = function() {
  if (this.pending) return;
  this.emit('done', this.passed, this.failed, new Date().getTime() - this.start);
};

Runner.prototype.emit = function(type) {
  var event = this.options[type];
  if (event) {
    event.apply(this, Array.prototype.slice.call(arguments, 1));
  }
};

Runner.defaults = {};

uutest.Runner = Runner;

uutest.initRunner = function(options) {
  runner = new Runner(options);
  return runner;
};

uutest.run = function() {
  runner.run();
};

function wrapAssertionError(err, actual, expected, operator) {
  err.name = "AssertionError";
  err.actual = actual;
  err.expected = expected;
  err.operator = operator;
  return err;
}

})(typeof exports !== 'undefined' ? exports : window.uutest = {});