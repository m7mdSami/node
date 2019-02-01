// create server

const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// start Http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
    console.log('server is done ' + config.httpPort)
});

// start Https server
let options = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(options, (req, res) => {
    unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, () => {
    console.log('server is done ' + config.httpsPort)
});

let unifiedServer = (req, res) => {
    let parseURL = url.parse(req.url, true);
    let path = parseURL.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, "");
    let query = parseURL.query;
    let method = req.method.toLowerCase();
    let header = req.headers;

    let decoder = new stringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        let data = {
            'trimmedPath': trimmedPath,
            'queryString': query,
            'method': method,
            'headers': header,
            'payload': buffer
        };

        chosenHandler(data, (statusCode, payload) => {
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            payload = typeof (payload) == 'object' ? payload : {};

            let payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log(statusCode, payloadString)
        });

    });

}

let handlers = {};

// handlers.sample = (data, callback) => {
//     callback(406, { 'name': 'sample handler' })
// };

handlers.ping = (data, callback) => {
    callback(200, { 'name': 'sample handler' })
};

handlers.notFound = (data, callback) => {
    callback(404);
};

let router = {
    'ping': handlers.ping
}

