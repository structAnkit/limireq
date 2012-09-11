/**
 * By no means are these good examples of what you want to use Limireq for
 * This is just a simple demo of how it works
 */
(function() {

    'use strict';

    var Limireq = require('limireq')
        ,lr
        ,start
        ,timeOneQueue
        ,timeThreeQueues

    /**
     * Single serially executed queue
     * The next request will NOT be made until the previous one is complete
     * The output should be in the same order you push your URLs to the queue
     *
     * This test utilizes the Request options object parameter format and events
     */
    (function oneEventQueue() {
        console.log('***Begin single queue, event-based test')

        start = new Date()
        lr = new Limireq(1)
            .push({ url: 'http://www.google.com' })
            .push({ url: 'http://www.android.com' }, function (err, res, body) {
                console.log('Status Code:' + res.statusCode)
                console.log('Bypass the data event for Android.com')
                console.log()
            })
            .push({ url: 'http://www.youtube.com' })
            .push({ url: 'http://www.amazon.com' })
            .push({ url: 'http://www.apple.com' })
            .push({ url: 'http://www.bing.com' })
            .on('data', function(err, res, body) {
                console.log('Status Code: ' + res.statusCode)
                console.log('Do some common processing with the response')
                console.log()
            })
            .on('end', function end() {
                timeOneQueue = new Date()-start
                lr.removeListener('end', end)
                threeQueues()
            })
            .start()
    }())

    /**
     * Three serially executed queues
     * Three requests will be queued simultaneously to begin
     *     and when one completes the next connection in the queue begins processing
     * At no time will there be more than 3 connections active at the same time
     *
     * The output will not necessarily be in the order you push to the pool
     *
     * This test utilizes String urls and callbacks
     */
    function threeQueues() {
        console.log('***Begin three parallel queues, callback-based test')

        start = new Date()
        lr.init(3)
            .push('http://www.google.com', function(err, res, body) {
                console.log('Google: Totally not a tech company, they don\'t make self-driving cars or anything')
            })
            .push('http://www.android.com', function(err, res, body) {
                console.log('Android: Almost all of my OEMs suck...just like with Windows computers')
            })
            .push('http://www.youtube.com', function(err, res, body) {
                console.log('YouTube: Read the comments!')
            })
            .push('http://www.amazon.com', function(err, res, body) {
                console.log('Amazon: Buy things cheap...plus tax and shipping and waiting')
            })
            .push('http://www.apple.com', function(err, res, body) {
                console.log('Apple: Pay 3x the price of a used car for your computers')
            })
            .push('http://www.bing.com', function(err, res, body) {
                console.log('Bing: This is only here because the name sounds funny')
            })
            .start()
            .on('end', function() {
                timeThreeQueues = new Date()-start
                console.log('Test completion times:')
                console.log('Single queue: ' + timeOneQueue)
                console.log('Three queues: ' + timeThreeQueues)
            })

    }

}())
