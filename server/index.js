
require("dotenv").config();

const express = require('express');
const app = express();
const http = require('http');
const port = normalizePort(process.env.PORT || '80');

app.set('port', port);

const server = http.createServer(app);

const io = require('socket.io')(server);

const autopricer = require('./autopricer/app.js')

const auto = new autopricer(io)


async function start() {
    try {
        await auto.init();
        auto.addItems();
        server.listen(port);
    } catch (error) {
        console.log(error)
    }
}
start()
//
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}
