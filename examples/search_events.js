var Client = require('../');
var assert = require('assert');

require('co')(function* () {
  // Requires on trail to be available....
  var trail = new Client();

  var events = yield trail.searchEvents({});
  assert(typeof events === 'object');
})(function(err) {
  if (err) throw err;
});
