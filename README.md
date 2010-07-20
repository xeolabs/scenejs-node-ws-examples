# Node.JS WebSocket Examples with SceneJS

The SceneJs.Socket node enables a server to dynamically participate in the construction,
destruction and configuration of its subgraph. It binds its subgraph to a WebSocket
through which it exchanges JSON message objects with a server, notifying the server of
events within its subgraph, while receiving incoming messages containing instructions to create,
delete and configure subnodes.

These are template examples to get you started. SceneJS WebSocket support is young - I'll extend
these examples as I figure out what it's meant to be!

* Compatible with SceneJS v0.7.6.1 and Node.js v0.1.91
* See Wiki page on SceneJS WebSocket node at http://scenejs.wikispaces.com/SceneJS.Socket
* Uses the Node.js WebSocket library at http://github.com/ncr/node.ws.js

## Running

To run the first example:

node example1/server.js

Then point your browser at http://.../example1/index.html

You'll see a teapot appear as the server pushes it into the scene graph, then rotate when the
server pushes fresh attributes into its subgraph. Nothing flash, but hey it works!  

### Author

Lindsay Kay