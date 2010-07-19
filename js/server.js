/*
 * WebSocket front-end for the asset service 
 */

var sys = require("sys");
var log = require('../lib/log').log;
var ws = require('../lib/ws');
var url = require('url');
var qs = require('querystring');

const HOST = "localhost";
const PORT = 8888;

var server = ws.createServer({
    debug: true
});

function createTeapot() {
     
    return '{' +
           '    configs: {'   +
           '        "#world-root": {' +
           '            "+node" : SceneJS.node({ sid: "teapot" },' +
           '                    SceneJS.translate(' +
           '                        SceneJS.rotate({' +
           '                               sid: "rotate",' +
           '                                angle: 0,' +
           '                                y : 1.0' +
           '                            },' +
           '                            SceneJS.objects.teapot())))' +
           '        }' +
           '    }' +
           '}';
////
//     return '{' +
//           '    configs: {'   +
//           '        "#world-root": { "+node" : SceneJS.translate(new SceneJS.objects.Teapot()) } '+
//           '    }' +
//           '}';
}

function rotateTeapot() {
    return '{' +
           '    configs: {' +
           '        "#teapot": {' +
           '            "#rotate" : {' +
           '                angle: 45' +
           '            }' +
           '        }' +
           '    }' +
           '}';
}

function destroyTeapot() {
    return '{' +
           '    configs: {' +
           '        "#world-root": {' +
           '             "-node" : "teapot"' +
           '        }' +
           '    }' +
           '}';
}

function createMessage(body) {
    return body;
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

                        function(params) {
                            log("<" + conn._id + "> Handling request: " + JSON.stringify(params));

                            var responseMsg;

                            if (!params.cmd) {
                                responseMsg = createErrorMessage(501, "I need a cmd!");               
                            } else {
                                switch (params.cmd) {
                                    case "createTeapot" :
                                        responseMsg = createMessage(createTeapot());
                                        break;

                                    case "rotateTeapot" :
                                        responseMsg = createMessage(rotateTeapot());
                                        break;

                                    case "destroyTeapot" :
                                        responseMsg = createMessage(destroyTeapot());
                                        break;

                                    default:
                                        responseMsg = createErrorMessage(501, "I dont understand that cmd: " + params.cmd);
                                        break;
                                }
                            }
                            server.send(conn._id, responseMsg);
                         //   log("<" + conn._id + "> Responding with: " + responseMsg);



                        },
                        function(error) {
                          //  log("<" + conn._id + "> ERROR handling request: " + error.error + " : " + error.message);
                            server.send(conn._id, JSON.stringify(error));
                        });
            });
});

function parseMessage(message, ok, er) {
    try {
        ok(JSON.parse(message));
    } catch (e) {
        er({ error : 501, body : "request is not valid JSON: " + message });
    }
}

server.addListener("close", function(conn) {
    log("closed connection: " + conn._id);
});

server.addListener("shutdown", function(conn) {
    log("Server shutdown"); // never actually happens, because I never tell the server to shutdown.
});

server.listen(PORT, HOST);
