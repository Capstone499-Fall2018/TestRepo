const amqp = require('amqplib/callback_api');
let MatchChannel;
let MatchQueue;
const requestMap = new Map();
const MATCH_CHANNEL = 'MATCHREQUEST'
const BROADCAST_CHANNEL = 'BROADCAST'
let BroadcastChannel;

module.exports = {
    findMatch,
    publishSubjectEnrolled
}

//
//TODO: handle redis disconnection
//

//client side of the rabbitMQ messaging queue  MATCHCHANNEL
amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
        if (err) {
            throw err;
        }
        MatchChannel = ch;
        ch.assertQueue('', { exclusive: true }, function (err, q) {
            if (err) {
                throw err;
            }
            MatchQueue = q;
            ch.consume(q.queue, function (msg) {
                const correlationId = msg.properties.correlationId;
                const callback = requestMap.get(correlationId);
                const message = JSON.parse(msg.content.toString());
                callback(null, message);
            }, { noAck: true });
        });
        conn.createChannel(function (err, ch) {
            if (err) {
                throw err;
            }
            const exchange = 'BROADCAST';
            
            BroadcastChannel = ch;
            ch.assertExchange(exchange,'fanout', {durable: false})
        });
    });
});

//funciton that keeps the channel/connection alive so that the findMatch function can be exported and used freely
function findMatch(matchRequest) {
    return new Promise((resolve, reject) => {
        const correlationId = generateUuid();
        requestMap.set(correlationId, (err, result) => {
            requestMap.delete(correlationId);
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
        MatchChannel.sendToQueue(MATCH_CHANNEL,
            new Buffer(JSON.stringify(matchRequest)),
            { correlationId, replyTo: MatchQueue.queue, type: 'MATCHREQUEST' });
    });
}


function publishSubjectEnrolled(subject) {
    return new Promise((resolve, reject) => {
        BroadcastChannel.publish(BROADCAST_CHANNEL, '',
            new Buffer(JSON.stringify(subject)),
            { type: 'SUBJECT_ENROLLED_REQUEST' });
    });
}

//function to generate random correlation Id
function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}