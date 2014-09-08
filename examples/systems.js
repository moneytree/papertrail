var Client = require('../');
var assert = require('assert');
var uuid = require('uuid');

require('co')(function* () {
  // Requires on trail to be available....
  var trail = new Client();

  // get the destination...
  var destinations = yield trail.listLogDestinations();
  assert.ok(destinations.length > 0, 'has destinations');

  var destination = destinations[0];

  // Register a new system...
  var systemName = 'test-' + uuid.v4();
  var create = yield trail.registerSystem({
    system: {
      name: systemName
    },
    destination_id: destination.id
  });
  assert.ok(create, 'created system');
  assert.equal(create.name, systemName);

  // Verify its in the list...
  var systems = yield trail.listSystems({});
  assert(systems.some(function(system) {
    return system.name === systemName;
  }), 'has system name')


  // Delete the system...
  yield trail.deleteSystem(create.id);

  // Verify its not in the list...
  var systems = yield trail.listSystems({});
  assert(!systems.some(function(system) {
    return system.name === systemName;
  }), 'has system name')

})(function(err) {
  if (err) throw err;
});

