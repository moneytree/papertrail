var Client = require('../');
var assert = require('assert');
var uuid = require('uuid');

require('co')(function* () {
  // Requires on trail to be available....
  var trail = new Client();

  // create a new saved search...
  var searchName = 'test-search-' + uuid.v4();
  var searchTerm = 'foobar';
  var created = yield trail.createSavedSearch({
    search: {
      name: searchName,
      query: searchTerm
    }
  });

  // verify we can get back the search
  var gotSearch = yield trail.savedSearch(created.id);
  assert.equal(gotSearch.name, searchName);

  // delete the search
  yield trail.deleteSavedSearch(created.id);

  var searches = yield trail.savedSearches();
  assert.ok(!searches.some(function(search) {
    return search.id == created.id;
  }));

})(function(err) {
  if (err) throw err;
});

