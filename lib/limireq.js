/**
 * Ankit Aggarwal (@structAnkit)
 *
 * Easily limit batch http(s) requests to a specified number of
 *     asynchronously managed, serially executed chains
 *
 */

(function (module) {

	var request = require('request')
        ,url = require('url')
		,EventEmitter = require('events').EventEmitter
        ,util = require('util')

    // Constructor
    // Takes number of maximum parallel queues as argument
    var Limireq = function (maxQueues) {
        EventEmitter.call(this)

        this.init(maxQueues)
    }

    // Inherit from EventEmitter
    util.inherits(Limireq, EventEmitter)

    // (Re)initialize the Limireq instance
    // Takes number of maximum parallel queues as argument
    // If omitted, defaults to previously set number or (1 if never initialized before)
    Limireq.prototype.init = function(maxQueues) {

        if (typeof maxQueues === 'number' && maxQueues > 0) {
            // Use the argument specified if it's positive
            this.maxQueues = maxQueues
        } else {
            // If this limiter hasn't been initialized before use 1 queue
            if (typeof this.maxQueues !== 'number')
                this.maxQueues = 1
        }

        this.connections = []
        this.total = this.completed = 0
        this.active = false
        return this
    }

    // Return whether the limiter is currently processing
    Limireq.prototype.isActive = function() { return this.active }

    // Return the number of connections in the pool
    Limireq.prototype.length = function() { return this.total }

    // Return the number of completed requests so far
    Limireq.prototype.completed = function() { return this.completed }

    // Push a new connection to the queue/pool
    Limireq.prototype.push = function (options, callback) {
        if (this.active)
            throw new Error('limireq.push: cannot push to the queue while running')

        // Throw Exception if options is missing
        if (!options)
            throw new Error('limireq.push: missing options parameter')

        // Push the request options to the connection pool
        this.connections.push({
            'options': options
            ,'callback': callback
        })

        return this
    }

    // Begin processing the pool
    Limireq.prototype.start = function () {
        if (this.active)
            throw new Error('limireq.start: Processing has already begun')

        if ((this.total = this.connections.length) < 1)
            throw new Error('limireq.start: No requests exist in the pool')

        var self = this
        
        // Don't expose this function publicly
        function next() {
            var conn = self.connections.shift()

            if (!conn) return

            request(conn.options, function (err, res, body) {
                next()

                if (typeof conn.callback === 'function') {
                    conn.callback(err, res, body)
                } else {
                    self.emit('data', err, res, body)
                }

                if (++self.completed === self.total) {
                    self.init() // Reset the limiter
                    self.emit('end') // Signal the end of processing
                }
            })
        }

        this.active = true

        for (var i = 0; i < this.maxQueues && i < this.total; i++)
            next()

        return this
    }

	module.exports = Limireq

}(module))
