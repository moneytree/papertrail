var assert = require('assert');
var request = require('superagent-promise');
var debug = require('debug')('papertrail');
var util = require('util');

var DEFAULT_BASE_URL = 'https://papertrailapp.com/api/v1/';

function Response(result) {
  this.result = result.body;
}

function decorateRequest(method) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var ctx = this;

    var req = method.apply(ctx, args);
    req.set('X-Papertrail-Token', this.token);
    return req.end().then(function(res) {
      // Handle errors in successful requests...
      if (res.error) {
        var err = new Error(
          'Papertrail api error unexpected status: ' + res.status
        );
        err.status = res.statusCode;
        err.body = res.body;
        debug('request error | %d | %s | %j', err.status, err, err.body);
        throw err;
      }
      return res.body;
    });
  };
}

function api(method, url) {
  return decorateRequest(function(options) {
    return request[method](this.baseUrl + url).
            query(options);
  });
}

function apiWithId(method, url) {
  return decorateRequest(function(id, options) {
    assert(id, 'id is required');
    return request[method](this.baseUrl + util.format(url, id)).
            query(options);
  });
}


/**
@param {Object} options for client.
@param {String} options.token from your papertrail client.
@param {String} [options.baseUrl] baseUrl for the papertrail api.
*/
function Papertrail(options) {
  options = options || {};
  options.token = options.token || process.env.PAPERTRAIL_API_TOKEN;
  options.baseUrl = options.baseUrl || DEFAULT_BASE_URL;

  assert(options, 'You must pass options');
  assert(options.token, 'You must pass a `token` field');
  assert(options.baseUrl, 'You must pass a `baseUrl` field');

  this.token = options.token;
  this.baseUrl = options.baseUrl;
}

Papertrail.prototype = {

  /** event searching */

  /**
  @param {Object} options for search events.
  */
  searchEvents: decorateRequest(function(options) {
    options = options || {};
    if (options.q) options.q = encodeURI(options.q);

    return request.get(this.baseUrl + 'events/search').
            query(options);
  }),

  /** system apis */

  listSystems: api('get', 'systems.json'),
  getSystem: apiWithId('systems/%s.json'),
  registerSystem: api('post', 'systems.json'),
  updateSystem: apiWithId('put', 'systems/%s.json'),
  deleteSystem: apiWithId('del', 'systems/%s.json'),
  systemJoinGroup: apiWithId('post', 'systems/%s/join.json'),
  systemLeaveGroup: apiWithId('post', 'systems/%s/leave.json'),

  /** save searches */

  savedSearches: api('get', 'searches.json'),
  savedSearch: apiWithId('get', 'searches/%s.json'),
  createSavedSearch: apiWithId('post', 'searches/%s.json'),
  updateSavedSearch: apiWithId('put', 'searches/%s.json'),
  deleteSavedSearch: apiWithId('del', 'searches/%s.json'),

  /** manage groups */

  listGroups: api('get', 'groups.json'),
  getGroup: apiWithId('get', 'groups/%s.json'),
  createGroup: api('post', 'groups.json'),
  updateGroup: apiWithId('put', 'groups/%s.json'),
  deleteGroup: apiWithId('del', 'groups/%s.json'),

  /** manage log destinations */

  listLogDestinations: api('get', 'destinations.json'),
  getLogDestination: apiWithId('get', 'destinations/%s.json'),

  /** manage users */

  listUsers: api('get', 'users.json'),
  inviteUser: api('post', 'users/invite.json'),
  deleteUser: apiWithId('del', 'users/%s.json'),

  /** account details */

  getUsage: api('get', 'account.json')
};

module.exports = Papertrail;
