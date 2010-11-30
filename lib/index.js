var uutest = require('../uutest');

uutest.Runner.defaults = {
  pass: function() {
    process.stdout.write(".");
  },
  fail: function(err) {
    process.stdout.write("F");
  },
  done: function(passed, failed, elapsed) {
    process.stdout.write("\n");
    console.log(passed + " passed " + failed + " failed " + "(" + elapsed + "ms)");
    this.errors.forEach(function(err) {
      console.log(dumpError(err));
    });
  }
};

function dumpError(err) {
  var out = err.testName + " -> ";
  if (!err.message) {
    err.message = JSON.stringify(err.actual)
      + " " + err.operator + " " + JSON.stringify(err.expected);
  }
  return out + err.stack;
}

module.exports = uutest;