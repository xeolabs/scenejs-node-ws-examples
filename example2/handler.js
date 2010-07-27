function random() {
    return Math.random().toFixed(2);
}

exports.service = function (params, cb) {
    var error;
    var data;

    if (!params.cmd) {
        error = "I need a cmd!";

    } else if (!params.targetNode) {
        error = "I need a targetNode!";

    } else {
        switch (params.cmd) {

            case "changeColor" :
                data = '   { ' +
                       '       configs: {' +
                       '            "#' + params.targetNode + '": {' +
                       '                baseColor : { r:' + random() + ', g:' + random() + ', b:' + random() + ' }' +
                       '            }' +
                       '       }' +
                       '   }';
                break;

            default:
                error = 'I dont understand that cmd: ' + params.cmd;
        }
    }
    cb(error, data);
};