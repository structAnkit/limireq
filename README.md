# Limireq

Limireq is a Node.js module that throttles the number of concurrent active requests at a given time. This is useful when batch processing API data without overloading smaller servers and/or the client itself.

## Installation

```bash
npm install limireq
```

## Usage Example

```js
// Require the module
var Limireq = require('limireq')

// Initialize a new instance
var lr = new Limireq(25) // max of 25 concurrent connections at any time

var usernames = [] // some array containing 50 usernames

// Push a URL or Request.js options object
for (int i = 0; i < 50; i+=2) {
    // Push a URL
    lr.push('http://api.hostname.com/users/' + usernames[i])

    // Push a request-module-compatible object
    lr.push({
        url: 'http://api.hostname.com/users/' + usernames[i]
        ,oauth: {
            consumer_key: 'your_key_here'
            ,consumer_secret: 'ex_girlfriends_dogs_name'
        }
    })
}

// Begin the processing
lr.start()
```

# Event Handling

The responses and their body text will be emitted via the 'data' event:

```js
lr.on('data', function(err, res, body) {
    try {
        var json = JSON.parse(console.log(body))
        doStuffToJsonInputFunction(json)
    } catch (e) {
        console.log(e)
    }
})
```

When all responses have been emitted, the throttle will emit an 'end' event and enable reuse of the limiter:

```js
lr.on('end', function() {
    console.log('We finished')
})
```

# Callbacks

If a specific request's response needs to be handled differently from the others, you can pass a callback function when you push the request to the pool. This means you will NOT receive a 'data' event for this request:

```js
function callback(err, res, body) {
    // Do stuff
}

lr.push('http://api.hostname.com/users/' + usernames[i], callback)
lr.push({
    url: 'http://api.hostname.com/users/' + usernames[i]
    ,oauth: {
        consumer_key: 'your_key_here'
        ,consumer_secret: 'ex_girlfriends_dogs_name'
    }}, callback)
```

# Reuse

Once the limiter has emitted it's 'end' event, it can reused immediately:

```js
function startSecondJob() {
    lr.push()
    /// push more requests...
    lr.start()
    lr.on('data', function(err, res, body) {
        // do stuff with response
    }).on('end', function() {
        console.log('Completed two batch jobs')
    })
}

lr.on('end', startSecondJob)
```

Or it can be reinitialized with a new value for the maximum allowed simultaneous connections:

```js
function startSecondJob() {
    lr.init(100) // raise parallel connection limit to 100
    lr.push()
    /// push more requests...
    lr.start()
    lr.on('data', function(err, res, body) {
        // do stuff with response
    }).on('end', function() {
        console.log('Completed two batch jobs')
    })
}

lr.on('end', startSecondJob)
```