/*--------------------------------------------------------------------------------------------------
 *
 * A template for getting started with pick handling with the SceneJS.Socket node.
 *
 * Lindsay Kay
 * July 27, 2010
 * lindsay.kay@xeolabs.com
 *--------------------------------------------------------------------------------------------------*/
var exampleScene = SceneJS.scene({
    canvasId: "theCanvas",
    loggingElementId: "theLoggingDiv" },

        SceneJS.lookAt({
            eye : { x: -25.0, y: 10.0, z: -25 },
            look : { y:1.0 },
            up : { y: 1.0 }
        },
                SceneJS.camera({
                    optics: {
                        type: "perspective",
                        fovy : 25.0,
                        aspect : 1.0,
                        near : 0.10,
                        far : 300.0  }
                },
                        SceneJS.lights({
                            sources: [
                                {
                                    type:                   "dir",
                                    color:                  { r: 1.0, g: 0.5, b: 0.5 },
                                    diffuse:                true,
                                    specular:               true,
                                    dir:                    { x: 1.0, y: 1.0, z: -1.0 }
                                },
                                {
                                    type:                   "dir",
                                    color:                  { r: 0.5, g: 1.0, b: 0.5 },
                                    diffuse:                true,
                                    specular:               true,
                                    dir:                    { x: 0.0, y: 1.0, z: -1.0 }
                                },
                                {
                                    type:                   "dir",
                                    color:                  { r: 0.2, g: 0.2, b: 1.0 },
                                    diffuse:                true,
                                    specular:               true,
                                    dir:                    { x: -1.0, y: 0.0, z: -1.0 }
                                }
                            ]},

                                SceneJS.socket({
                                    uri: "ws://127.0.0.1:8888/",

                                    listeners: {

                                        /* On a pick event, our Socket sends a "changeColor"
                                         * request to our second socket handler, specifying the
                                         * SID path to the node that was picked. The path actually
                                         * points directly to the material node for each teapot, and
                                         * will be "teapot1-material", ""teapot2-material" or "teapot3-material".
                                         */
                                        "picked" : {
                                            fn: function(params) {
                                                this.addMessage({           // Socket queues message on itself
                                                    exampleId : "example2", // to send when next rendered
                                                    cmd: "changeColor",
                                                    targetNode : params.uri
                                                });
                                            }
                                        }
                                    }
                                },
                                    // Teapot 1

                                        SceneJS.translate({ x: 7 },
                                                SceneJS.material({
                                                    sid: "teapot1-material",
                                                    baseColor:      { r: 0.3, g: 0.3, b: 0.9 },
                                                    specularColor:  { r: 0.9, g: 0.9, b: 0.9 },
                                                    specular:       0.9,
                                                    shine:          6.0
                                                },
                                                        SceneJS.objects.teapot())),

                                    // Teapot 2

                                        SceneJS.translate({ x: 0 },
                                                SceneJS.material({
                                                    sid: "teapot2-material",
                                                    baseColor:      { r: 0.3, g: 0.3, b: 0.9 },
                                                    specularColor:  { r: 0.9, g: 0.9, b: 0.9 },
                                                    specular:       0.9,
                                                    shine:          6.0
                                                },
                                                        SceneJS.objects.teapot())),
                                        
                                    // Teapot 3

                                        SceneJS.translate({ x: -7 },
                                                SceneJS.material({
                                                    sid: "teapot3-material",
                                                    baseColor:      { r: 0.3, g: 0.3, b: 0.9 },
                                                    specularColor:  { r: 0.9, g: 0.9, b: 0.9 },
                                                    specular:       0.9,
                                                    shine:          6.0
                                                },
                                                        SceneJS.objects.teapot()))
                                        ) // Socket
                                ) // lights
                        ) // camera
                ) // lookAt
        ); // scene


/*----------------------------------------------------------------------
 * Debug configs
 *---------------------------------------------------------------------*/

SceneJS.setDebugConfigs({
    sockets: {
        trace: true
    }
});

/*----------------------------------------------------------------------
 * Scene rendering stuff
 *---------------------------------------------------------------------*/
var pInterval;
var clickEvent;

window.render = function() {
    if (clickEvent) {
        exampleScene.pick(clickEvent.clientX, clickEvent.clientY);
        clickEvent = null;
    } else {
        exampleScene.render();
    }
};

SceneJS.addListener("error", function(e) {
    window.clearInterval(pInterval);
    alert(e.exception.message ? e.exception.message : e.exception);
});

var canvas = document.getElementById(exampleScene.getCanvasId());

canvas.addEventListener('mousedown', function (event) {
    clickEvent = event;
}, false);

pInterval = setInterval("window.render()", 10);


