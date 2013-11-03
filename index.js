// Copyright 2013-2014 Ankit Aggarwal
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

var request = require('request'),
  EventEmitter = require('events').EventEmitter,
  util = require('util')

// Constructor
// Takes number of maximum parallel queues as argument
var Limireq = function(max_queues) {
  EventEmitter.call(this)

  this.init(max_queues)
}

// Inherit from EventEmitter
util.inherits(Limireq, EventEmitter)

// (Re)initialize the Limireq instance
// Takes number of maximum parallel queues as argument
// If omitted, defaults to previously set number or (1 if never initialized before)
Limireq.prototype.init = function(max_queues) {
  if (this.active)
    throw new Error('limireq.init: cannot reinitialize while running')

  if (typeof max_queues === 'number' && max_queues > 0)
    // Use the argument specified if it's positive
    this.max_queues = max_queues
  else if (typeof this.max_queues !== 'number')
    // If this limiter hasn't been initialized before use 1 queue
    this.max_queues = 1

  this.removeAllListeners('end')
  this.removeAllListeners('data')
  this.connections = []
  this.total = this.completed = 0
  return this
}

// Return whether the limiter is currently processing
Limireq.prototype.isActive = function() { return this.active }

// Return the number of connections in the pool
Limireq.prototype.length = function() { return this.total }

// Return the number of completed requests so far
Limireq.prototype.completed = function() { return this.completed }

// Push a new connection to the queue/pool
Limireq.prototype.push = function(options, callback) {
  if (this.active)
    throw new Error('limireq.push: cannot push to the queue while running')

  // Throw Exception if options is missing
  if (!options)
    throw new Error('limireq.push: missing options parameter')

  // Reinitialize the limireq instance
  if (this.completed > 0 && this.total === this.completed)
    this.init()

  // Push the request options to the connection pool
  this.connections.push({
    'options': options,
    'callback': callback
  })

  return this
}

// Begin processing the pool
Limireq.prototype.start = function() {
  if (this.active)
    throw new Error('limireq.start: Processing has already begun')

  if ((this.total = this.connections.length) < 1)
    throw new Error('limireq.start: No requests exist in the pool')

  this.active = true

  for (var i = 0; i < this.max_queues && i < this.total; i++)
    next.call(this)

  return this
}

// Don't expose this function to the public prototype
function next() {
  var conn = this.connections.shift()
  if (!conn) return

  request(conn.options, function(err, res, body) {
    if (typeof conn.callback === 'function')
      conn.callback(err, res, body)
    else
      this.emit('data', err, res, body)

    // Signal the end of processing
    if (++this.completed === this.total) {
      this.active = false
      this.emit('end')
    } else next.call(this)
  })
}

module.exports = Limireq
