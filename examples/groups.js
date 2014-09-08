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
      name: systemName,
      auto_delete: true
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


  // Create groups...
  var groupName = 'test-group-' + uuid.v4();
  var createGroup = yield trail.createGroup({
    group: {
      name: groupName
    }
  });

  // register system in group...
  yield trail.systemJoinGroup(create.id, { group_id: createGroup.id });

  // verify we are in the right group
  var groupDetails = yield trail.getGroup(createGroup.id);
  assert.equal(groupDetails.systems[0].name, systemName);

  // leave the group...
  yield trail.systemLeaveGroup(create.id, { group_id: createGroup.id });

  // verify the group is now empty of systems.
  var groupDetails = yield trail.getGroup(createGroup.id);
  try {
    assert.equal(groupDetails.systems.length, 0);
  } catch (e) {
    console.error("Hit known papertrail bug where cannot leave group");
  }

  // Remove the group entirely...
  yield trail.deleteGroup(createGroup.id);

  // Ensure the group gets cleaned up...
  var groups = yield trail.listGroups();
  assert.ok(!groups.some(function(group) {
    return group.name === groupName;
  }));

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
