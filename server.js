var sys = require("sys");
var url = require('url');
var qs = require('querystring');

var log = require('./libs/log').log;
var ws = require('./libs/ws');

const HOST = "localhost";
const PORT = 8888;

var server = ws.createServer({
    debug: true
});

function createMessage(msg) {
    return "{ body: " + msg + "}";
}

function createErrorMessage(code, msg) {
    return "{ error: " + code + ", body: '" + msg + "'}";
}

server.addListener("listening", function() {
    log("Socket server listening for connections on " + HOST + ":" + PORT);
});

/* Handle WebSocket Requests
 */
server.addListener("connection", function(conn) {
    log("opened connection: " + conn._id);

    conn.addListener("message",
            function(message) {

                parseMessage(message,

                        function(params) { // ok
                            log("<" + conn._id + "> Handling request: " + JSON.stringify(params));

                            if (!params.exampleId) {
                                server.send(conn._id, createErrorMessage(501, "I need an exampleId1!"));

                            }  else {
                                var handler;
                                try {
                                    handler = require("./" + params.exampleId + "/handler");
                                } catch (e) {
                                    server.send(conn._id, createErrorMessage(501, "I cant find a handler for that example: '" + params.exampleId + "'"));
                                    return;
                                }

                                handler.service(
                                        params,
                                        function (error, data) {
                                            if (error) {
                                                server.send(conn._id, createErrorMessage(501, message));
                                            } else {
                                                server.send(conn._id, createMessage(data));
                                            }
                                        });
                            }
                        },

                        function(error) { // er
                            log("<" + conn._id + "> ERROR handling request: " + error.error + " : " + error.message);
                            server.send(conn._id, JSON.stringify(error));
                        });
            });
});

function parseMessage(message, ok, er) {
    var json;
    try {
        json = JSON.parse(message);
    } catch (e) {
        er({ error : 501, body : "request is not valid JSON: " + message });
        return;
    }
    ok(json);
}

server.addListener("close", function(conn) {
    log("closed connection: " + conn._id);
});

server.addListener("shutdown", function(conn) {
    log("Server shutdown"); // never actually happens, because I never tell the server to shutdown.
});

server.listen(PORT, HOST);
