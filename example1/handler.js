exports.service = function (params, cb) {
    var error;
    var data;

    if (!params.cmd) {
        error = "I need a cmd!";

    } else {
        
        switch (params.cmd) {
            case "createTeapot" :
                data = '   { ' +
                       '        configs: {' +
                       '            "#world-root": {' +
                       '                "+node" : SceneJS.node({ sid: "teapot" },' +
                       '                        SceneJS.translate(' +
                       '                            SceneJS.rotate({' +
                       '                                   sid: "rotate",' +
                       '                                    angle: 0,' +
                       '                                    y : 1.0' +
                       '                                },' +
                       '                                SceneJS.objects.teapot())))' +
                       '            }' +
                       '       }' +
                       '   }';
                break;

            case "rotateTeapot" :
                data = '   { ' +
                       '       configs: {' +
                       '            "#teapot": {' +
                       '                "#rotate" : {' +
                       '                    angle: 45' +
                       '                 }' +
                       '            }' +
                       '       }' +
                       '   }';
                break;

            case "destroyTeapot" :
                data = '   { ' +
                       '       configs: {' +
                       '            "#world-root": {' +
                       '                 "-node" : "teapot"' +
                       '            }' +
                       '       } ' +
                       '   }';
                break;

            default:
                error = 'I dont understand that cmd: ' + params.cmd;
        }
    }
    cb(error, data);
};