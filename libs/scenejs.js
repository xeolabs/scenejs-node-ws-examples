/*
 * SceneJS WebGL Scene Graph Library for JavaScript
 * http://scenejs.org/
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://scenejs.org/license
  * Copyright 2010, Lindsay Kay
 *
 * Includes WebGLTrace
 * Various functions for helping debug WebGL apps.
 * http://github.com/jackpal/webgltrace
 * Copyright (c) 2009 The Chromium Authors. All rights reserved.
 *
 * Includes WebGL-Debug
 * Various functions for helping debug WebGL apps.
 * http://khronos.org/webgl/wiki/Debugging
 * Copyright (c) 2009 The Chromium Authors. All rights reserved. 
 */
/**
 * @class SceneJS
 * SceneJS name space
 * @singleton
 */
var SceneJS = {

    /** Version of this release
     */
    VERSION: '0.7.6.2',

    /** Names of supported WebGL canvas contexts
     */
    SUPPORTED_WEBGL_CONTEXT_NAMES:["experimental-webgl", "webkit-3d", "moz-webgl", "moz-glweb20"],

    /** @private */
    _traversalMode :0x1,

    /** @private */
    _TRAVERSAL_MODE_RENDER: 0x1,

    /** @private */
    _TRAVERSAL_MODE_PICKING:   0x2,

    /**
     * @private
     */
    _inherit : function(DerivedClassName, BaseClassName) {
        DerivedClassName.prototype = new BaseClassName();
        DerivedClassName.prototype.constructor = DerivedClassName;
    },

    /** Creates a namespace
     * @private
     */
    _namespace : function() {
        var a = arguments, o = null, i, j, d, rt;
        for (i = 0; i < a.length; ++i) {
            d = a[i].split(".");
            rt = d[0];
            eval('if (typeof ' + rt + ' == "undefined"){' + rt + ' = {};} o = ' + rt + ';');
            for (j = 1; j < d.length; ++j) {
                o[d[j]] = o[d[j]] || {};
                o = o[d[j]];
            }
        }
    },

    /**
     * Returns a key for a vacant slot in the given map
     * @private
     */
    _createKeyForMap : function(keyMap, prefix) {
        var i = 0;
        while (true) {
            var key = prefix + i++;
            if (!keyMap[key]) {
                return key;
            }
        }
    },

    /** Applies properties on o2 to o1 where not already on o1
     *
     * @param o1
     * @param o2
     * @private
     */
    _applyIf : function(o1, o2) {
        for (var key in o2) {
            if (!o1[key]) {
                o1[key] = o2[key];
            }
        }
        return o1;
    },

    _getBaseURL : function(url) {
        var i = url.lastIndexOf("/");
        if (i == 0 || i == -1) {
            return "";
        }
        return url.substr(0, i+1);
    },
    
    /**
     * Returns true if object is an array
     * @private
     */
    _isArray : function(testObject) {
        return testObject && !(testObject.propertyIsEnumerable('length'))
                && typeof testObject === 'object' && typeof testObject.length === 'number';
    }
    //,

    //    _debugEnabled : {},
    //
    //    /**
    //     * Enables of disables debugging mode
    //     * @param enabled
    //     */
    //    setDebugging : function(key, enabled) {
    //        this._debugEnabled[key] = enabled;
    //    },
    //
    //    /** Gets whether debug mode is enabled or not
    //     * @returns {boolean} True if debugging enabled else false
    //     */
    //    getDebugging : function(key) {
    //        return this._debugEnabled[key];
    //    }

}
        ;

SceneJS._namespace("SceneJS");




window["SceneJS"] = SceneJS;


/**
 * Backend that manages debugging configurations.
 *
 * @private
 */
SceneJS._debugModule = new (function() {

    this.configs = {};

    this.getConfigs = function(path) {
        if (!path) {
            return this.configs;
        } else {
            var cfg = this.configs;
            var parts = path.split(".");
            for (var i = 0; cfg && i < parts.length; i++) {
                cfg = cfg[parts[i]];
            }
            return cfg || {};
        }
    };

    this.setConfigs = function(path, data) {
        if (!path) {
            this.configs = data;
        } else {
            var parts = path.split(".");
            var cfg = this.configs;
            var subCfg;
            var name;
            for (var i = 0; i < parts.length - 1; i++) {
                name = parts[i];
                subCfg = cfg[name];
                if (!subCfg) {
                    subCfg = cfg[name] = {};
                }
                cfg = subCfg;
            }
            cfg[parts.length - 1] = data;
        }
    };

})();

/** Sets debugging configurations. 
 */
SceneJS.setDebugConfigs = function () {
    if (arguments.length == 1) {
        SceneJS._debugModule.setConfigs(null, arguments[0]);
    } else if (arguments.length == 2) {
        SceneJS._debugModule.setConfigs(arguments[0], arguments[1]);
    } else {
        throw "Illegal arguments given to SceneJS.setDebugs - should be either ({String}:name, {Object}:cfg) or ({Object}:cfg)";
    }
};

/** Gets debugging configurations
 */
SceneJS.getDebugConfigs = function (path) {
    return SceneJS._debugModule.getConfigs(path);
};

SceneJS.errors = {};
/**
 * @class Wrapper for an exception not recognised by SceneJS.
 */
SceneJS.errors.Exception = function(msg, cause) {
    this.message = "SceneJS.errors.Exception: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown by SceneJS when a recognised WebGL context could not be found on the canvas specified to a {@link SceneJS.Scene}.
 */
SceneJS.errors.WebGLNotSupportedException = function(msg, cause) {
    this.message = "SceneJS.errors.WebGLNotSupportedException: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown by {@link SceneJS.Node} or subtypes when a mandatory configuration was not supplied
 */
SceneJS.errors.NodeConfigExpectedException = function(msg, cause) {
    this.message = "SceneJS.errors.NodeConfigExpectedException: " + msg;
    this.cause = cause;
};

/**
 * @private
 */
SceneJS.errors.ShaderCompilationFailureException = function(msg, cause) {
    this.message = "SceneJS.errors.ShaderCompilationFailureException: " + msg;
    this.cause = cause;
};

/**
 * @private
 */
SceneJS.errors.ShaderLinkFailureException = function(msg, cause) {
    this.message = "SceneJS.errors.ShaderLinkFailureException: " + msg;
    this.cause = cause;
};

/**
 * @private
 */
SceneJS.errors.NoSceneActiveException = function(msg, cause) {
    this.message = "SceneJS.errors.NoSceneActiveException: " + msg;
    this.cause = cause;
};

/**
 * @private
 */
SceneJS.errors.NoCanvasActiveException = function(msg, cause) {
    this.message = "SceneJS.errors.NoCanvasActiveException: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown when a {@link SceneJS.Scene} 'canvasId' configuration does not match any elements in the page and no
 * default canvas was found with the ID specified in {@link SceneJS.Scene.DEFAULT_CANVAS_ID}.
 */
SceneJS.errors.CanvasNotFoundException = function(msg, cause) {
    this.message = "SceneJS.errors.CanvasNotFoundException: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown by SceneJS node classes when configuration property is invalid.
 */
SceneJS.errors.InvalidNodeConfigException = function(msg, cause) {
    this.message = "SceneJS.errors.InvalidNodeConfigException: " + msg;
    this.cause = cause;
};

/**
 * @class  Exception thrown when SceneJS fails to allocate a buffer (eg. texture, vertex array) in video RAM.
 * <p>Whether this is actually thrown before your GPU/computer hangs depends on the quality of implementation within the underlying
 * OS/OpenGL/WebGL stack, so there are no guarantees that SceneJS will warn you with one of these.</p.
 */
SceneJS.errors.OutOfVRAMException = function(msg, cause) {
    this.message = "SceneJS.errors.OutOfVRAMException: " + msg;
    this.cause = cause;
};

/**@class  Exception thrown when a {@link SceneJS.Scene} 'loggingElementId' configuration does not match any elements in the page and no
 * default DIV was found with the ID specified in {@link SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID}.
 */
SceneJS.errors.DocumentElementNotFoundException = function(msg, cause) {
    this.message = "SceneJS.errors.DocumentElementNotFoundException: " + msg;
    this.cause = cause;
};

/**
 * @class  Exception thrown by nodes such as {@link SceneJS.Renderer} and {@link SceneJS.Texture} when the browser's WebGL does not support
 * a specified config value.
 */
SceneJS.errors.WebGLUnsupportedNodeConfigException = function(msg, cause) {
    this.message = "SceneJS.errors.WebGLUnsupportedNodeConfigException: " + msg;
    this.cause = cause;
};

/** @private */
SceneJS.errors.PickWithoutRenderedException = function(msg, cause) {
    this.message = "SceneJS.errors.PickWithoutRenderedException: " + msg;
    this.cause = cause;
};

/**
 * @class  Exception thrown when a node (such as {@link SceneJS.ScalarInterpolator}) expects to find some element of data on the current
 * data scope (SceneJS.Data).
 */
SceneJS.errors.DataExpectedException = function(msg, cause) {
    this.message = "SceneJS.errors.DataExpectedException: " + msg;
    this.cause = cause;
};


/**
 * @class  Exception thrown to signify a general internal SceneJS exception, ie. a SceneJS implementation bug.
 */
SceneJS.errors.InternalException = function(msg, cause) {
    this.message = "SceneJS.errors.InternalException: " + msg;
    this.cause = cause;
};

/**
 * @class  Exception thrown to signify that a {@link SceneJS.Instance} node could not find
 * a {@link SceneJS.Symbol} to instance
 */
SceneJS.errors.SymbolNotFoundException = function(msg, cause) {
    this.message = "SceneJS.errors.SymbolNotFoundException: " + msg;
    this.cause = cause;
};

/**
 * @class  Exception thrown to signify an attempt to link/nest {@link SceneJS.Node}s or subtypes in a manner that would create an invalid scene graph
 * a {@link SceneJS.Symbol} to instance
 */
SceneJS.errors.InvalidSceneGraphException = function(msg, cause) {
    this.message = "SceneJS.errors.InvalidSceneGraphException: " + msg;
    this.cause = cause;
};

/**
 * @class  Exception thrown to signify that browser does not support the {@link SceneJS.Socket} node (ie. WebSockets not supported)
 */
SceneJS.errors.SocketNotSupportedException = function(msg, cause) {
    this.message = "SceneJS.errors.SocketNotSupportedException: " + msg;
    this.cause = cause;
};

/**
 * @class  Exception thrown to signify error condition on a {@link SceneJS.Socket}
 */
SceneJS.errors.SocketErrorException = function(msg, cause) {
    this.message = "SceneJS.errors.SocketErrorException: " + msg;
    this.cause = cause;
};


/**
 * @class  Exception thrown to signify error response by a {@link SceneJS.Socket} node's server peer.
 */
SceneJS.errors.SocketServerErrorException = function(msg, cause) {
    this.message = "SceneJS.errors.SocketServerErrorException: " + msg;
    this.cause = cause;
};


/**
 * @class Exception thrown by {@link SceneJS.WithConfigs} when in strictNodes mode and a node reference
 * on its configuration map could not be resolved to any nodes in it's subgraph.
 */
SceneJS.errors.WithConfigsNodeNotFoundException = function(msg, cause) {
    this.message = "SceneJS.errors.WithConfigsNodeNotFoundException: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown by {@link SceneJS.WithConfigs} when in strictProperties mode and a property reference
 * on its configuration map could not be resolved to any methods on a specified target node in it's subgraph.
 */
SceneJS.errors.WithConfigsPropertyNotFoundException = function(msg, cause) {
    this.message = "SceneJS.errors.WithConfigsPropertyNotFoundException: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown by {@link SceneJS.UseModule} when it cannot find a module matching it's name configuration
 * property. This is likely to be because you didn't load any module of that name with SceneJS.requireModule().
 */
SceneJS.errors.ModuleNotFoundException = function(msg, cause) {
    this.message = "SceneJS.errors.ModuleNotFoundException: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown by {@link SceneJS#requireModule} when a module does not load within timeout interval.
 */
SceneJS.errors.ModuleLoadTimeoutException = function(msg, cause) {
    this.message = "SceneJS.errors.ModuleLoadTimeoutException: " + msg;
    this.cause = cause;
};

/**
 * @class Exception thrown by {@link SceneJS#installModule} when a module caused an exception while installing.
 */
SceneJS.errors.ModuleInstallFailureException = function(msg, cause) {
    this.message = "SceneJS.errors.ModuleInstallFailureException: " + msg;
    this.cause = cause;
};





/** @private */
SceneJS._math_divVec3 = function(u, v) {
    return [u[0] / v[0], u[1] / v[1], u[2] / v[2]];
}

/** @private */
SceneJS._math_negateVector4 = function(v) {
    return [-v[0],-v[1],-v[2],-v[3]];
}

/** @private */
SceneJS._math_addVec4 = function(u, v) {
    return [u[0] + v[0],u[1] + v[1],u[2] + v[2],u[3] + v[3]];
}

/** @private */
SceneJS._math_addVec4s = function(v, s) {
    return [v[0] + s,v[1] + s,v[2] + s,v[3] + s];
}

/** @private */
SceneJS._math_addScalarVec4 = function(s, v) {
    return SceneJS._math_addVec4s(v, s)
}

/** @private */
SceneJS._math_subVec4 = function(u, v) {
    return [u[0] - v[0],u[1] - v[1],u[2] - v[2],u[3] - v[3]];
}

/** @private */
SceneJS._math_subVec3 = function(u, v) {
    return [u[0] - v[0],u[1] - v[1],u[2] - v[2]];
}

/** @private */
SceneJS._math_subVec4Scalar = function(v, s) {
    return [v[0] - s,v[1] - s,v[2] - s,v[3] - s];
}

/** @private */
SceneJS._math_subScalarVec4 = function(v, s) {
    return [s - v[0],s - v[1],s - v[2],s - v[3]];
}

/** @private */
SceneJS._math_mulVec4 = function(u, v) {
    return [u[0] * v[0],u[1] * v[1],u[2] * v[2],u[3] * v[3]];
}

/** @private */
SceneJS._math_mulVec4Scalar = function(v, s) {
    return [v[0] * s,v[1] * s,v[2] * s,v[3] * s];
}

/** @private */
SceneJS._math_mulVec3Scalar = function(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
}

/** @private */
SceneJS._math_divVec4 = function(u, v) {
    return [u[0] / v[0],u[1] / v[1],u[2] / v[2],u[3] / v[3]];
}

/** @private */
SceneJS._math_divScalarVec3 = function(s, v) {
    return [s / v[0], s / v[1], s / v[2]];
}

/** @private */
SceneJS._math_divVec3s = function(v, s) {
    return [v[0] / s, v[1] / s, v[2] / s];
}

/** @private */
SceneJS._math_divVec4s = function(v, s) {
    return [v[0] / s,v[1] / s,v[2] / s,v[3] / s];
}

/** @private */
SceneJS._math_divScalarVec4 = function(s, v) {
    return [s / v[0],s / v[1],s / v[2],s / v[3]];
}


/** @private */
SceneJS._math_dotVector4 = function(u, v) {
    return (u[0] * v[0] + u[1] * v[1] + u[2] * v[2] + u[3] * v[3]);
}

/** @private */
SceneJS._math_cross3Vec4 = function(u, v) {
    return [u[1] * v[2] - u[2] * v[1],u[2] * v[0] - u[0] * v[2],u[0] * v[1] - u[1] * v[0],0.0];
}

/** @private */
SceneJS._math_cross3Vec3 = function(u, v) {
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

/** @private */
SceneJS._math_sqLenVec4 = function(v) {
    return SceneJS._math_dotVector4(v, v);
}

/** @private */
SceneJS._math_lenVec4 = function(v) {
    return Math.sqrt(SceneJS._math_sqLenVec4(v));
}

/** @private */
SceneJS._math_dotVector3 = function(u, v) {
    return (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]);
}

/** @private */
SceneJS._math_sqLenVec3 = function(v) {
    return SceneJS._math_dotVector3(v, v);
}

/** @private */
SceneJS._math_lenVec3 = function(v) {
    return Math.sqrt(SceneJS._math_sqLenVec3(v));
}

/** @private */
SceneJS._math_rcpVec3 = function(v) {
    return SceneJS._math_divScalarVec3(1.0, v);
}

/** @private */
SceneJS._math_normalizeVec4 = function(v) {
    var f = 1.0 / SceneJS._math_lenVec4(v);
    return SceneJS._math_mulVec4Scalar(v, f);
}

/** @private */
SceneJS._math_normalizeVec3 = function(v) {
    var f = 1.0 / SceneJS._math_lenVec3(v);
    return SceneJS._math_mulVec3Scalar(v, f);
}

/** @private */
SceneJS._math_mat4 = function() {
    return new Array(16);
}

/** @private */
SceneJS._math_dupMat4 = function(m) {
    return m.slice(0, 16);
}

/** @private */
SceneJS._math_getCellMat4 = function(m, row, col) {
    return m[row + col * 4];
}

/** @private */
SceneJS._math_setCellMat4 = function(m, row, col, s) {
    m[row + col * 4] = s;
}

/** @private */
SceneJS._math_getRowMat4 = function(m, r) {
    return [m[r + 0], m[r + 4], m[r + 8], m[r + 12]];
}

/** @private */
SceneJS._math_setRowMat4 = function(m, r, v) {
    m[r + 0] = v[0];
    m[r + 4] = v[1];
    m[r + 8] = v[2];
    m[r + 12] = v[3];
}

/** @private */
SceneJS._math_setRowMat4c = function(m, r, x, y, z, w) {
    SceneJS._math_setRowMat4(m, r, [x,y,z,w]);
}

/** @private */
SceneJS._math_setRowMat4s = function(m, r, s) {
    SceneJS._math_setRowMat4c(m, r, s, s, s, s);
}

/** @private */
SceneJS._math_getColMat4 = function(m, c) {
    var i = c * 4;
    return [m[i + 0], m[i + 1],m[i + 2],m[i + 3]];
}

/** @private */
SceneJS._math_setColMat4v = function(m, c, v) {
    var i = c * 4;
    m[i + 0] = v[0];
    m[i + 1] = v[1];
    m[i + 2] = v[2];
    m[i + 3] = v[3];
}

/** @private */
SceneJS._math_setColMat4c = function(m, c, x, y, z, w) {
    SceneJS._math_setColMat4v(m, c, [x,y,z,w]);
}

/** @private */
SceneJS._math_setColMat4Scalar = function(m, c, s) {
    SceneJS._math_setColMat4c(m, c, s, s, s, s);
}

/** @private */
SceneJS._math_mat4To3 = function(m) {
    return [
        m[0],m[1],m[2],
        m[4],m[5],m[6],
        m[8],m[9],m[10]
    ];
}

/** @private */
SceneJS._math_m4s = function(s) {
    return [
        s,s,s,s,
        s,s,s,s,
        s,s,s,s,
        s,s,s,s
    ];
}

/** @private */
SceneJS._math_setMat4ToZeroes = function() {
    return SceneJS._math_m4s(0.0);
}

/** @private */
SceneJS._math_setMat4ToOnes = function() {
    return SceneJS._math_m4s(1.0);
}

/** @private */
SceneJS._math_diagonalMat4v = function(v) {
    return [
        v[0], 0.0, 0.0, 0.0,
        0.0,v[1], 0.0, 0.0,
        0.0, 0.0, v[2],0.0,
        0.0, 0.0, 0.0, v[3]
    ];
}

/** @private */
SceneJS._math_diagonalMat4c = function(x, y, z, w) {
    return SceneJS._math_diagonalMat4v([x,y,z,w]);
}

/** @private */
SceneJS._math_diagonalMat4s = function(s) {
    return SceneJS._math_diagonalMat4c(s, s, s, s);
}

/** @private */
SceneJS._math_identityMat4 = function() {
    return SceneJS._math_diagonalMat4s(1.0);
}

/** @private */
SceneJS._math_isIdentityMat4 = function(m) {
    var i = 0;
    var j = 0;
    var s = 0.0;
    for (i = 0; i < 4; ++i) {
        for (j = 0; j < 4; ++j) {
            s = m[i + j * 4];
            if ((i == j)) {
                if (s != 1.0) {
                    return false;
                }
            }
            else {
                if (s != 0.0) {
                    return false;
                }
            }
        }
    }
    return true;
}

/** @private */
SceneJS._math_negateMat4 = function(m) {
    var r = SceneJS._math_mat4();
    for (var i = 0; i < 16; ++i) {
        r[i] = -m[i];
    }
    return r;
}

/** @private */
SceneJS._math_addMat4 = function(a, b) {
    var r = SceneJS._math_mat4();
    for (var i = 0; i < 16; ++i) {
        r[i] = a[i] + b[i];
    }
    return r;
}

/** @private */
SceneJS._math_addMat4Scalar = function(m, s) {
    var r = SceneJS._math_mat4();
    for (var i = 0; i < 16; ++i) {
        r[i] = m[i] + s;
    }
    return r;
}

/** @private */
SceneJS._math_addScalarMat4 = function(s, m) {
    return SceneJS._math_addMat4Scalar(m, s);
}

/** @private */
SceneJS._math_subMat4 = function(a, b) {
    var r = SceneJS._math_mat4();
    for (var i = 0; i < 16; ++i) {
        r[i] = a[i] - b[i];
    }
    return r;
}

/** @private */
SceneJS._math_subMat4Scalar = function(m, s) {
    var r = SceneJS._math_mat4();
    for (var i = 0; i < 16; ++i) {
        r[i] = m[i] - s;
    }
    return r;
}

/** @private */
SceneJS._math_subScalarMat4 = function(s, m) {
    var r = SceneJS._math_mat4();
    for (var i = 0; i < 16; ++i) {
        r[i] = s - m[i];
    }
    return r;
}

/** @private */
SceneJS._math_mulMat4 = function(a, b) {
    var r = SceneJS._math_mat4();
    var i = 0;
    var j = 0;
    var k = 0;
    var s = 0.0;
    for (i = 0; i < 4; ++i) {
        for (j = 0; j < 4; ++j) {
            s = 0.0;
            for (k = 0; k < 4; ++k) {
                s += a[i + k * 4] * b[k + j * 4];
            }
            r[i + j * 4] = s;
        }
    }
    return r;
}

/** @private */
SceneJS._math_mulMat4s = function(m, s)
{
    var r = SceneJS._math_mat4();
    for (var i = 0; i < 16; ++i) {
        r[i] = m[i] * s;
    }
    return r;
}

/** @private */
SceneJS._math_mulMat4v4 = function(m, v) {
    return [
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
        m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]
    ];
}

/** @private */
SceneJS._math_transposeMat4 = function(m) {
    var r = SceneJS._math_mat4();
    var i = 0;
    var j = 0;
    for (i = 0; i < 4; ++i) {
        for (j = 0; j < 4; ++j) {
            r[i + j * 4] = m[i * 4 + j];
        }
    }
    return r;
}

/** @private */
SceneJS._math_determinantMat4 = function(m) {
    var f = SceneJS._math_getCellMat4;
    return (
            f(m, 0, 3) * f(m, 1, 2) * f(m, 2, 1) * f(m, 3, 0) - f(m, 0, 2) * f(m, 1, 3) * f(m, 2, 1) * f(m, 3, 0) - f(m, 0, 3) * f(m, 1, 1) * f(m, 2, 2) * f(m, 3, 0) + f(m, 0, 1) * f(m, 1, 3) * f(m, 2, 2) * f(m, 3, 0) +
            f(m, 0, 2) * f(m, 1, 1) * f(m, 2, 3) * f(m, 3, 0) - f(m, 0, 1) * f(m, 1, 2) * f(m, 2, 3) * f(m, 3, 0) - f(m, 0, 3) * f(m, 1, 2) * f(m, 2, 0) * f(m, 3, 1) + f(m, 0, 2) * f(m, 1, 3) * f(m, 2, 0) * f(m, 3, 1) +
            f(m, 0, 3) * f(m, 1, 0) * f(m, 2, 2) * f(m, 3, 1) - f(m, 0, 0) * f(m, 1, 3) * f(m, 2, 2) * f(m, 3, 1) - f(m, 0, 2) * f(m, 1, 0) * f(m, 2, 3) * f(m, 3, 1) + f(m, 0, 0) * f(m, 1, 2) * f(m, 2, 3) * f(m, 3, 1) +
            f(m, 0, 3) * f(m, 1, 1) * f(m, 2, 0) * f(m, 3, 2) - f(m, 0, 1) * f(m, 1, 3) * f(m, 2, 0) * f(m, 3, 2) - f(m, 0, 3) * f(m, 1, 0) * f(m, 2, 1) * f(m, 3, 2) + f(m, 0, 0) * f(m, 1, 3) * f(m, 2, 1) * f(m, 3, 2) +
            f(m, 0, 1) * f(m, 1, 0) * f(m, 2, 3) * f(m, 3, 2) - f(m, 0, 0) * f(m, 1, 1) * f(m, 2, 3) * f(m, 3, 2) - f(m, 0, 2) * f(m, 1, 1) * f(m, 2, 0) * f(m, 3, 3) + f(m, 0, 1) * f(m, 1, 2) * f(m, 2, 0) * f(m, 3, 3) +
            f(m, 0, 2) * f(m, 1, 0) * f(m, 2, 1) * f(m, 3, 3) - f(m, 0, 0) * f(m, 1, 2) * f(m, 2, 1) * f(m, 3, 3) - f(m, 0, 1) * f(m, 1, 0) * f(m, 2, 2) * f(m, 3, 3) + f(m, 0, 0) * f(m, 1, 1) * f(m, 2, 2) * f(m, 3, 3)
            );
}

/** @private */
SceneJS._math_inverseMat4 = function(m) {
    var m0 = m[ 0], m1 = m[ 1], m2 = m[ 2], m3 = m[ 3],
            m4 = m[ 4], m5 = m[ 5], m6 = m[ 6], m7 = m[ 7],
            m8 = m[ 8], m9 = m[ 9], m10 = m[10], m11 = m[11],
            m12 = m[12], m13 = m[13], m14 = m[14], m15 = m[15]  ;

    var n = SceneJS._math_identityMat4();

    n[ 0] = (m9 * m14 * m7 - m13 * m10 * m7 + m13 * m6 * m11 - m5 * m14 * m11 - m9 * m6 * m15 + m5 * m10 * m15);
    n[ 1] = (m13 * m10 * m3 - m9 * m14 * m3 - m13 * m2 * m11 + m1 * m14 * m11 + m9 * m2 * m15 - m1 * m10 * m15);
    n[ 2] = (m5 * m14 * m3 - m13 * m6 * m3 + m13 * m2 * m7 - m1 * m14 * m7 - m5 * m2 * m15 + m1 * m6 * m15);
    n[ 3] = (m9 * m6 * m3 - m5 * m10 * m3 - m9 * m2 * m7 + m1 * m10 * m7 + m5 * m2 * m11 - m1 * m6 * m11);

    n[ 4] = (m12 * m10 * m7 - m8 * m14 * m7 - m12 * m6 * m11 + m4 * m14 * m11 + m8 * m6 * m15 - m4 * m10 * m15);
    n[ 5] = (m8 * m14 * m3 - m12 * m10 * m3 + m12 * m2 * m11 - m0 * m14 * m11 - m8 * m2 * m15 + m0 * m10 * m15);
    n[ 6] = (m12 * m6 * m3 - m4 * m14 * m3 - m12 * m2 * m7 + m0 * m14 * m7 + m4 * m2 * m15 - m0 * m6 * m15);
    n[ 7] = (m4 * m10 * m3 - m8 * m6 * m3 + m8 * m2 * m7 - m0 * m10 * m7 - m4 * m2 * m11 + m0 * m6 * m11);

    n[ 8] = (m8 * m13 * m7 - m12 * m9 * m7 + m12 * m5 * m11 - m4 * m13 * m11 - m8 * m5 * m15 + m4 * m9 * m15);
    n[ 9] = (m12 * m9 * m3 - m8 * m13 * m3 - m12 * m1 * m11 + m0 * m13 * m11 + m8 * m1 * m15 - m0 * m9 * m15);
    n[10] = (m4 * m13 * m3 - m12 * m5 * m3 + m12 * m1 * m7 - m0 * m13 * m7 - m4 * m1 * m15 + m0 * m5 * m15);
    n[11] = (m8 * m5 * m3 - m4 * m9 * m3 - m8 * m1 * m7 + m0 * m9 * m7 + m4 * m1 * m11 - m0 * m5 * m11);

    n[12] = (m12 * m9 * m6 - m8 * m13 * m6 - m12 * m5 * m10 + m4 * m13 * m10 + m8 * m5 * m14 - m4 * m9 * m14);
    n[13] = (m8 * m13 * m2 - m12 * m9 * m2 + m12 * m1 * m10 - m0 * m13 * m10 - m8 * m1 * m14 + m0 * m9 * m14);
    n[14] = (m12 * m5 * m2 - m4 * m13 * m2 - m12 * m1 * m6 + m0 * m13 * m6 + m4 * m1 * m14 - m0 * m5 * m14);
    n[15] = (m4 * m9 * m2 - m8 * m5 * m2 + m8 * m1 * m6 - m0 * m9 * m6 - m4 * m1 * m10 + m0 * m5 * m10);

    var s = 1.0 / (
            m12 * m9 * m6 * m3 - m8 * m13 * m6 * m3 - m12 * m5 * m10 * m3 + m4 * m13 * m10 * m3 +
            m8 * m5 * m14 * m3 - m4 * m9 * m14 * m3 - m12 * m9 * m2 * m7 + m8 * m13 * m2 * m7 +
            m12 * m1 * m10 * m7 - m0 * m13 * m10 * m7 - m8 * m1 * m14 * m7 + m0 * m9 * m14 * m7 +
            m12 * m5 * m2 * m11 - m4 * m13 * m2 * m11 - m12 * m1 * m6 * m11 + m0 * m13 * m6 * m11 +
            m4 * m1 * m14 * m11 - m0 * m5 * m14 * m11 - m8 * m5 * m2 * m15 + m4 * m9 * m2 * m15 +
            m8 * m1 * m6 * m15 - m0 * m9 * m6 * m15 - m4 * m1 * m10 * m15 + m0 * m5 * m10 * m15
            );
    for (var i = 0; i < 16; ++i) {
        n[i] *= s;
    }
    return n;
}

/** @private */
SceneJS._math_traceMat4 = function(m) {
    return (m[0] + m[5] + m[10] + m[15]);
}

/** @private */
SceneJS._math_translationMat4v = function(v) {
    var m = SceneJS._math_identityMat4();
    m[12] = v[0];
    m[13] = v[1];
    m[14] = v[2];
    return m;
}

/** @private */
SceneJS._math_translationMat4c = function(x, y, z) {
    return SceneJS._math_translationMat4v([x,y,z]);
}

/** @private */
SceneJS._math_translationMat4s = function(s) {
    return SceneJS._math_translationMat4c(s, s, s);
}

/** @private */
SceneJS._math_rotationMat4v = function(anglerad, axis) {
    var ax = SceneJS._math_normalizeVec4([axis[0],axis[1],axis[2],0.0]);
    var s = Math.sin(anglerad);
    var c = Math.cos(anglerad);
    var q = 1.0 - c;

    var x = ax[0];
    var y = ax[1];
    var z = ax[2];

    var xx,yy,zz,xy,yz,zx,xs,ys,zs;

    xx = x * x;
    yy = y * y;
    zz = z * z;
    xy = x * y;
    yz = y * z;
    zx = z * x;
    xs = x * s;
    ys = y * s;
    zs = z * s;

    var m = SceneJS._math_mat4();

    m[0] = (q * xx) + c;
    m[1] = (q * xy) + zs;
    m[2] = (q * zx) - ys;
    m[3] = 0.0;

    m[4] = (q * xy) - zs;
    m[5] = (q * yy) + c;
    m[6] = (q * yz) + xs;
    m[7] = 0.0;

    m[8] = (q * zx) + ys;
    m[9] = (q * yz) - xs;
    m[10] = (q * zz) + c;
    m[11] = 0.0;

    m[12] = 0.0;
    m[13] = 0.0;
    m[14] = 0.0;
    m[15] = 1.0;

    return m;
}

/** @private */
SceneJS._math_rotationMat4c = function(anglerad, x, y, z) {
    return SceneJS._math_rotationMat4v(anglerad, [x,y,z]);
}

/** @private */
SceneJS._math_scalingMat4v = function(v) {
    var m = SceneJS._math_identityMat4();
    m[0] = v[0];
    m[5] = v[1];
    m[10] = v[2];
    return m;
}

/** @private */
SceneJS._math_scalingMat4c = function(x, y, z) {
    return SceneJS._math_scalingMat4v([x,y,z]);
}

/** @private */
SceneJS._math_scalingMat4s = function(s) {
    return SceneJS._math_scalingMat4c(s, s, s);
}

/** @private */
SceneJS._math_lookAtMat4v = function(pos, target, up) {
    var pos4 = [pos[0],pos[1],pos[2],0.0];
    var target4 = [target[0],target[1],target[2],0.0];
    var up4 = [up[0],up[1],up[2],0.0];

    var v = SceneJS._math_normalizeVec4(SceneJS._math_subVec4(target4, pos4));
    var u = SceneJS._math_normalizeVec4(up4);
    var s = SceneJS._math_normalizeVec4(SceneJS._math_cross3Vec4(v, u));

    u = SceneJS._math_normalizeVec4(SceneJS._math_cross3Vec4(s, v));

    var m = SceneJS._math_mat4();

    m[0] = s[0];
    m[1] = u[0];
    m[2] = -v[0];
    m[3] = 0.0;

    m[4] = s[1];
    m[5] = u[1];
    m[6] = -v[1];
    m[7] = 0.0;

    m[8] = s[2];
    m[9] = u[2];
    m[10] = -v[2];
    m[11] = 0.0;

    m[12] = 0.0;
    m[13] = 0.0;
    m[14] = 0.0;
    m[15] = 1.0;

    m = SceneJS._math_mulMat4(m, SceneJS._math_translationMat4v(SceneJS._math_negateVector4(pos4)));

    return m;
}

/** @private */
SceneJS._math_lookAtMat4c = function(posx, posy, posz, targetx, targety, targetz, upx, upy, upz) {
    return SceneJS._math_lookAtMat4v([posx,posy,posz], [targetx,targety,targetz], [upx,upy,upz]);
}

/** @private */
SceneJS._math_orthoMat4v = function(omin, omax) {
    var omin4 = [omin[0],omin[1],omin[2],0.0];
    var omax4 = [omax[0],omax[1],omax[2],0.0];
    var vsum = SceneJS._math_addVec4(omax4, omin4);
    var vdif = SceneJS._math_subVec4(omax4, omin4);

    var m = SceneJS._math_mat4();

    m[0] = 2.0 / vdif[0];
    m[1] = 0.0;
    m[2] = 0.0;
    m[3] = 0.0;

    m[4] = 0.0;
    m[5] = 2.0 / vdif[1];
    m[6] = 0.0;
    m[7] = 0.0;

    m[8] = 0.0;
    m[9] = 0.0;
    m[10] = -2.0 / vdif[2];
    m[11] = 0.0;

    m[12] = -vsum[0] / vdif[0];
    m[13] = -vsum[1] / vdif[1];
    m[14] = -vsum[2] / vdif[2];
    m[15] = 1.0;

    return m;
}

/** @private */
SceneJS._math_orthoMat4c = function(left, right, bottom, top, znear, zfar) {
    return SceneJS._math_orthoMat4v([left,bottom,znear], [right,top,zfar]);
}

/** @private */
SceneJS._math_frustumMat4v = function(fmin, fmax) {
    var fmin4 = [fmin[0],fmin[1],fmin[2],0.0];
    var fmax4 = [fmax[0],fmax[1],fmax[2],0.0];
    var vsum = SceneJS._math_addVec4(fmax4, fmin4);
    var vdif = SceneJS._math_subVec4(fmax4, fmin4);
    var t = 2.0 * fmin4[2];

    var m = SceneJS._math_mat4();

    m[0] = t / vdif[0];
    m[1] = 0.0;
    m[2] = 0.0;
    m[3] = 0.0;

    m[4] = 0.0;
    m[5] = t / vdif[1];
    m[6] = 0.0;
    m[7] = 0.0;

    m[8] = vsum[0] / vdif[0];
    m[9] = vsum[1] / vdif[1];
    m[10] = -vsum[2] / vdif[2];
    m[11] = -1.0;

    m[12] = 0.0;
    m[13] = 0.0;
    m[14] = -t * fmax4[2] / vdif[2];
    m[15] = 0.0;

    return m;
}

/** @private */
SceneJS._math_frustumMatrix4 = function(left, right, bottom, top, znear, zfar) {
    return SceneJS._math_frustumMat4v([left, bottom, znear], [right, top, zfar]);
}

/** @private */
SceneJS._math_perspectiveMatrix4 = function(fovyrad, aspectratio, znear, zfar) {
    var pmin = new Array(4);
    var pmax = new Array(4);

    pmin[2] = znear;
    pmax[2] = zfar;

    pmax[1] = pmin[2] * Math.tan(fovyrad / 2.0);
    pmin[1] = -pmax[1];

    pmax[0] = pmax[1] * aspectratio;
    pmin[0] = -pmax[0];

    return SceneJS._math_frustumMat4v(pmin, pmax);
};

/** @private */
SceneJS._math_transformPoint3 = function(m, p) {
    return [
        (m[0] * p[0]) + (m[4] * p[1]) + (m[8] * p[2]) + m[12],
        (m[1] * p[0]) + (m[5] * p[1]) + (m[9] * p[2]) + m[13],
        (m[2] * p[0]) + (m[6] * p[1]) + (m[10] * p[2]) + m[14],
        (m[3] * p[0]) + (m[7] * p[1]) + (m[11] * p[2]) + m[15]
    ];
}


/** @private */
SceneJS._math_transformPoints3 = function(m, points) {
    var result = new Array(points.length);
    var len = points.length;
    for (var i = 0; i < len; i++) {
        result[i] = SceneJS._math_transformPoint3(m, points[i]);
    }
    return result;
}

/** @private */
SceneJS._math_transformVector3 = function(m, v) {
    return [
        (m[0] * v[0]) + (m[4] * v[1]) + (m[8] * v[2]),
        (m[1] * v[0]) + (m[5] * v[1]) + (m[9] * v[2]),
        (m[2] * v[0]) + (m[6] * v[1]) + (m[10] * v[2])
    ];
}

/** @private */
SceneJS._math_projectVec4 = function(v) {
    var f = 1.0 / v[3];
    return [v[0] * f, v[1] * f, v[2] * f, 1.0];
}


/** @private */
SceneJS._math_Plane3 = function (normal, offset, normalize) {
    this.normal = [0.0, 0.0, 1.0 ];
    this.offset = 0.0;
    if (normal && offset) {
        this.normal[0] = normal[0];
        this.normal[1] = normal[1];
        this.normal[2] = normal[2];
        this.offset = offset;

        if (normalize) {
            var s = Math.sqrt(
                    this.normal[0] * this.normal[0] +
                    this.normal[1] * this.normal[1] +
                    this.normal[2] * this.normal[2]
                    );
            if (s > 0.0) {
                s = 1.0 / s;
                this.normal[0] *= s;
                this.normal[1] *= s;
                this.normal[2] *= s;
                this.offset *= s;
            }
        }
    }
}

/** @private */
SceneJS._math_MAX_DOUBLE = 1000000000000.0;
/** @private */
SceneJS._math_MIN_DOUBLE = -1000000000000.0;

/** @private
 *
 */
SceneJS._math_Box3 = function(min, max) {
    this.min = min || [ SceneJS._math_MAX_DOUBLE,SceneJS._math_MAX_DOUBLE,SceneJS._math_MAX_DOUBLE ];
    this.max = max || [ SceneJS._math_MIN_DOUBLE,SceneJS._math_MIN_DOUBLE,SceneJS._math_MIN_DOUBLE ];

    /** @private */
    this.init = function(min, max) {
        for (var i = 0; i < 3; ++i) {
            this.min[i] = min[i];
            this.max[i] = max[i];
        }
        return this;
    };

    /** @private */
    this.fromPoints = function(points) {
        var points2 = [];
        for (var i = 0; i < points.length; i++) {
            points2.push([points[i][0] / points[i][3], points[i][1] / points[i][3], points[i][2] / points[i][3]]);
        }
        points = points2;
        for (var i = 0; i < points.length; i++) {
            var v = points[i];
            for (var j = 0; j < 3; j++) {
                if (v[j] < this.min[j]) {
                    this.min[j] = v[j];
                }
                if (v[j] > this.max[j]) {
                    this.max[j] = v[j];
                }
            }
        }
        return this;
    };

    /** @private */
    this.isEmpty = function() {
        return (
                (this.min[0] >= this.max[0])
                        && (this.min[1] >= this.max[1])
                        && (this.min[2] >= this.max[2])
                );
    };

    /** @private */
    this.getCenter = function() {
        return [
            (this.max[0] + this.min[0]) / 2.0,
            (this.max[1] + this.min[1]) / 2.0,
            (this.max[2] + this.min[2]) / 2.0
        ];
    };

    /** @private */
    this.getSize = function() {
        return [
            (this.max[0] - this.min[0]),
            (this.max[1] - this.min[1]),
            (this.max[2] - this.min[2])
        ];
    };

    /** @private */
    this.getFacesAreas = function() {
        var s = this.size;
        return [
            (s[1] * s[2]),
            (s[0] * s[2]),
            (s[0] * s[1])
        ];
    };

    /** @private */
    this.getSurfaceArea = function() {
        var a = this.getFacesAreas();
        return ((a[0] + a[1] + a[2]) * 2.0);
    };

    /** @private */
    this.getVolume = function() {
        var s = this.size;
        return (s[0] * s[1] * s[2]);
    };

    /** @private */
    this.getOffset = function(half_delta) {
        for (var i = 0; i < 3; ++i) {
            this.min[i] -= half_delta;
            this.max[i] += half_delta;
        }
        return this;
    };
}

/** @private
 *
 * @param min
 * @param max
 */
SceneJS._math_AxisBox3 = function(min, max) {
    this.verts = [
        [min[0], min[1], min[2]],
        [max[0], min[1], min[2]],
        [max[0], max[1], min[2]],
        [min[0], max[1], min[2]],

        [min[0], min[1], max[2]],
        [max[0], min[1], max[2]],
        [max[0], max[1], max[2]],
        [min[0], max[1], max[2]]
    ];

    /** @private */
    this.toBox3 = function() {
        var box = new SceneJS._math_Box3();
        for (var i = 0; i < 8; i++) {
            var v = this.verts[i];
            for (var j = 0; j < 3; j++) {
                if (v[j] < box.min[j]) {
                    box.min[j] = v[j];
                }
                if (v[j] > box.max[j]) {
                    box.max[j] = v[j];
                }
            }
        }
    };
}

/** @private
 *
 * @param center
 * @param radius
 */
SceneJS._math_Sphere3 = function(center, radius) {
    this.center = [center[0], center[1], center[2] ];
    this.radius = radius;

    /** @private */
    this.isEmpty = function() {
        return (this.radius == 0.0);
    };

    /** @private */
    this.surfaceArea = function() {
        return (4.0 * Math.PI * this.radius * this.radius);
    };

    /** @private */
    this.getVolume = function() {
        return ((4.0 / 3.0) * Math.PI * this.radius * this.radius * this.radius);
    };
}

/** Creates billboard matrix from given view matrix
 * @private
 */
SceneJS._math_billboardMat = function(viewMatrix) {
    var rotVec = [
        SceneJS._math_getColMat4(viewMatrix, 0),
        SceneJS._math_getColMat4(viewMatrix, 1),
        SceneJS._math_getColMat4(viewMatrix, 2)
    ];

    var scaleVec = [
        SceneJS._math_lenVec4(rotVec[0]),
        SceneJS._math_lenVec4(rotVec[1]),
        SceneJS._math_lenVec4(rotVec[2])
    ];

    var scaleVecRcp = SceneJS._math_rcpVec3(scaleVec);
    var sMat = SceneJS._math_scalingMat4v(scaleVec);
    var sMatInv = SceneJS._math_scalingMat4v(scaleVecRcp);

    rotVec[0] = SceneJS._math_mulVec4Scalar(rotVec[0], scaleVecRcp[0]);
    rotVec[1] = SceneJS._math_mulVec4Scalar(rotVec[1], scaleVecRcp[1]);
    rotVec[2] = SceneJS._math_mulVec4Scalar(rotVec[2], scaleVecRcp[2]);

    var rotMatInverse = SceneJS._math_identityMat4();

    SceneJS._math_setRowMat4(rotMatInverse, 0, rotVec[0]);
    SceneJS._math_setRowMat4(rotMatInverse, 1, rotVec[1]);
    SceneJS._math_setRowMat4(rotMatInverse, 2, rotVec[2]);

    return SceneJS._math_mulMat4(rotMatInverse, sMat);
    // return SceneJS._math_mulMat4(sMat, SceneJS._math_mulMat4(rotMatInverse, sMat));
    //return SceneJS._math_mulMat4(sMatInv, SceneJS._math_mulMat4(rotMatInverse, sMat));
}

/** @private */
SceneJS._math_FrustumPlane =  function(nx, ny, nz, offset) {
    var s = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    this.normal = [nx * s, ny * s, nz * s];
    this.offset = offset * s;
    this.testVertex = [
        (this.normal[0] >= 0.0) ? (1) : (0),
        (this.normal[1] >= 0.0) ? (1) : (0),
        (this.normal[2] >= 0.0) ? (1) : (0)];
}

/** @private */
SceneJS._math_OUTSIDE_FRUSTUM = 3;
/** @private */
SceneJS._math_INTERSECT_FRUSTUM = 4;
/** @private */
 SceneJS._math_INSIDE_FRUSTUM = 5;

/** @private */
 SceneJS._math_Frustum =  function(viewMatrix, projectionMatrix, viewport) {
    var m = SceneJS._math_mulMat4(projectionMatrix, viewMatrix);
    var q = [ m[3], m[7], m[11] ];
    var planes = [
        new SceneJS._math_FrustumPlane(q[ 0] - m[ 0], q[ 1] - m[ 4], q[ 2] - m[ 8], m[15] - m[12]),
        new SceneJS._math_FrustumPlane(q[ 0] + m[ 0], q[ 1] + m[ 4], q[ 2] + m[ 8], m[15] + m[12]),
        new SceneJS._math_FrustumPlane(q[ 0] - m[ 1], q[ 1] - m[ 5], q[ 2] - m[ 9], m[15] - m[13]),
        new SceneJS._math_FrustumPlane(q[ 0] + m[ 1], q[ 1] + m[ 5], q[ 2] + m[ 9], m[15] + m[13]),
        new SceneJS._math_FrustumPlane(q[ 0] - m[ 2], q[ 1] - m[ 6], q[ 2] - m[10], m[15] - m[14]),
        new SceneJS._math_FrustumPlane(q[ 0] + m[ 2], q[ 1] + m[ 6], q[ 2] + m[10], m[15] + m[14])
    ];

    /* Resources for LOD
     */
    var rotVec = [
        SceneJS._math_getColMat4(viewMatrix, 0),
        SceneJS._math_getColMat4(viewMatrix, 1),
        SceneJS._math_getColMat4(viewMatrix, 2)
    ];

    var scaleVec = [
        SceneJS._math_lenVec4(rotVec[0]),
        SceneJS._math_lenVec4(rotVec[1]),
        SceneJS._math_lenVec4(rotVec[2])
    ];

    var scaleVecRcp = SceneJS._math_rcpVec3(scaleVec);
    var sMat = SceneJS._math_scalingMat4v(scaleVec);
    var sMatInv = SceneJS._math_scalingMat4v(scaleVecRcp);

    rotVec[0] = SceneJS._math_mulVec4Scalar(rotVec[0], scaleVecRcp[0]);
    rotVec[1] = SceneJS._math_mulVec4Scalar(rotVec[1], scaleVecRcp[1]);
    rotVec[2] = SceneJS._math_mulVec4Scalar(rotVec[2], scaleVecRcp[2]);

    var rotMatInverse = SceneJS._math_identityMat4();

    SceneJS._math_setRowMat4(rotMatInverse, 0, rotVec[0]);
    SceneJS._math_setRowMat4(rotMatInverse, 1, rotVec[1]);
    SceneJS._math_setRowMat4(rotMatInverse, 2, rotVec[2]);

    this.matrix = SceneJS._math_mulMat4(projectionMatrix, viewMatrix);
    this.billboardMatrix = SceneJS._math_mulMat4(sMatInv, SceneJS._math_mulMat4(rotMatInverse, sMat));
    this.viewport = viewport.slice(0, 4);

    /** @private */
    this.textAxisBoxIntersection = function(box) {
        var ret = SceneJS._math_INSIDE_FRUSTUM;
        var bminmax = [ box.min, box.max ];
        var plane = null;
        for (var i = 0; i < 6; ++i) {
            plane = planes[i];
            if (((plane.normal[0] * bminmax[plane.testVertex[0]][0]) +
                 (plane.normal[1] * bminmax[plane.testVertex[1]][1]) +
                 (plane.normal[2] * bminmax[plane.testVertex[2]][2]) +
                 (plane.offset)) < 0.0) {
                return SceneJS._math_OUTSIDE_FRUSTUM;
            }

            if (((plane.normal[0] * bminmax[1 - plane.testVertex[0]][0]) +
                 (plane.normal[1] * bminmax[1 - plane.testVertex[1]][1]) +
                 (plane.normal[2] * bminmax[1 - plane.testVertex[2]][2]) +
                 (plane.offset)) < 0.0) {
                ret = SceneJS._math_INTERSECT_FRUSTUM;
            }
        }
        return ret;
    };

    /** @private */
    this.getProjectedSize = function(box) {
        var diagVec = SceneJS._math_subVec3(box.max, box.min);

        var diagSize = SceneJS._math_lenVec3(diagVec);

        var size = Math.abs(diagSize);

        var p0 = [
            (box.min[0] + box.max[0]) * 0.5,
            (box.min[1] + box.max[1]) * 0.5,
            (box.min[2] + box.max[2]) * 0.5,
            0.0];

        var halfSize = size * 0.5;
        var p1 = [ -halfSize, 0.0, 0.0, 1.0 ];
        var p2 = [  halfSize, 0.0, 0.0, 1.0 ];

        p1 = SceneJS._math_mulMat4v4(this.billboardMatrix, p1);
        p1 = SceneJS._math_addVec4(p1, p0);
        p1 = SceneJS._math_projectVec4(SceneJS._math_mulMat4v4(this.matrix, p1));

        p2 = SceneJS._math_mulMat4v4(this.billboardMatrix, p2);
        p2 = SceneJS._math_addVec4(p2, p0);
        p2 = SceneJS._math_projectVec4(SceneJS._math_mulMat4v4(this.matrix, p2));

        return viewport[2] * Math.abs(p2[0] - p1[0]);
    };
}

SceneJS._math_identityQuaternion = function() {
    return [ 0.0, 0.0, 0.0, 1.0 ];
}

SceneJS._math_angleAxisQuaternion = function(x, y, z, degrees) {
    var angleRad = (degrees / 180.0) * Math.PI;
    //var angleRad = degrees;
    var halfAngle = angleRad / 2.0;
    var fsin = Math.sin(halfAngle);
    return [
        fsin * x,
        fsin * y,
        fsin * z,
        Math.cos(halfAngle)
    ];
}

SceneJS._math_mulQuaternions = function(p, q) {
    return [
        p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1],
        p[3] * q[1] + p[1] * q[3] + p[2] * q[0] - p[0] * q[2],
        p[3] * q[2] + p[2] * q[3] + p[0] * q[1] - p[1] * q[0],
        p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2]
    ];
}

SceneJS._math_newMat4FromQuaternion = function(q) {
    var tx = 2.0 * q[0];
    var ty = 2.0 * q[1];
    var tz = 2.0 * q[2];
    var twx = tx * q[3];
    var twy = ty * q[3];
    var twz = tz * q[3];
    var txx = tx * q[0];
    var txy = ty * q[0];
    var txz = tz * q[0];
    var tyy = ty * q[1];
    var tyz = tz * q[1];
    var tzz = tz * q[2];
    var m = SceneJS._math_identityMat4();
    SceneJS._math_setCellMat4(m, 0, 0, 1.0 - (tyy + tzz));
    SceneJS._math_setCellMat4(m, 0, 1, txy - twz);
    SceneJS._math_setCellMat4(m, 0, 2, txz + twy);
    SceneJS._math_setCellMat4(m, 1, 0, txy + twz);
    SceneJS._math_setCellMat4(m, 1, 1, 1.0 - (txx + tzz));
    SceneJS._math_setCellMat4(m, 1, 2, tyz - twx);
    SceneJS._math_setCellMat4(m, 2, 0, txz - twy);
    SceneJS._math_setCellMat4(m, 2, 1, tyz + twx);
    SceneJS._math_setCellMat4(m, 2, 2, 1.0 - (txx + tyy));
    return m;
}



//SceneJS._math_slerp(t, q1, q2) {
//    var result = SceneJS._math_identityQuaternion();
//    var cosHalfAngle = q1[3] * q2[3] + q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2];
//    if (Math.abs(cosHalfAngle) >= 1) {
//        return [ q1[0],q1[1], q1[2], q1[3] ];
//    } else {
//        var halfAngle = Math.acos(cosHalfAngle);
//        var sinHalfAngle = Math.sqrt(1 - cosHalfAngle * cosHalfAngle);
//        if (Math.abs(sinHalfAngle) < 0.001) {
//            return [
//                q1[0] * 0.5 + q2[0] * 0.5,
//                q1[1] * 0.5 + q2[1] * 0.5,
//                q1[2] * 0.5 + q2[2] * 0.5,
//                q1[3] * 0.5 + q2[3] * 0.5
//            ];
//        } else {
//            var a = Math.sin((1 - t) * halfAngle) / sinHalfAngle;
//            var b = Math.sin(t * halfAngle) / sinHalfAngle;
//            return [
//                q1[0] * a + q2[0] * b,
//                q1[1] * a + q2[1] * b,
//                q1[2] * a + q2[2] * b,
//                q1[3] * a + q2[3] * b
//            ];
//        }
//    }
//}

SceneJS._math_slerp = function(t, q1, q2) {
    var result = SceneJS._math_identityQuaternion();
    var q13 = q1[3] * 0.0174532925;
    var q23 = q2[3] * 0.0174532925;
    var cosHalfAngle = q13 * q23 + q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2];
    if (Math.abs(cosHalfAngle) >= 1) {
        return [ q1[0],q1[1], q1[2], q1[3] ];
    } else {
        var halfAngle = Math.acos(cosHalfAngle);
        var sinHalfAngle = Math.sqrt(1 - cosHalfAngle * cosHalfAngle);
        if (Math.abs(sinHalfAngle) < 0.001) {
            return [
                q1[0] * 0.5 + q2[0] * 0.5,
                q1[1] * 0.5 + q2[1] * 0.5,
                q1[2] * 0.5 + q2[2] * 0.5,
                q1[3] * 0.5 + q2[3] * 0.5
            ];
        } else {
            var a = Math.sin((1 - t) * halfAngle) / sinHalfAngle;
            var b = Math.sin(t * halfAngle) / sinHalfAngle;
            return [
                q1[0] * a + q2[0] * b,
                q1[1] * a + q2[1] * b,
                q1[2] * a + q2[2] * b,
                (q13 * a + q23 * b) * 57.295779579
            ];
        }
    }
}

SceneJS._math_normalizeQuaternion = function(q) {
    var len = SceneJS._math_lenVec3([q[0], q[1], q[2]]);
    return [ q[0] / len, q[1] / len, q[2] / len, q[3] / len ];
}

SceneJS._math_angleAxisFromQuaternion = function(q) {
    q = SceneJS._math_normalizeQuaternion(q);
    var angle = 2 * Math.acos(q[3]);
    var s = Math.sqrt(1 - q[3] * q[3]);
    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
        return {
            x : q[0],
            y : q[1],
            z : q[2],
            angle: angle
        };
    } else {
        return {
            x : q[0] / s,
            y : q[1] / s,
            z : q[2] / s,
            angle: angle
        };
    }
}
/** Private WebGL support classes
 */



/** Maps SceneJS node parameter names to WebGL enum names
 * @private
 */
SceneJS._webgl_enumMap = {
    funcAdd: "FUNC_ADD",
    funcSubtract: "FUNC_SUBTRACT",
    funcReverseSubtract: "FUNC_REVERSE_SUBTRACT",
    zero : "ZERO",
    one : "ONE",
    srcColor:"SRC_COLOR",
    oneMinusSrcColor:"ONE_MINUS_SRC_COLOR",
    dstColor:"DST_COLOR",
    oneMinusDstColor:"ONE_MINUS_DST_COLOR",
    srcAlpha:"SRC_ALPHA",
    oneMinusSrcAlpha:"ONE_MINUS_SRC_ALPHA",
    dstAlpha:"DST_ALPHA",
    oneMinusDstAlpha:"ONE_MINUS_DST_ALPHA",
    contantColor:"CONSTANT_COLOR",
    oneMinusConstantColor:"ONE_MINUS_CONSTANT_COLOR",
    constantAlpha:"CONSTANT_ALPHA",
    oneMinusConstantAlpha:"ONE_MINUS_CONSTANT_ALPHA",
    srcAlphaSaturate:"SRC_ALPHA_SATURATE",
    front: "FRONT",
    back: "BACK",
    frontAndBack: "FRONT_AND_BACK",
    never:"NEVER",
    less:"LESS",
    equal:"EQUAL",
    lequal:"LEQUAL",
    greater:"GREATER",
    notequal:"NOTEQUAL",
    gequal:"GEQUAL",
    always:"ALWAYS",
    cw:"CW",
    ccw:"CCW",
    linear: "LINEAR",
    nearest: "NEAREST",
    linearMipMapNearest : "LINEAR_MIPMAP_NEAREST",
    nearestMipMapNearest : "NEAREST_MIPMAP_NEAREST",
    nearestMipMapLinear: "NEAREST_MIPMAP_LINEAR",
    linearMipMapLinear: "LINEAR_MIPMAP_LINEAR",
    repeat: "REPEAT",
    clampToEdge: "CLAMP_TO_EDGE",
    mirroredRepeat: "MIRRORED_REPEAT",
    alpha:"ALPHA",
    rgb:"RGB",
    rgba:"RGBA",
    luminance:"LUMINANCE",
    luminanceAlpha:"LUMINANCE_ALPHA",
    textureBinding2D:"TEXTURE_BINDING_2D",
    textureBindingCubeMap:"TEXTURE_BINDING_CUBE_MAP",
    compareRToTexture:"COMPARE_R_TO_TEXTURE", // Hardware Shadowing Z-depth,
    unsignedByte: "UNSIGNED_BYTE"
};

/** @private
 */
SceneJS._webgl_fogModes = {
    EXP: 0,
    EXP2: 1,
    LINEAR: 2
};

/** @private */
SceneJS._webgl_ProgramUniform = function(context, program, name, type, size, location, logging) {

    var func = null;
    if (type == context.BOOL) {
        func = function (v) {
            context.uniform1i(location, v);
        };
    } else if (type == context.BOOL_VEC2) {
        func = function (v) {
            context.uniform2iv(location, v);
        };
    } else if (type == context.BOOL_VEC3) {
        func = function (v) {
            context.uniform3iv(location, v);
        };
    } else if (type == context.BOOL_VEC4) {
        func = function (v) {
            context.uniform4iv(location, v);
        };
    } else if (type == context.INT) {
        func = function (v) {
            context.uniform1iv(location, v);
        };
    } else if (type == context.INT_VEC2) {
        func = function (v) {
            context.uniform2iv(location, v);
        };
    } else if (type == context.INT_VEC3) {
        func = function (v) {
            context.uniform3iv(location, v);
        };
    } else if (type == context.INT_VEC4) {
        func = function (v) {
            context.uniform4iv(location, v);
        };
    } else if (type == context.FLOAT) {
        func = function (v) {
            context.uniform1f(location, v);
        };
    } else if (type == context.FLOAT_VEC2) {
        func = function (v) {
            context.uniform2fv(location, v);
        };
    } else if (type == context.FLOAT_VEC3) {
        func = function (v) {
            context.uniform3fv(location, v);
        };
    } else if (type == context.FLOAT_VEC4) {
        func = function (v) {
            context.uniform4fv(location, v);
        };
    } else if (type == context.FLOAT_MAT2) {
        func = function (v) {
            context.uniformMatrix2fv(location, context.FALSE, v);
        };
    } else if (type == context.FLOAT_MAT3) {
        func = function (v) {
            context.uniformMatrix3fv(location, context.FALSE, v);
        };
    } else if (type == context.FLOAT_MAT4) {
        func = function (v) {
            context.uniformMatrix4fv(location, context.FALSE, v);
        };
    } else {
        throw "Unsupported shader uniform type: " + type;
    }

    /** @private */
    this.setValue = function(v) {
        func(v);
    };

    /** @private */
    this.getValue = function() {
        return context.getUniform(program, location);
    };
}

/** @private */
SceneJS._webgl_ProgramSampler = function(context, program, name, type, size, location, logging) {
    //  logging.debug("Program sampler found in shader: " + name);
    this.bindTexture = function(texture, unit) {
        texture.bind(unit);
        context.uniform1i(location, unit);
    };
}

/** An attribute within a shader
 * @private
 */
SceneJS._webgl_ProgramAttribute = function(context, program, name, type, size, location, logging) {
    // logging.debug("Program attribute found in shader: " + name);
    this.bindFloatArrayBuffer = function(buffer) {
        buffer.bind();
        context.enableVertexAttribArray(location);

        context.vertexAttribPointer(location, buffer.itemSize, context.FLOAT, false, 0, 0);   // Vertices are not homogeneous - no w-element
    };

}

/**
 * A vertex/fragment shader in a program
 *
 * @private
 * @param context WebGL context
 * @param gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
 * @param source Source code for shader
 * @param logging Shader will write logging's debug channel as it compiles
 */
SceneJS._webgl_Shader = function(context, type, source, logging) {
    this.handle = context.createShader(type);

    //  logging.debug("Creating " + ((type == context.VERTEX_SHADER) ? "vertex" : "fragment") + " shader");
    this.valid = true;

    context.shaderSource(this.handle, source);
    context.compileShader(this.handle);

    if (context.getShaderParameter(this.handle, context.COMPILE_STATUS) != 0) {
        //    logging.debug("Shader compile succeeded:" + context.getShaderInfoLog(this.handle));
    }
    else {
        this.valid = false;
        logging.error("Shader compile failed:" + context.getShaderInfoLog(this.handle));
    }
    if (!this.valid) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.ShaderCompilationFailureException("Shader program failed to compile"));
    }
}


/**
 * A program on an active WebGL context
 *
 * @private
 * @param hash SceneJS-managed ID for program
 * @param lastUsed Time program was lst activated, for LRU cache eviction
 * @param context WebGL context
 * @param vertexSources Source codes for vertex shaders
 * @param fragmentSources Source codes for fragment shaders
 * @param logging Program and shaders will write to logging's debug channel as they compile and link
 */
SceneJS._webgl_Program = function(hash, lastUsed, context, vertexSources, fragmentSources, logging) {
    this.hash = hash;
    this.lastUsed = lastUsed;

    /* Create shaders from sources
     */
    var shaders = [];
    for (var i = 0; i < vertexSources.length; i++) {
        shaders.push(new SceneJS._webgl_Shader(context, context.VERTEX_SHADER, vertexSources[i], logging));
    }
    for (var i = 0; i < fragmentSources.length; i++) {
        shaders.push(new SceneJS._webgl_Shader(context, context.FRAGMENT_SHADER, fragmentSources[i], logging));
    }

    /* Create program, attach shaders, link and validate program
     */
    var handle = context.createProgram();

    for (var i = 0; i < shaders.length; i++) {
        var shader = shaders[i];
        if (shader.valid) {
            context.attachShader(handle, shader.handle);
        }
    }
    context.linkProgram(handle);
    context.validateProgram(handle);

    this.valid = true;
    this.valid = this.valid && (context.getProgramParameter(handle, context.LINK_STATUS) != 0);
    this.valid = this.valid && (context.getProgramParameter(handle, context.VALIDATE_STATUS) != 0);

    //     logging.debug("Creating shader program: '" + hash + "'");
    if (this.valid) {
        //  logging.debug("Program link succeeded: " + context.getProgramInfoLog(handle));
    }
    else {
        logging.debug("Program link failed: " + context.getProgramInfoLog(handle));
    }

    if (!this.valid) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.ShaderLinkFailureException("Shader program failed to link"));
    }

    /* Discover active uniforms and samplers
     */
    var uniforms = {};
    var samplers = {};

    var numUniforms = context.getProgramParameter(handle, context.ACTIVE_UNIFORMS);

    /* Patch for http://code.google.com/p/chromium/issues/detail?id=40175)  where
     * gl.getActiveUniform was producing uniform names that had a trailing NUL in Chrome 6.0.466.0 dev
     * Issue ticket at: https://xeolabs.lighthouseapp.com/projects/50643/tickets/124-076-live-examples-blank-canvas-in-chrome-5037599
     */
    for (var i = 0; i < numUniforms; ++i) {
        var u = context.getActiveUniform(handle, i);
        if (u) {
            var u_name = u.name;
            if (u_name[u_name.length - 1] == "\u0000") {
                u_name = u_name.substr(0, u_name.length - 1);
            }
            var location = context.getUniformLocation(handle, u_name);
            if ((u.type == context.SAMPLER_2D) || (u.type == context.SAMPLER_CUBE) || (u.type == 35682)) {

                samplers[u_name] = new SceneJS._webgl_ProgramSampler(
                        context,
                        handle,
                        u_name,
                        u.type,
                        u.size,
                        location,
                        logging);
            } else {
                uniforms[u_name] = new SceneJS._webgl_ProgramUniform(
                        context,
                        handle,
                        u_name,
                        u.type,
                        u.size,
                        location,
                        logging);
            }
        }
    }

    /* Discover attributes
     */
    var attributes = {};

    var numAttribs = context.getProgramParameter(handle, context.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < numAttribs; i++) {
        var a = context.getActiveAttrib(handle, i);
        if (a) {
            var location = context.getAttribLocation(handle, a.name);
            attributes[a.name] = new SceneJS._webgl_ProgramAttribute(
                    context,
                    handle,
                    a.name,
                    a.type,
                    a.size,
                    location,
                    logging);
        }
    }

    /** @private */
    this.bind = function() {
        context.useProgram(handle);
    };


    /** @private */
    this.setUniform = function(name, value) {
        var u = uniforms[name];
        if (u) {
            u.setValue(value);
        } else {
            //    logging.warn("Shader uniform load failed - uniform not found in shader : " + name);
        }
    };

    /** @private */
    this.bindFloatArrayBuffer = function(name, buffer) {
        var attr = attributes[name];
        if (attr) {
            attr.bindFloatArrayBuffer(buffer);
        } else {
            //  logging.warn("Shader attribute bind failed - attribute not found in shader : " + name);
        }
    };

    /** @private */
    this.bindTexture = function(name, texture, unit) {
        var sampler = samplers[name];
        if (sampler) {
            sampler.bindTexture(texture, unit);
        } else {
            //  logging.warn("Sampler not found: " + name);
        }
    };

    /** @private
     */
    this.unbind = function() {
        //     context.useProgram(0);
    };

    /** @private */
    this.destroy = function() {
        if (this.valid) {
            //   logging.debug("Destroying shader program: '" + hash + "'");
            context.deleteProgram(handle);
            for (var s in shaders) {
                context.deleteShader(shaders[s].handle);
            }
            attributes = null;
            uniforms = null;
            samplers = null;
            this.valid = false;
        }
    };
}

/** @private */
SceneJS._webgl_Texture2D = function(context, cfg) {
    //  cfg.logging.debug("Creating texture: '" + cfg.textureId + "'");
    this.canvas = cfg.canvas;
    this.textureId = cfg.textureId;
    this.handle = context.createTexture();
    this.target = context.TEXTURE_2D;
    this.minFilter = cfg.minFilter;
    this.magFilter = cfg.magFilter;
    this.wrapS = cfg.wrapS;
    this.wrapT = cfg.wrapT;

    context.bindTexture(this.target, this.handle);

    if (cfg.image) {

        /* Texture from image
         */
        context.texImage2D(context.TEXTURE_2D, 0, cfg.image, cfg.flipY);

        // context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, cfg.image);

        this.format = context.RGBA;
        this.width = cfg.image.width;
        this.height = cfg.image.height;
        this.isDepth = false;
        this.depthMode = 0;
        this.depthCompareMode = 0;
        this.depthCompareFunc = 0;

    } else {

        /* Texture from data
         */
        if (!cfg.texels) {
            if (cfg.sourceType == context.FLOAT) {
                cfg.texels = new WebGLFloatArray(cfg.width * cfg.height * 4);
            }
            else {
                cfg.texels = new WebGLUnsignedByteArray(cfg.width * cfg.height * 4);
            }
        }

        context.texImage2D(context.TEXTURE_2D, 0, cfg.internalFormat, cfg.width, cfg.height, 0, cfg.sourceFormat, cfg.sourceType, cfg.texels);

        if (cfg.isDepth) {
            if (cfg.depthMode) {
                context.texParameteri(context.TEXTURE_2D, context.DEPTH_TEXTURE_MODE, cfg.depthMode);
            }
            if (cfg.depthCompareMode) {
                context.texParameteri(context.TEXTURE_2D, context.TEXTURE_COMPARE_MODE, cfg.depthCompareMode);
            }
            if (cfg.depthCompareFunc) {
                context.texParameteri(context.TEXTURE_2D, context.TEXTURE_COMPARE_FUNC, cfg.depthCompareFunc);
            }
        }

        this.format = cfg.internalFormat;
        this.width = cfg.width;
        this.height = cfg.height;
        this.isDepth = cfg.isDepth;
        this.depthMode = cfg.depthMode;
        this.depthCompareMode = cfg.depthCompareMode;
        this.depthCompareFunc = cfg.depthCompareFunc;
    }

    if (cfg.minFilter) {
        context.texParameteri(// Filtered technique when scaling texture down
                context.TEXTURE_2D,
                context.TEXTURE_MIN_FILTER,
                cfg.minFilter);
    }

    if (cfg.magFilter) {
        context.texParameteri(// Filtering technique when scaling texture up
                context.TEXTURE_2D,
                context.TEXTURE_MAG_FILTER,
                cfg.magFilter);
    }
    if (cfg.wrapS) {
        context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_S,
                cfg.wrapS);
    }

    if (cfg.wrapT) {
        context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_T,
                cfg.wrapT);
    }

    /* Generate MIP map if required
     */
    if (cfg.minFilter == context.NEAREST_MIPMAP_NEAREST ||
        cfg.minFilter == context.LINEAR_MIPMAP_NEAREST ||
        cfg.minFilter == context.NEAREST_MIPMAP_LINEAR ||
        cfg.minFilter == context.LINEAR_MIPMAP_LINEAR) {

        context.generateMipmap(context.TEXTURE_2D);
    }

    context.bindTexture(this.target, null);

    /** @private */
    this.bind = function(unit) {
        context.activeTexture(context["TEXTURE" + unit]);
        context.bindTexture(this.target, this.handle);

    };

    /** @private */
    this.unbind = function(unit) {
        context.activeTexture(context["TEXTURE" + unit]);
        context.bindTexture(this.target, null);
    };

    /** @private */
    this.generateMipmap = function() {
        context.generateMipmap(context.TEXTURE_2D);
    };

    /** @private */
    this.destroy = function() {
        if (this.handle) {
            // cfg.logging.debug("Destroying texture");
            context.deleteTexture(this.handle);
            this.handle = null;
        }
    };
}

/** Buffer for vertices and indices
 *
 * @private
 * @param context  WebGL context
 * @param type     Eg. ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER
 * @param values   WebGL array wrapper
 * @param numItems Count of items in array wrapper
 * @param itemSize Size of each item
 * @param usage    Eg. STATIC_DRAW
 */
SceneJS._webgl_ArrayBuffer = function(context, type, values, numItems, itemSize, usage) {
    this.handle = context.createBuffer();
    context.bindBuffer(type, this.handle);
    context.bufferData(type, values, usage);
    this.handle.numItems = numItems;
    this.handle.itemSize = itemSize;
    context.bindBuffer(type, null);

    this.type = type;
    this.numItems = numItems;
    this.itemSize = itemSize;


    /** @private */
    this.bind = function() {
        context.bindBuffer(type, this.handle);
    };

    /** @private */
    this.unbind = function() {
        context.bindBuffer(type, null);
    };

    /** @private */
    this.destroy = function() {
        context.deleteBuffer(this.handle);
    };
}

//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Map of valid enum function argument positions.
 */

var glValidEnumContexts = {

       // Generic setters and getters

       'enable': { 0:true },
       'disable': { 0:true },
       'getParameter': { 0:true },

       // Rendering

       'drawArrays': { 0:true },
       'drawElements': { 0:true, 2:true },

       // Shaders

       'createShader': { 0:true },
       'getShaderParameter': { 1:true },
       'getProgramParameter': { 1:true },

       // Vertex attributes

       'getVertexAttrib': { 1:true },
       'vertexAttribPointer': { 2:true },

       // Textures

       'bindTexture': { 0:true },
       'activeTexture': { 0:true },
       'getTexParameter': { 0:true, 1:true },
       'texParameterf': { 0:true, 1:true },
       'texParameteri': { 0:true, 1:true, 2:true },
       'texImage2D': { 0:true, 2:true, 6:true, 7:true },
       'texSubImage2D': { 0:true, 6:true, 7:true },
       'copyTexImage2D': { 0:true, 2:true },
       'copyTexSubImage2D': { 0:true },
       'generateMipmap': { 0:true },

       // Buffer objects

       'bindBuffer': { 0:true },
       'bufferData': { 0:true, 2:true },
       'bufferSubData': { 0:true },
       'getBufferParameter': { 0:true, 1:true },

       // Renderbuffers and framebuffers

       'pixelStorei': { 0:true, 1:true },
       'readPixels': { 4:true, 5:true },
       'bindRenderbuffer': { 0:true },
       'bindFramebuffer': { 0:true },
       'checkFramebufferStatus': { 0:true },
       'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
       'framebufferTexture2D': { 0:true, 1:true, 2:true },
       'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
       'getRenderbufferParameter': { 0:true, 1:true },
       'renderbufferStorage': { 0:true, 1:true },

       // Frame buffer operations (clear, blend, depth test, stencil)

       'clear': { 0:true },
       'depthFunc': { 0:true },
       'blendFunc': { 0:true, 1:true },
       'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
       'blendEquation': { 0:true },
       'blendEquationSeparate': { 0:true, 1:true },
       'stencilFunc': { 0:true },
       'stencilFuncSeparate': { 0:true, 1:true },
       'stencilMaskSeparate': { 0:true },
       'stencilOp': { 0:true, 1:true, 2:true },
       'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

       // Culling

       'cullFace': { 0:true },
       'frontFace': { 0:true }
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums == null) {
    glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums == null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Returns true if 'value' matches any WebGL enum, and the i'th parameter
 * of the WebGL function 'fname' is expected to be (any) enum. Does not
 * check that 'value' is actually a valid i'th parameter to 'fname', as
 * that will be checked by the WebGL implementation itself.
 *
 * @param {string} fname the GL function to use for screening the enum
 * @param {integer} i the parameter index to use for screening the enum
 * @param {any} value the value to check for being a valid i'th parameter to 'fname'
 * @return {boolean} true if value matches one of the defined WebGL enums,
 *         and the i'th parameter to 'fname' is expected to be an enum
 *
 * @author Tomi Aarnio
 */
function mightBeValidEnum(fname, i, value) {
       if (!mightBeEnum(value)) return false;
       return (fname in glValidEnumContexts) && (i in glValidEnumContexts[fname]);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 */
function makeDebugContext(ctx, opt_onErrorFunc) {
  init(ctx);
  function formatFunctionCall(functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
          argStr += ((ii == 0) ? '' : ', ') +
              (mightBeEnum(args[ii]) ? glEnumToString(args[ii]) : args[ii]);
        }
        return functionName +  "(" + argStr + ")";
      };

  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        log("WebGL error "+ glEnumToString(err) + " in "+
            formatFunctionCall(functionName, args));
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  var tracing = false;

  ctx.setTracing = function (newTracing) {
      if (!tracing && newTracing) {
        log('gl.setTracing(' + newTracing + ');');
      }
      tracing = newTracing;
  }

  var escapeDict = {
    '\'' : '\\\'',
    '\"' : '\\\"',
    '\\' : '\\\\',
    '\b' : '\\b',
    '\f' : '\\f',
    '\n' : '\\n',
    '\r' : '\\r',
    '\t' : '\\t'
  };

  function quote(s) {
    var q = '\'';
    var l = s.length;
    for (var i = 0; i < l; i++) {
        var c = s.charAt(i);
        var d = s.charCodeAt(i);
        var e = escapeDict[c];
        if ( e != undefined ) {
            q += e;
        } else if ( d < 32 || d >= 128 ) {
            var h = '000' + d.toString(16);
            q += '\\u' + h.substring(h.length - 4);
        } else {
            q += s.charAt(i);
        }
    }
    q += '\'';
    return q;
  }

  function genSymMaker(name) {
      var counter = 0;
      return function() {
          var sym = name + counter;
          counter++;
          return sym;
      }
  }

  var constructorDict = {
    "createBuffer" : genSymMaker("buffer"),
    "createFrameBuffer": genSymMaker("frameBuffer"),
    "createProgram": genSymMaker("program"),
    "createRenderbuffer": genSymMaker("renderBuffer"),
    "createShader": genSymMaker("shader"),
    "createTexture": genSymMaker("texture"),
    "getUniformLocation": genSymMaker("uniformLocation"),
    "readPixels": genSymMaker("pixels")
  };

  var objectNameProperty = '__webgl_trace_name__';

  var arrayTypeDict = {
    "[object WebGLByteArray]" : "WebGLByteArray",
    "[object WebGLUnsignedByteArray]" : "WebGLUnsignedByteArray",
    "[object WebGLShortArray]" : "WebGLShortArray",
    "[object WebGLUnsignedShortArray]" : "WebGLUnsignedShortArray",
    "[object WebGLIntArray]" : "WebGLIntArray",
    "[object WebGLUnsignedIntArray]" : "WebGLUnsignedIntArray",
    "[object WebGLFloatArray]" : "WebGLFloatArray"
  }

  function asWebGLArray(a) {
    var arrayType = arrayTypeDict[a];
    if (arrayType === undefined) {
        return undefined;
    }
    var buf = 'new ' + arrayType + '( [';
    // for (var i = 0; i < a.length; i++) {
    //     if (i > 0 ) {
    //         buf += ', ';
    //     }
    //     buf += a.get(i);
    // }
    buf += '] )';
    return buf;
  };

  function traceFunctionCall(functionName, args) {
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
            var arg = args[ii];
            if ( ii > 0 ) {
                argStr += ', ';
            }
            var objectName;
            try {
            if (arg !== null && arg !== undefined) {
                objectName = arg[objectNameProperty];
            }
            } catch (e) {
                alert(functionName);
                throw e;
            }
            var webGLArray = asWebGLArray(arg);
            if (objectName != undefined ) {
                argStr += objectName;
            } else if (webGLArray != undefined) {
                argStr += webGLArray;
            }else if (typeof(arg) == "string") {
                argStr += quote(arg);
            } else if ( mightBeValidEnum(functionName, ii, arg) ) {
                argStr += 'gl.' + glEnumToString(arg);
            } else {
                argStr += arg;
            }
        }
        return "gl." + functionName +  "(" + argStr + ");";
  };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      var resultName;
      if (tracing) {
          var prefix = '';
          // Should we remember the result for later?
          objectNamer = constructorDict[functionName];
          if (objectNamer != undefined) {
              resultName = objectNamer();
              prefix = 'var ' + resultName + ' = ';
          }
          log(prefix + traceFunctionCall(functionName, arguments));
      }

      var result = ctx[functionName].apply(ctx, arguments);

      if (tracing && resultName != undefined) {
          result[objectNameProperty] = resultName;
      }

      var err = ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
      wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       wrapper[propertyName] = ctx[propertyName];
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow[err]) {
        glErrorShadow[err] = false;
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

return {
  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
   *            funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   */
  'makeDebugContext': makeDebugContext
};

}();
//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Which arguements are enums.
 * @type {!Object.<number, string>}
 */
var glValidEnumContexts = {

  // Generic setters and getters

  'enable': { 0:true },
  'disable': { 0:true },
  'getParameter': { 0:true },

  // Rendering

  'drawArrays': { 0:true },
  'drawElements': { 0:true, 2:true },

  // Shaders

  'createShader': { 0:true },
  'getShaderParameter': { 1:true },
  'getProgramParameter': { 1:true },

  // Vertex attributes

  'getVertexAttrib': { 1:true },
  'vertexAttribPointer': { 2:true },

  // Textures

  'bindTexture': { 0:true },
  'activeTexture': { 0:true },
  'getTexParameter': { 0:true, 1:true },
  'texParameterf': { 0:true, 1:true },
  'texParameteri': { 0:true, 1:true, 2:true },
  'texImage2D': { 0:true, 2:true, 6:true, 7:true },
  'texSubImage2D': { 0:true, 6:true, 7:true },
  'copyTexImage2D': { 0:true, 2:true },
  'copyTexSubImage2D': { 0:true },
  'generateMipmap': { 0:true },

  // Buffer objects

  'bindBuffer': { 0:true },
  'bufferData': { 0:true, 2:true },
  'bufferSubData': { 0:true },
  'getBufferParameter': { 0:true, 1:true },

  // Renderbuffers and framebuffers

  'pixelStorei': { 0:true, 1:true },
  'readPixels': { 4:true, 5:true },
  'bindRenderbuffer': { 0:true },
  'bindFramebuffer': { 0:true },
  'checkFramebufferStatus': { 0:true },
  'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
  'framebufferTexture2D': { 0:true, 1:true, 2:true },
  'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
  'getRenderbufferParameter': { 0:true, 1:true },
  'renderbufferStorage': { 0:true, 1:true },

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': { 0:true },
  'depthFunc': { 0:true },
  'blendFunc': { 0:true, 1:true },
  'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
  'blendEquation': { 0:true },
  'blendEquationSeparate': { 0:true, 1:true },
  'stencilFunc': { 0:true },
  'stencilFuncSeparate': { 0:true, 1:true },
  'stencilMaskSeparate': { 0:true },
  'stencilOp': { 0:true, 1:true, 2:true },
  'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

  // Culling

  'cullFace': { 0:true },
  'frontFace': { 0:true },
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums == null) {
    glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums == null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
}

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */ 
function glFunctionArgToString(functionName, argumentIndex, value) {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    if (funcInfo[argumentIndex]) {
      return glEnumToString(value);
    }
  }
  return value.toString();
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 */
function makeDebugContext(ctx, opt_onErrorFunc) {
  init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
          argStr += ((ii == 0) ? '' : ', ') + 
              glFunctionArgToString(functionName, ii, args[ii]);
        }
        log("WebGL error "+ glEnumToString(err) + " in "+ functionName +
            "(" + argStr + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      var result = ctx[functionName].apply(ctx, arguments);
      var err = ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
      wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       wrapper[propertyName] = ctx[propertyName];
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow[err]) {
        glErrorShadow[err] = false;
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

return {
  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Converts the argument of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 0, gl.TEXTURE_2D);
   *   
   * would return 'TEXTURE_2D'
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   */
  'glFunctionArgToString': glFunctionArgToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
   *            funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   */
  'makeDebugContext': makeDebugContext
};

}();

/**
 * @class Data scope that is passed as the single argument to the callback function that many scene node classes may be
 * dynamically configured through.
 * <p>These are created whenever data is generated within a scene graph, to transport the data down to sub-nodes.</p>
 * <p>Methods and nodes that create instances of these include {@link SceneJS.Scene#setData}, {@link SceneJS.WithData}
 * , {@link SceneJS.Generator} and {@link SceneJS.Interpolator}.</p>.
 * <p><b>Example:</b></p><p>The example below shows how nested creation of these will form a linked chain of data scopes.
 * The outer {@link SceneJS.WithData} node creates one SceneJS.Data with "sizeX" and "sizeY" properties, then the inner
 * {@link SceneJS.WithData} chains another SceneJS.Data to that, containing a "sizeZ" property. The dynamic config
 * callback on the {@link SceneJS.Scale} node then hunts up the chain to get each of the properties for the
 * configuration object it generates.</b></p><pre><code>
 *
 * var wd new SceneJS.WithData({
 *          sizeX: 5,
 *          sizeY: 6
 *      },
 *      new SceneJS.Translate({ x: 100 },
 *
 *          var wd new SceneJS.WithData({
 *              sizeZ: 2
 *          },
 *          new SceneJS.Scale(function(data) {        // Here's our SceneJS.Data object
 *                   return {
 *                       x: data.get("sizeX"),
 *                       y: data.get("sizeY"),
 *                       z: data.get("sizeZ")
 *                   }
 *          },
 *
 *              new SceneJS.objects.Cube()
 *          )
 *      )
 *  )
 * </code></pre>
 *
 */
SceneJS.Data = function(_parent, _fixed, _data) {
    this._parent = _parent;
    this._data = _data || {};
    this._fixed = _fixed || (_parent ? _parent._fixed : false);

    /** Hunts up the data scope chain to get the property with the given key, getting it off the
     * first data scope that has it.
     * @param {String} key Name of property
     * @returns {Object} The property
     */
    this.get = function(key) {
        var value = this._data[key];
        if ((value == 0) || value) {
            return value;
        }
        if (!this._parent) {
            return null;
        }
        return this._parent.get(key);
    };

    /**
     * Returns true if all data on the scope chain is fixed, ie. will not change between scene graph traversals.
     * @returns {boolean}
     */
    this.isFixed = function() {
        return this._fixed;
    };
};
/**
 * @class The basic scene node type, providing the ability to connect nodes into parent-child relationships to form scene graphs.
 *
 * <h1>Flexible Constructor Signature</h1>
 * <p>Node constructors have a flexible signature to support different forms of instantiation. They generally take
 * static and/or dynamic configuration arguments followed by zero or more child nodes.</p>
 *
 * <b>Simple static configuration</b>
 * <p>The simplest form is with a single static configuration object. For many nodes you only need to specify properties
 * where you want to override the node's defaults. Note the <b>sid</b> property, which is an optional subidentifier
 * which must be unique within the scope of the parent {@link SceneJS.Node}:</p>
 * <pre><code>
 * var n1 = new SceneJS.Scale({
 *                 sid:  "myScale",                // Optional subidentifier, unique within scope of parent node
 *                 info: "This is my Scale node",  // Optional metadata, useful for debugging
 *                 x:    100.0 },                  // Falls back on node's defaults of 1.0 for y and z
 *
 *                      new SceneJS.Geometry( ... )  // Child nodes, zero or more
 *             );
 * </code></pre>
 * Note the optional <b>info</b> property, which you can provide in order to attach a note that may be useful for
 * debugging, which may be got with {@link #getInfo}.
 * <h2>Dynamic configuration</h2>
 * <p>Dynamic configuration can be achieved through a callback that is invoked each time the node is rendered, which
 * will pull configs off the scene data scope (more explanation on that below):</p>
 * <pre><code>
 * var n2 = new SceneJS.Scale(
 *
 *                      function(data) {
 *                              return {
 *                                 x: data.get("scaleX"),    // Falls back on node's default of 1.0 when "scaleX" is null
 *                                 y: data.get("scaleY")
 *                              };
 *                      },
 *
 *                      new SceneJS.Geometry( ... )
 *             );
 * </code></pre>
 *
 * <h2>Static configuration with dynamic override</h2>
 * <p>A combination of static and dynamic configuration can be achieved through both a config object and a callback. The
 * config object's properties are set on the node immediately, then overridden by the callback at render-time:
 * <pre><code>
 * var n3 = new SceneJS.Scale(
 *
 *                      { x: 100.0 },                      // Falls back on node's defaults of 1.0 for y and z
 *
 *                      function(data) {
 *                              return {
 *                                 x: data.get("scaleX"),  // Falls back on 100.0 when "scaleX" is null
 *                                 y: data.get("scaleY")   // Falls back on node's default of 1.0 when "scaleY" is null
 *                              };
 *                      },
 *
 *                      new SceneJS.Geometry( ... ),     // A couple of child nodes this time, just for fun
 *                      new SceneJS.Geometry( ... )
 *             );
 * </pre></code>
 *
 * <h2>No configuration</h2>
 * <p>For many node types you can omit configuration altogether. This node falls back on defaults for all configs:</p>
 * <pre><code>
 * var n4 = new SceneJS.Scale(                           // Scales by defaults of 1.0 on X, Y and Z axis
 *
 *                  new SceneJS.Geometry( ... )        // Here's a child node
 *             );
 * </code></pre>
 *
 * <h2>A bit more on dynamic configuration</h2>
 * <p>The <b>data</b> parameter on the dynamic config callbacks shown above embodies a scene data scope. SceneJS
 * provides a fresh global data scope within each scene when it is rendered, into which you can inject data when you
 * render the scene graph. The example below demonstrates a property injected into the scope on render, which is then
 * pulled by a node's config callback when the node is rendered:
 * <pre><code>
 * var exampleScene = new SceneJS.Scene({ canvasId: 'theCanvas' },
 *
 *       new SceneJS.LookAt(
 *                      function(data) {
 *                            return {
 *                                eye  : data.get("eye"),
 *                                look : { x: 0, y: 0, z: 0 },
 *                                up   : { x: 0, y: 1, z: 0 }
 *                            };
 *                      },
 *
 *                      // ... chld nodes ...
 *                  );
 *
 * exampleScene
 *     .setData({ eye: { x: 0, y: 0, z: -100 })
 *         .render()
 * </code></pre>
 * <p>Using {@link SceneJS.WithData} nodes, you can create chains of sub-data scopes, to feed data down into the scene
 * hierarchy.</p>
 *
 * <h1>Node Type ID</h1>
 * <p>Every node type, (ie. subtypes of {@link SceneJS.Node}, has a SceneJS type ID, which may be got with {@link #getType}.
 * This is the list of all valid xtypes:</p>
 *
 * <table>
 * <tr><td>type</td><td>Class</td></tr>
 * <tr><td>----</td><td>-----</td></tr>
 * <tr><td>bounding-box</td><td>{@link SceneJS.BoundingBox}</td></tr>
 * <tr><td>camera</td><td>{@link SceneJS.Camera}</td></tr>
 * <tr><td>cube</td><td>{@link SceneJS.objects.Cube}</td></tr>
 * <tr><td>fog</td><td>{@link SceneJS.Fog}</td></tr>
 * <tr><td>generator</td><td>{@link SceneJS.Generator}</td></tr>
 * <tr><td>geometry</td><td>{@link SceneJS.Geometry}</td></tr>
 * <tr><td>instance</td><td>{@link SceneJS.Instance}</td></tr>
 * <tr><td>lights</td><td>{@link SceneJS.Lights}</td></tr>
 * <tr><td>locality</td><td>{@link SceneJS.Locality}</td></tr>
 * <tr><td>lookat</td><td>{@link SceneJS.LookAt}</td></tr>
 * <tr><td>material</td><td>{@link SceneJS.Material}</td></tr>
 * <tr><td>matrix</td><td>{@link SceneJS.Matrix}</td></tr>
 * <tr><td>node</td><td>{@link SceneJS.Node}</td></tr>
 * <tr><td>perspective</td><td>{@link SceneJS.Perspective}</td></tr>
 * <tr><td>renderer</td><td>{@link SceneJS.Renderer}</td></tr>
 * <tr><td>rotate</td><td>{@link SceneJS.Rotate}</td></tr>
 * <tr><td>scale</td><td>{@link SceneJS.Scale}</td></tr>
 * <tr><td>scene</td><td>{@link SceneJS.Scene}</td></tr>
 * <tr><td>interpolator</td><td>{@link SceneJS.Interpolator}</td></tr>
 * <tr><td>selector</td><td>{@link SceneJS.Selector}</td></tr>
 * <tr><td>sphere</td><td>{@link SceneJS.objects.Sphere}</td></tr>
 * <tr><td>stationary</td><td>{@link SceneJS.Stationary}</td></tr>
 * <tr><td>symbol</td><td>{@link SceneJS.Symbol}</td></tr>
 * <tr><td>teapot</td><td>{@link SceneJS.objects.Teapot}</td></tr>
 * <tr><td>text</td><td>{@link SceneJS.Text}</td></tr>
 * <tr><td>texture</td><td>{@link SceneJS.Texture}</td></tr>
 * <tr><td>translate</td><td>{@link SceneJS.Translate}</td></tr>
 * <tr><td>with-data</td><td>{@link SceneJS.WithData}</td></tr>
 * <tr><td>with-configs</td><td>{@link SceneJS.WithConfigs}</td></tr>
 * <tr><td>socket</td><td>{@link SceneJS.Socket}</td></tr>
 * </table>
 *
 * <h2>Events</h2>
 * <p>You can register listeners to handle events fired by each node type. They can be registered either through the
 * constructor on a static config object, or at any time on a node instance through its {@link #addListener} method.</p>
 * <p><b>Registering listeners on configuration</b></p>
 * <p>The example below creates a {@link SceneJS.Instance} node, with a "state-changed" listener registered through its constructor.
 * <pre><code>
 * var myLoad = new SceneJS.Instance({
 *
 *                  uri: "http://foo.com/...",               // File to load
 *
 *                  listeners: {
 *                        "state-changed" : {
 *                                fn: function(params) {
 *                                       alert("Node " + this.getType() + " has changed state to " + params.newState);
 *                                    }
 *                         }
 *                  }
 *             }
 *        );
 * </code></pre>
 * <p><b>Registering and de-registering listeners on node instances</b></p>
 * <p>This example registers a "state-changed" listener on an existing instance of the node, then removes it again:</p>
 * <pre><code>
 * var handler = function(params) {
 *                  alert("Node " + this.getType() + " has changed state to " + this.getState());
 *              };
 *
 * myLoad.addListener("state-changed", handler);
 *
 * myLoad.removeListener("state-changed", handler);
 * </code></pre>
 *
 * @constructor
 * Create a new SceneJS.Node
 * @param {Object} [cfg] Static configuration object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {SceneJS.node, ...} arguments Zero or more child nodes
 */
SceneJS.Node = function() {
    this._nodeType = "node";
    this._NODEINFO = null;  // Big and bold, to stand out in debugger object graph inspectors
    this._sid = null;
    this._children = [];
    this._fixedParams = true;
    this._parent = null;
    this._listeners = {};
    this._events = []; // FIFO queue for each event listener

    /* Used by many node types to track the level at which they can
     * memoise internal state. When rendered, a node increments
     * this each time it discovers that it can cache more state, so that
     * it knows not to recompute that state when next rendered.
     * Since internal state is usually dependent on the states of higher
     * nodes, this is reset whenever the node is attached to a new
     * parent.
     *
     * private
     */
    this._memoLevel = 0;
    SceneJS.Node._ArgParser.parseArgs(arguments, this);
};

SceneJS.Node.prototype.constructor = SceneJS.Node;

/**
 * A simple recursive descent parser to parse SceneJS's flexible node
 * arguments.
 *
 * @private
 */
SceneJS.Node._ArgParser = new (function() {

    /**
     * Entry point - parse first argument in variable argument list
     */
    this.parseArgs = function(args, node) {
        node._getParams = function() {
            return {};
        };
        node._fixedParams = true;
        node._config = {};

        /* Parse first argument - expected to be either a config object,
         * config callback or a child node
         * @private
         */
        if (args.length > 0) {
            var arg = args[0];
            if (!arg) {
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException
                        ("First element in node config is null or undefined"));
            }
            if (arg instanceof Function) {
                this._parseConfigFunc(arg, args, 1, node);
            } else if (arg._render) {   // Determines arg to be a node
                this._parseChild(arg, args, 1, node);
            } else {
                this._parseConfigObject(arg, args, 1, node);
            }
        }
    };

    /** Parses listeners on a configuration object and registers them on
     * the given node.
     * @private
     */
    this._parseListeners = function(listeners, node) {
        for (var eventName in listeners) {
            if (listeners.hasOwnProperty(eventName)) {
                var l = listeners[eventName];
                if (!l.fn) {
                    throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException
                            ("Listener 'fn' missing in node config"));
                }
                if (!(l.fn instanceof Function)) {
                    throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException
                            ("Listener 'fn' invalid in node config - is not a function"));
                }
                l.options = l.options || {};
                if (!node._listeners[eventName]) {
                    node._listeners[eventName] = [];
                }
                node._listeners[eventName].push(l);
            }
        }
    };

    /**
     * Parse argument that is a configuration object, then parse the next
     * argument (if any) at the given index, which is expected to be either a
     * configuration callback or a child node.
     * @private
     */
    this._parseConfigObject = function(arg, args, i, node) {

        /* Seperate out basic node configs (such as SID, info and listeners) from other configs - set those
         * directly on the node and set the rest on an intermediate config object.
         */
        for (var key in arg) {
            if (arg.hasOwnProperty(key)) {
                if (key == "listeners") {
                    this._parseListeners(arg[key], node);
                } else if (key == "sid") {
                    node._sid = arg[key];
                } else if (key == "info") {
                    node._NODEINFO = arg[key];
                } else {
                    node._config[key] = arg[key];
                }
            }
        }

        node._getParams = (function() {
            var _config = node._config;
            return function() {
                return _config;
            };
        })();

        /* Wind on to next argument if any, expected be either
         * a config callback or a child node
         */
        if (i < args.length) {
            arg = args[i];
            if (arg instanceof Function) {
                this._parseConfigFunc(arg, args, i + 1, node);
            } else if (arg._render) { // Determines arg to be a node
                this._parseChild(arg, args, i + 1, node);
            } else {
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException
                        ("Unexpected type for node argument " + i + " - expected a config function or a child node"));
            }
        }
    };

    /**
     * Parse argument that is a configuration callback, then parse
     * the next argument (if any) at the given index, which is
     * expected to be a child node.
     * @private
     */
    this._parseConfigFunc = function(arg, args, i, node) {
        node._getParams = (function() {
            var _config = node._config;
            var _arg = arg;
            var val;
            return function(data) {
                var c = _arg.call(this, data);
                if (!c) {
                    /* Dynamic config returns nothing - we'll assume this is
                     * explicit, such as when done by a SceneJS.Generator to
                     * signal the end of its generation.
                     */
                    return null;
                }
                var result = {};
                for (var key in _config) {
                    if (_config.hasOwnProperty(key)) {
                        result[key] = _config[key];
                    }
                }
                for (var key in c) {
                    if (c.hasOwnProperty(key)) {
                        val = c[key];   // Don't clobber possible non-null static value with a null dynamic one 
                        if (val != null && val != undefined) {
                            result[key] = val;
                        }
                    }
                }
                return result;
            };
        })();
        node._fixedParams = false;

        /* Wind on to next argument if any, expected be a child node
         */
        if (i < args.length) {
            arg = args[i];
            if (arg._nodeType) {
                this._parseChild(arg, args, i + 1, node);
            } else {
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException
                        ("Unexpected type for node argument " + i + " - expected a child node"));
            }
        }
    };

    /**
     * Parse argument that is a child node, then parse the next
     * argument (if any) at the given index, which is expected to
     * be a child node.
     * @private
     */
    this._parseChild = function(arg, args, i, node) {
        node._children.push(arg);
        arg._parent = node;
        arg._resetMemoLevel(); // In case child is a pruned and grafted subgraph
        if (i < args.length) {
            arg = args[i];
            if (!arg) {
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException
                        ("Node argument " + i + " is null or undefined"));
            }
            if (arg._nodeType) {
                this._parseChild(arg, args, i + 1, node);
            } else {
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException
                        ("Unexpected type for node argument " + i + " - expected a child node"));
            }
        }
    };
})();

/**
 * Resets memoization level to zero - called when moving nodes around in graph or calling their setters
 * @private
 */
SceneJS.Node.prototype._resetMemoLevel = function() {
    this._memoLevel = 0;
    for (var i = 0; i < this._children.length; i++) {
        this._children[i]._resetMemoLevel();
    }
};


/** @private
 *
 * Recursively renders a node's child list. This is effectively rendering a subtree,
 * minus the root node, in depth-first, right-to-left order. As this function descends,
 * it tracks in traversalContext the location of each node in relation to the right
 * fringe of the subtree. As soon as the current node has zero children and no right
 * sibling, then it must be the last one in the subtree. If the nodes are part of the
 * subtree of a Symbol node, then a callback will have been planted on the traversalContext
 * by the Instance node that is intiating it. The callback is then called to render the
 * Instance's child nodes as if they were children of the last node.
 */
SceneJS.Node.prototype._renderNodes = function(traversalContext, data, children) {
    var child;
    var childConfigs;
    var i;
    var configUnsetters;

    var savedName;  // Saves SID path for when rendering subgraph of Instance  
    if (this._sidPath) {
        savedName = SceneJS._instancingModule.getName();      // Save SID path at Instance node
        SceneJS._instancingModule.setName(this._sidPath, this);     // Initialise empty SID path for Symbol's subgraph
    } else if (this._sid) {
        SceneJS._instancingModule.pushName(this._sid, this);
    }

    if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
        SceneJS._pickModule.preVisitNode(this);
    }

    children = children || this._children;  // for Selector node
    var numChildren = children.length;
    if (numChildren) {
        var childTraversalContext;
        for (i = 0; i < numChildren; i++) {
            child = children[i];
            configUnsetters = null;
            childConfigs = traversalContext.configs;
            if (childConfigs && child._sid) {
                childConfigs = childConfigs[child._sid];
                if (childConfigs) {
                    if (childConfigs instanceof Function) {
                        childConfigs.call(child, data);
                    } else {
                        configUnsetters = this._setConfigs(childConfigs, traversalContext.configsModes, child, data);
                    }
                }
            }
            childTraversalContext = {
                insideRightFringe: traversalContext.insideRightFringe || (i < numChildren - 1),
                callback : traversalContext.callback,
                configs: childConfigs || traversalContext.configs,
                configsModes : traversalContext.configsModes
            };
            child._renderWithEvents.call(child, childTraversalContext, data);
            if (configUnsetters) {
                this._unsetConfigs(configUnsetters);
            }
        }
    }

    if (numChildren == 0) {
        if (! traversalContext.insideRightFringe) {

            /* No child nodes and on the right fringe - this is the last node in the subtree
             */
            if (traversalContext.callback) {

                /* The node is within the subtree of a Symbol - Instance has provided a
                 * callback to render the Instance's child nodes as if they were children
                 * of the last node in the subtree
                 */
                traversalContext.callback(traversalContext, data);
            }
        }
    }
    if (savedName) {
        SceneJS._instancingModule.setName(savedName, this); // Restore SID path for Instance node
    } else if (this._sid) {
        SceneJS._instancingModule.popName();
    }

    if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
        SceneJS._pickModule.postVisitNode(this);
    }
};


SceneJS.Node.prototype._setConfigs = function(childConfigs, configsModes, child, data) {
    //    var handle = {
    //        child : child,
    //        setterFuncs : [],
    //        values : []
    //    };
    var handle = null;
    var key;
    var funcName;
    var func;
    var config;
    for (key in childConfigs) {
        if (childConfigs.hasOwnProperty(key)) {
            config = childConfigs[key];
            if (config.isFunc) {
                func = child[key];
                if (func) {
                    if (config.value instanceof Function) {
                        var val = config.value.call(child, data)
                        func.call(child, val);
                    } else {
                        func.call(child, config.value);
                    }
                } else {
                    if (configsModes && configsModes.strictProperties) {
                        throw SceneJS._errorModule.fatalError(new SceneJS.errors.WithConfigsPropertyNotFoundException(
                                "Method '" + funcName + "' expected on node with SID '" + child.getSID() + "'"));
                    }
                }
            }
        }
    }
    return handle; // TODO: restore handle!
};

/**
 * Wraps _render to fire events either side of rendering.
 * @private */
SceneJS.Node.prototype._renderWithEvents = function(traversalContext, data) {
    if (this._listeners["rendering"]) { // Optimisation
        this._fireEvent("rendering", { });
    }
    this._processEvents();
    this._render(traversalContext, data);
    if (this._listeners["rendered"]) { // Optimisation
        this._fireEvent("rendered", { });
    }
};

/** @private */
SceneJS.Node.prototype._render = function(traversalContext, data) {
    if (!this._fixedParams) {
        this._init(this._getParams.call(this, data));
    }
    this._renderNodes(traversalContext, data);
};


// @private
SceneJS.Node.prototype._unsetConfigs = function(handle) {
    for (var i = handle.setterFuncs.length - 1; i >= 0; i--) {
        handle.setterFuncs[i].call(handle.child, handle.values[i]);
    }
};

/** @private */
SceneJS.Node.prototype._renderNode = function(index, traversalContext, data) {
    var child = this._children[index];
    var childConfigs = traversalContext.configs;
    if (childConfigs && child._sid) {
        childConfigs = childConfigs["#" + child._sid];
        if (childConfigs) {
            var handle = this._setConfigs(childConfigs, traversalContext.configsModes, child);
            child._render.call(child, traversalContext, data);
            this._unsetConfigs(handle);
            return;
        }
    }
    child._render.call(child, traversalContext, data);
};

/**
 * Returns the type ID of the node. For the SceneJS.Node base class, it is "node",
 * which is overriden in sub-classes.
 * @returns {string} Type ID
 */
SceneJS.Node.prototype.getType = function() {
    return this._nodeType;
};

/**
 * Returns the node's optional subidentifier, which must be unique within the scope
 * of the parent node.
 * @returns {string} Node SID
 */
SceneJS.Node.prototype.getSID = function() {
    return this._sid;
};

/**
 * Returns the node's optional information string. The string will be empty if never set.
 * @returns {string} Node info string
 */
SceneJS.Node.prototype.getInfo = function() {
    return this._NODEINFO || "";
};

/**
 * Sets the node's optional information string. The string will be empty if never set.
 * @param {string} info Node info string
 */
SceneJS.Node.prototype.setInfo = function(info) {
    this._NODEINFO = info;
};

/**
 * Returns the number of child nodes
 * @returns {int} Number of child nodes
 */
SceneJS.Node.prototype.getNumNodes = function() {
    return this._children.length;
};

/** Returns child nodes
 * @returns {Array} Child nodes
 */
SceneJS.Node.prototype.getNodes = function() {
    var list = new Array(this._children.length);
    var len = this._children.length;
    for (var i = 0; i < len; i++) {
        list[i] = this._children[i];
    }
    return list;
};

/** Returns child node at given index. Returns null if no node at that index.
 * @param {Number} index The child index
 * @returns {SceneJS.Node} Child node, or null if not found
 */
SceneJS.Node.prototype.getNodeAt = function(index) {
    if (index < 0 || index >= this._children.length) {
        return null;
    }
    return this._children[index];
};

/** Returns child node with the given SID (structure identifier).
 * Returns null if no such child node found.
 * @param {String} sid The child's SID
 * @returns {SceneJS.Node} Child node, or null if not found
 */
SceneJS.Node.prototype.getNode = function(sid) {
    for (var i = 0; i < this._children.length; i++) {
        if (this._children[i].getSID() == sid) {
            return this._children[i];
        }
    }
    return null;
};

/** Removes the child node at the given index
 * @param {int} index Child node index
 * @returns {SceneJS.Node} The removed child node if located, else null
 */
SceneJS.Node.prototype.removeNodeAt = function(index) {
    var r = this._children.splice(index, 1);
    if (r.length > 0) {
        r[0]._parent = null;
        return r[0];
    } else {
        return null;
    }
};

/** Removes the child node with the given SID (structural identifier) string.
 * @param {String} sid The target child node's SID
 * @returns {SceneJS.Node} The removed child node if located, else null
 */
SceneJS.Node.prototype.removeNode = function(sid) {
    if (!sid) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidSceneGraphException(
                        "SceneJS.Node#removeNode - target node not defined"));
    }
    for (var i = 0; i < this._children.length; i++) {
        if (this._children[i].getSID() == sid) {
            return this.removeNodeAt(i);
        }
    }
    return null;
};

/** Appends a child node
 * @param {SceneJS.Node} node Child node
 * @return {SceneJS.Node} The child node
 */
SceneJS.Node.prototype.addNode = function(node) {
    if (!node) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidSceneGraphException(
                        "SceneJS.Node#addNode - node argument is undefined"));
    }
    if (!node._render) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidSceneGraphException(
                        "SceneJS.Node#addNode - node argument is not a SceneJS.Node or subclass!"));
    }
    if (node._parent != null) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidSceneGraphException(
                        "SceneJS.Node#addNode - node argument is still attached to another parent!"));
    }
    this._children.push(node);
    node._parent = this;
    node._resetMemoLevel();
    return node;
};
//
///** Attaches a new child node as a spliced parent of an existing target child
// * @param {string} sid SID of target child node
// * @param {SceneJS.Node} node Node to splice
// * @return {SceneJS.Node} The spliced node
// */
//SceneJS.Node.prototype.spliceNode = function(sid, node) {
//    if (!sid) {
//        throw SceneJS._errorModule.fatalError(
//                new SceneJS.errors.InvalidSceneGraphException(
//                        "SceneJS.Node#spliceNode - target node not defined"));
//    }
//    var targetNodeIndex = this._findNodeIndex(sid);
//    if (targetNodeIndex == -1) {
//        new SceneJS.errors.InvalidSceneGraphException(
//                "SceneJS.Node#spliceNode - target node not found with this SID: '" + sid + "'");
//    }
//    if (!node) {
//        throw SceneJS._errorModule.fatalError(
//                new SceneJS.errors.InvalidSceneGraphException(
//                        "SceneJS.Node#spliceNode - node argument is undefined"));
//    }
//    if (node._parent != null) {
//        throw SceneJS._errorModule.fatalError(
//                new SceneJS.errors.InvalidSceneGraphException(
//                        "SceneJS.Node#spliceNode - node to splice is still attached to another parent!"));
//    }
//    var targetNode = this._children[targetNodeIndex];
//
//    this._children[targetNodeIndex] = node;
//    node._parent = this;
//
//    node._children.push(targetNode);
//    targetNode._parent = node;
//
//    node._resetMemoLevel();
//    targetNode._resetMemoLevel();
//    return node;
//};

/** @private
 */
SceneJS.Node.prototype.findNodeIndex = function(sid) {
    for (var i = 0; i < this._children.length; i++) {
        if (this._children[i].getSID() == sid) {
            return i;
        }
    }
    return -1;
};

/** Inserts a child node
 * @param {SceneJS.Node} node Child node
 * @param {int} i Index for new child node
 * @return {SceneJS.Node} The child node
 */
SceneJS.Node.prototype.insertNode = function(node, i) {
    if (node._parent != null) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidSceneGraphException(
                        "Attempted to insert a child to a node without " +
                        "first removing the child from it's current parent"));
    }
    if (i == undefined || i <= 0) {
        this._children.unshift(node);
    } else if (i >= this._children.length) {
        this._children.push(node);
    } else {
        this._children.splice(i, 0, node);
    }
    node._parent = this;
    node._resetMemoLevel();
    return node;
};




/**
 * Registers a listener for a given event on this node. If the event type
 * is not supported by this node type, then the listener will never be called.
 * <p><b>Example:</b>
 * <pre><code>
 * var node = new SceneJS.Node();
 *
 * node.addListener(
 *
 *              // eventName
 *              "some-event",
 *
 *              // handler
 *              function(node,      // Node we are listening to
 *                       params) {  // Whatever params accompany the event type
 *
 *                     // ...
 *              }
 * );
 *
 *
 * </code></pre>
 *
 * @param {String} eventName One of the event types supported by this node
 * @param fn - Handler function that be called as specified
 * @param options - Optional options for the handler as specified
 * @return {SceneJS.Node} this
 */
SceneJS.Node.prototype.addListener = function(eventName, fn, options) {
    var list = this._listeners[eventName];
    if (!list) {
        list = [];
        this._listeners[eventName] = list;
    }
    list.push({
        eventName : eventName,
        fn: fn,
        options : options || {}
    });
    return this;
};

/**
 * Fires an event at this node
 * @param {String} eventName Event name
 * @param {Object} params Event parameters
 */
SceneJS.Node.prototype._fireEvent = function(eventName, params) {
    var list = this._listeners[eventName];
    if (list) {
        if (!params) {
            params = {};
        }
        for (var i = 0; i < list.length; i++) {
            var listener = list[i];
            listener.fn.call(this, params);
        }
    }
};

/**
 * Adds an event to a FIFO queue for the given event type, to be processed when the node is next rendered.
 * @param {String} eventName Event name
 * @param {Object} params Event parameters
 * @return this
 */
SceneJS.Node.prototype.addEvent = function(eventName, params) {
    this._events.unshift({name : eventName, params: params });
    return this;
};


/**
 * Processes all events queued on this node
 * @private
 */
SceneJS.Node.prototype._processEvents = function() {
    var event;
    while (this._events.length > 0) {
        event = this._events.pop();
        this._fireEvent(event.name, event.params);
    }
};

/**
 * Removes a handler that is registered for the given event on this node.
 * Does nothing if no such handler registered.
 *
 * @param {String} eventName Event type that handler is registered for
 * @param {function} fn - Handler function that is registered for the event
 * @return {function} The handler, or null if not registered
 */
SceneJS.Node.prototype.removeListener = function(eventName, fn) {
    var list = this._listeners[eventName];
    if (!list) {
        return null;
    }
    for (var i = 0; i < list.length; i++) {
        if (list[i].fn == fn) {
            list.splice(i, 1);
            return fn;
        }
    }
    return null;
};

/**
 * Returns true if this node has any listeners for the given event .
 *
 * @param {String} eventName Event type
 * @return {boolean} True if listener present
 */
SceneJS.Node.prototype.hasListener = function(eventName) {
    return this._listeners[eventName];
};

/** Removes all listeners registered on this node.
 * @return {SceneJS.Node} this
 */
SceneJS.Node.prototype.removeListeners = function() {
    this._listeners = {};
    return this;
};

/** Returns the parent node
 * @return {SceneJS.Node} The parent node
 */
SceneJS.Node.prototype.getParent = function() {
    return this._parent;
};

/** Returns either all child or all sub-nodes of the given type, depending on whether search is recursive or not.
 * @param {string} type Node type
 * @param {boolean} [recursive=false] When true, will return all matching nodes in subgraph, otherwise returns just children (default)
 * @return {SceneJS.node[]} Array of matching nodes
 */
SceneJS.Node.prototype.findNodesByType = function(type, recursive) {
    return this._findNodesByType(type, [], recursive);
};

/** @private */
SceneJS.Node.prototype._findNodesByType = function(type, list, recursive) {
    for (var i = 0; i < this._children; i++) {
        var node = this._children[i];
        if (node.nodeType == type) {
            list.add(node);
        }
    }
    if (recursive) {
        for (var i = 0; i < this._children; i++) {
            this._children[i]._findNodesByType(type, list, recursive);
        }
    }
    return list;
};

/** Factory function that returns a new {@link SceneJS.Node} instance
 * @param {Object} [cfg] Static configuration object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {SceneJS.node, ...} arguments Zero or more child nodes
 * @returns {SceneJS.Node}
 */
SceneJS.node = function() {
    var n = new SceneJS.Node();
    SceneJS.Node.prototype.constructor.apply(n, arguments);
    return n;
};


new (function() {

    const TICK_INTERVAL = 50;
    const TIMEOUT = 60000; // 60 seconds

    var moduleQueue = [];
    var moduleLoading = null;
    var modules = {};
    var moduleLoadTimer = 0;    

    SceneJS.requireModule = function(url) {
    //    moduleQueue.unshift({ url : url + "&x=" + (new Date()).getTime() }); // defeat caching
         moduleQueue.unshift({ url : url  }); // defeat caching
    };

    /** Called by each module after it has eval-ed on arrival
     *
     * @param name Name under which module registers itself on SceneJS
     * @param module Module itself
     */
    SceneJS.installModule = function(name, module) {
        if (moduleLoading) {
            try {
                if (module.init) {
                    module.init({ baseURL : SceneJS._getBaseURL(moduleLoading.url) });
                }
                modules[name] = module;
            } catch (e) {
                throw SceneJS._errorModule.fatalError(
                        new SceneJS.errors.ModuleInstallFailureException(
                                "Module install failed - " + moduleLoading.url + ": " + e));
            } finally {
                moduleLoading = null;
            }
        }
    };

    SceneJS._moduleLoadTicker = function() {
        if (moduleLoading) {
            if (moduleLoadTimer > TIMEOUT) {
                var url = moduleLoading.url;
                moduleLoading = null;
                moduleQueue = [];
                throw SceneJS._errorModule.fatalError(
                        new SceneJS.errors.ModuleLoadTimeoutException(
                                "Module load timed out - SceneJS.requireModule(" + url + ") - check console for more info"));
            }
            moduleLoadTimer += TICK_INTERVAL;
            return;
        }
        if (moduleQueue.length == 0) {
            return;
        }

        /* Load next module
         */
        moduleLoading = moduleQueue.pop();   
        moduleLoadTimer = 0;

        var headID = document.getElementsByTagName("head")[0];
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        newScript.src = moduleLoading.url;
        headID.appendChild(newScript);
    };
    window.setInterval(SceneJS._moduleLoadTicker, TICK_INTERVAL);


    SceneJS.UseModule = function() {
        SceneJS.Node.apply(this, arguments);
        this._startTime = null;
        this._timer = null;
        this._nodeType = "usemodule";
        this._moduleName = null;
        this._moduleNode = null;
        this._moduleParams = null;
        if (this._fixedParams) {
            this._init(this._getParams());
        }
    };

    SceneJS._inherit(SceneJS.UseModule, SceneJS.Node);

    // @private
    SceneJS.UseModule.prototype._init = function(params) {
        if (params.name) {
            this._moduleName = params.name;
            this._moduleParams = params.params || {};
        }
    };

    /* Same method as used on SceneJS.Instance - TODO: factor out to common utility method
     *
     * @private
     */
    SceneJS.UseModule.prototype._createTargetTraversalContext = function(traversalContext, target) {
        this._superCallback = traversalContext.callback;
        var _this = this;
        if (!this._callback) {
            this._callback = function(traversalContext, data) {
                var subTraversalContext = {
                    callback : _this._superCallback,
                    insideRightFringe : _this._children.length > 1,
                    configs: traversalContext.configs,
                    configsModes: traversalContext.configsModes
                };
                _this._renderNodes(subTraversalContext, data);
            };
        }
        return {
            callback: this._callback,
            insideRightFringe:  target._children.length > 1,
            configs: traversalContext.configs,
            configsModes: traversalContext.configsModes
        };
    };

    //    SceneJS.UseModule.prototype._renderNodes = function(traversalContext, data) {
    //        var numChildren = this._children.length;
    //        var child;
    //        var childConfigs;
    //        var configUnsetters;
    //
    //        if (numChildren == 0) {
    //
    //            /* Instance has no child nodes - render super-Instance's child nodes
    //             * through callback if one is passed in
    //             */
    //            if (traversalContext.callback) {
    //                traversalContext.callback(traversalContext, data);
    //            }
    //
    //        } else {
    //
    //            /* Instance has child nodes - last node in Instance's subtree will invoke
    //             * the callback, if any (from within its SceneJS.Node#_renderNodes)
    //             */
    //            var childTraversalContext;
    //            for (var i = 0; i < numChildren; i++) {
    //                child = this._children[i];
    //                configUnsetters = null;
    //                childConfigs = traversalContext.configs;
    //                if (childConfigs && child._sid) {
    //                    childConfigs = childConfigs[child._sid];
    //                    if (childConfigs) {
    //                        configUnsetters = this._setConfigs(childConfigs, child);
    //                    }
    //                }
    //                childTraversalContext = {
    //                    insideRightFringe : (i < numChildren - 1),
    //                    callback : traversalContext.callback,
    //                    configs : childConfigs || traversalContext.configs,
    //                    configsModes : traversalContext.configsModes
    //                };
    //                child._renderWithEvents.call(child, childTraversalContext, data);
    //                if (configUnsetters) {
    //                    this._unsetConfigs(configUnsetters);
    //                }
    //            }
    //        }
    //    };

    // @private
    SceneJS.UseModule.prototype._render = function(traversalContext, data) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        }

        if (!this._moduleNode) {

            var module = modules[this._moduleName]; 
            if (module) {
                this._moduleNode = module.getNode(this._moduleParams);
            } else {
                if (!this._startTime) {
                    this._startTime = (new Date()).getTime();
                } else if (((new Date()).getTime() - this._startTime) > TIMEOUT) {
                    throw SceneJS._errorModule.fatalError(
                            new SceneJS.errors.ModuleNotFoundException(
                                    "SceneJS.UseModule failed to find module '"
                                            + this._moduleName + "' after waiting " + (TIMEOUT / 1000) + " seconds - check console for more info"));
                }
            }
        }
        if (this._moduleNode) {
            this._moduleNode._render(this._createTargetTraversalContext(traversalContext, this._moduleNode), data);
        }
        //this._renderNodes(traversalContext, data);
        ;
    };

    SceneJS.useModule = function() {
        var n = new SceneJS.UseModule();
        SceneJS.UseModule.prototype.constructor.apply(n, arguments);
        return n;
    };
})();
/**
 * Backend module that defines SceneJS events and provides an interface on the backend context through which
 * backend modules can fire and subscribe to them.
 *
 * Events are actually somewhat more like commands; they are always synchronous, and are often used to decouple the
 * transfer of data between backends, request events in response, and generally trigger some immediate action.
 *
 * Event subscription can optionally be prioritised, to control the order in which the subscriber will be notified of
 * a given event relative to other suscribers. This is useful, for example, when a backend must be the first to handle
 * an INIT, or the last to handle a RESET.
 *
 * @private
 */
SceneJS._eventModule = new (function() {

    this.ERROR = 0;
    this.INIT = 1;                           // SceneJS framework initialised
    this.RESET = 2;                          // SceneJS framework reset
    this.TIME_UPDATED = 3;                   // System time updated
    this.SCENE_CREATED = 4;                  // Scene has just been created
    this.SCENE_RENDERING = 5;                // Scene about to be traversed
    this.SCENE_RENDERED = 6;              // Scene just been completely traversed
    this.SCENE_DESTROYED = 7;                // Scene just been destroyed
    this.RENDERER_UPDATED = 8;                // Current WebGL context has been updated to the given state
    this.RENDERER_EXPORTED = 9;               // Export of the current WebGL context state
    this.CANVAS_ACTIVATED = 10;
    this.CANVAS_DEACTIVATED = 11;
    this.VIEWPORT_UPDATED = 12;
    this.GEOMETRY_UPDATED = 13;
    this.GEOMETRY_EXPORTED = 14;
    this.MODEL_TRANSFORM_UPDATED = 15;
    this.MODEL_TRANSFORM_EXPORTED = 16;
    this.PROJECTION_TRANSFORM_UPDATED = 17;
    this.PROJECTION_TRANSFORM_EXPORTED = 18;
    this.VIEW_TRANSFORM_UPDATED = 19;
    this.VIEW_TRANSFORM_EXPORTED = 20;
    this.LIGHTS_UPDATED = 21;
    this.LIGHTS_EXPORTED = 22;
    this.MATERIAL_UPDATED = 23;
    this.MATERIAL_EXPORTED = 24;
    this.TEXTURES_UPDATED = 25;
    this.TEXTURES_EXPORTED = 26;
    this.SHADER_ACTIVATE = 27;
    this.SHADER_ACTIVATED = 28;
    this.SHADER_RENDERING = 29;
    this.SHADER_DEACTIVATED = 30;
    this.FOG_UPDATED = 31;
    this.FOG_EXPORTED = 32;
    this.NAME_UPDATED = 33;
    this.PROCESS_CREATED = 34;
    this.PROCESS_KILLED = 35;
    this.PROCESS_TIMED_OUT = 36;
    this.LOGGING_ELEMENT_ACTIVATED = 37;
    this.PICK_COLOR_EXPORTED = 38;
    
    /* Priority queue for each type of event
     */
    var events = new Array(37);

    /**
     * Registers a handler for the given event
     *
     * The handler can be registered with an optional priority number which specifies the order it is
     * called among the other handler already registered for the event.
     *
     * So, with n being the number of commands registered for the given event:
     *
     * (priority <= 0)      - command will be the first called
     * (priority >= n)      - command will be the last called
     * (0 < priority < n)   - command will be called at the order given by the priority
     * @private
     * @param type Event type - one of the values in SceneJS._eventModule
     * @param command - Handler function that will accept whatever parameter object accompanies the event
     * @param priority - Optional priority number (see above)
     */
    this.addListener = function(type, command, priority) {
        var list = events[type];
        if (!list) {
            list = [];
            events[type] = list;
        }
        var handler = {
            command: command,
            priority : (priority == undefined) ? list.length : priority
        };
        for (var i = 0; i < list.length; i++) {
            if (list[i].priority > handler.priority) {
                list.splice(i, 0, handler);
                return;
            }
        }
        list.push(handler);
    };

    /**
     * @private
     */
    this.fireEvent = function(type, params) {
        var list = events[type];
        if (list) {
            if (!params) {
                params = {};
            }
            for (var i = 0; i < list.length; i++) {
                list[i].command(params);
            }
        }
    };
})();



/** <p>Adds a listener to be notified when a given event occurs within SceneJS.</p>
 * <p><b>Supported events</b></p>
 * <p><b><em>error</em></b></p><p>An error has occurred either while defining or rendering a scene. These can be either fatal,
 * or errors that SceneJS can recover from.</p><p>Example:</p><pre><code>
 * SceneJS.addListener("error", function(e) {
 *     if (e.exception.message) {
 *         alert("Error: " + e.exception.message);
 *     } else {
 *         alert("Error: " + e.exception);
 *     }
 *  });
 * </pre></code>
 *
 * <p><b><em>reset</em></b></p><p>The SceneJS framework has been reset, where all {@link SceneJS.Scene} instances have
 * been destroyed and resources held for them freed.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "reset",
 *      function(e) {
 *          alert("SceneJS has been reset");
 *      });
 * </pre></code>

 * <p><b><em>scene-created</em></b></p><p>A {@link SceneJS.Scene} has been defined.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "scene-created",
 *      function(e) {
 *          alert("A new Scene has been created - scene ID: " + e.sceneId);
 *      });
 * </pre></code>
 *
 * <p><b><em>scene-rendering</em></b></p><p>Traversal (render) of a {@link SceneJS.Scene} has just begun.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "scene-rendering",
 *      function(e) {
 *          alert("Rendering of a new Scene has just begun - scene ID: " + e.sceneId);
 *      });
 * </pre></code>
 *
 * <p><b><em>canvas-activated</em></b></p><p>A canvas has just been activated for a {@link SceneJS.Scene}, where that
 * node is about to start rendering to it. This will come right after a "scene-rendering" event, which will indicate which
 * {@link SceneJS.Scene} is the one about to do the rendering.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "canvas-activated",
 *      function(e) {
 *          var canvas = e.canvas;
 *          var context = e.context;
 *          var canvasId = e.canvasId;
 *          alert("Canvas is about to be rendered to : " + canvasId);
 *      });
 * </pre></code>
 *
 * <p><b><em>process-created</em></b></p><p>An asynchronous process has started somewhere among the nodes wtihin a
 * {@link SceneJS.Scene}. Processes track the progress of tasks such as the loading of remotely-stored content by
 * {@link SceneJS.Instance} nodes. This event is particularly useful to monitor for content loading. </p>
 * <p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "process-created",
 *      function(e) {
 *          var sceneId = e.sceneId;
 *          var processId = e.process.id;
 *          var timeStarted = e.process.timeStarted;
 *          var description = e.process.description;
 *          var timeoutSecs = e.process.timeoutSecs;
 *
 *          // ...
 *      });
 * </pre></code>
 *
 * <p><b><em>process-timed-out</em></b></p><p>An asynchronous process has timed out. This will be followed by
 * a "process-killed" event.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "process-timed-out",
 *      function(e) {
 *          var sceneId = e.sceneId;
 *          var processId = e.process.id;
 *          var timeStarted = e.process.timeStarted;
 *          var description = e.process.description;
 *          var timeoutSecs = e.process.timeoutSecs;
 *
 *          // ...
 *      });
 * </pre></code>
 *
 * <p><b><em>process-killed</em></b></p><p>An asynchronous process has finished.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "process-killed",
 *      function(e) {
 *          var sceneId = e.sceneId;
 *          var processId = e.process.id;
 *          var timeStarted = e.process.timeStarted;
 *          var description = e.process.description;
 *          var timeoutSecs = e.process.timeoutSecs;
 *
 *          // ...
 *      });
 * </pre></code>
 *
 * <p><b><em>scene-rendered</em></b></p><p>A render of a {@link SceneJS.Scene} has completed.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "scene-rendered",
 *      function(e) {
 *          alert("Traversal completed for Scene - scene ID: " + e.sceneId);
 *      });
 * </pre></code>
 *
 * <p><b><em>scene-destroyed</em></b></b></p><p>A SceneJS.Scene traversal has been destroyed.</p><p>Example:</p><pre><code>
 *  SceneJS.addListener(
 *      "scene-destroyed",
 *      function(e) {
 *          alert("Scene has been destroyed - scene ID: " + e.sceneId);
 *      });
 * </pre></code>
 * @param name Event name
 * @param func Callback function
 */
SceneJS.addListener = function(name, func) {
    switch (name) {

        /**
         * @event error
         * Fires when the data cache has changed in a bulk manner (e.g., it has been sorted, filtered, etc.) and a
         * widget that is using this Store as a Record cache should refresh its view.
         * @param {Store} this
         */
        case "error" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.ERROR,
                function(params) {
                    func({
                        exception: params.exception,
                        fatal: params.fatal
                    });
                });
            break;

        case "reset" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.RESET,
                function() {
                    func();
                });
            break;

        case "scene-created" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.SCENE_CREATED,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;

        case "scene-rendering" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.SCENE_RENDERING,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;

        case "canvas-activated" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.CANVAS_ACTIVATED,
                function(params) {
                    func({
                        canvas: params.canvas
                    });
                });
            break;

        case "process-created" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.PROCESS_CREATED,
                function(params) {
                    func(params);
                });
            break;

        case "process-timed-out" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.PROCESS_TIMED_OUT,
                function(params) {
                    func(params);
                });
            break;

        case "process-killed" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.PROCESS_KILLED,
                function(params) {
                    func(params);
                });
            break;

        case "scene-rendered" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.SCENE_RENDERED,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;

        case "scene-destroyed" : SceneJS._eventModule.addListener(
                SceneJS._eventModule.SCENE_DESTROYED,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;

        default:
            throw "SceneJS.addListener - this event type not supported: '" + name + "'";
    }
};

/** @deprecated - use {@link #addListener} instead. 
 */
SceneJS.onEvent = SceneJS.addListener;
/**
 * Backend module to provide logging that is aware of the current location of scene traversal.
 *
 * There are three "channels" of log message: error, warning, info and debug.
 *
 * Provides an interface on the backend context through which other backends may log messages.
 *
 * Provides an interface to scene nodes to allow them to log messages, as well as set and get the function
 * that actually processes messages on each channel. Those getters and setters are used by the SceneJS.logging node,
 * which may be distributed throughout a scene graph to cause messages to be processed in particular ways for different
 * parts of the graph.
 *
 * Messages are queued. Initially, each channel has no function set for it and will queue messages until a function is
 * set, at which point the queue flushes.  If the function is unset, subsequent messages will queue, then flush when a
 * function is set again. This allows messages to be logged before any SceneJS.logging node is visited.
 *
 * This backend is always the last to handle a RESET
 *
 *  @private
 *
 */
SceneJS._loggingModule = new (function() {

    var activeSceneId;
    var funcs = null;
    var queues = {};
    var indent = 0;
    var indentStr = "";

    /**
     * @private
     */
    function log(channel, message) {
        if (SceneJS._isArray(message)) {
            _logHTML(channel, arrayToHTML(message));
            for (var i = 0; i < message.length; i++) {
                _logToConsole(message[i]);
            }
        } else {
            _logHTML(channel, message);
            _logToConsole(message);
        }
    }

    function _logHTML(channel, message) {
        message = activeSceneId
                ? indentStr + activeSceneId + ": " + message
                : indentStr + message;
        var func = funcs ? funcs[channel] : null;
        if (func) {
            func(message);
        } else {
            var queue = queues[channel];
            if (!queue) {
                queue = queues[channel] = [];
            }
            queue.push(message);
        }
    }

    function _logToConsole(message) {
        if (typeof console == "object") {
            message = activeSceneId
                    ? indentStr + activeSceneId + ": " + message
                    : indentStr + message;
            console.log(message);
        }
    }

    function arrayToHTML(array) {
        var array2 = [];
        for (var i = 0; i < array.length; i++) {
            var padding = (i < 10) ? "&nbsp;&nbsp;&nbsp;" : ((i < 100) ? "&nbsp;&nbsp;" : (i < 1000 ? "&nbsp;" : ""));
            array2.push(i + padding + ": " + array[i]);
        }
        return array2.join("<br/>");
    }


    function logScript(src) {
        for (var i = 0; i < src.length; i++) {
            logToConsole(src[i]);
        }
    }

    /**
     * @private
     */
    function flush(channel) {
        var queue = queues[channel];
        if (queue) {
            var func = funcs ? funcs[channel] : null;
            if (func) {
                for (var i = 0; i < queue.length; i++) {
                    func(queue[i]);
                }
                queues[channel] = [];
            }
        }
    }

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.LOGGING_ELEMENT_ACTIVATED,
            function(params) {
                var element = params.loggingElement;
                if (element) {
                    funcs = {
                        warn : function log(msg) {
                            element.innerHTML += "<p style=\"color:orange;\">" + msg + "</p>";
                        },
                        error : function log(msg) {
                            element.innerHTML += "<p style=\"color:darkred;\">" + msg + "</p>";
                        },
                        debug : function log(msg) {
                            element.innerHTML += "<p style=\"color:darkblue;\">" + msg + "</p>";
                        },
                        info : function log(msg) {
                            element.innerHTML += "<p style=\"color:darkgreen;\">" + msg + "</p>";
                        }
                    };
                } else {
                    funcs = null;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING, // Set default logging for scene root
            function(params) {
                activeSceneId = params.sceneId;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERED, // Set default logging for scene root
            function() {
                activeSceneId = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RESET,
            function() {
                queues = {};
                funcs = null;
            },
            100000);  // Really low priority - must be reset last


    // @private
    this.setIndent = function(_indent) {
        indent = _indent;
        var indentArray = [];
        for (var i = 0; i < indent; i++) {
            indentArray.push("----");
        }
        indentStr = indentArray.join("");
    };

    // @private
    this.error = function(msg) {
        log("error", msg);
    };

    // @private
    this.warn = function(msg) {
        log("warn", msg);
    };

    // @private
    this.info = function(msg) {
        log("info", msg);
    };

    // @private
    this.debug = function(msg) {
        log("debug", msg);
    };

    // @private
    this.getFuncs = function() {
        return funcs;
    };

    // @private
    this.setFuncs = function(l) {
        if (l) {
            funcs = l;
            for (var channel in queues) {
                flush(channel);
            }
        }
    };
})();
/**
 * Backend module that provides single point through which exceptions may be raised
 *
 * @private
 */
SceneJS._errorModule = new (function() {

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                var time = (new Date()).getTime();
                SceneJS._eventModule.fireEvent(SceneJS._eventModule.TIME_UPDATED, time);
            });

    // @private
    this.fatalError = function(e) {
        e = e.message ? e : new SceneJS.errors.Exception(e);

        /* Dont log because exception should be thrown        
         */
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.ERROR, {
            exception: e,
            fatal: true
        });
        return e.message;
    };

    // @private
    this.error = function(e) {
        e = e.message ? e : new SceneJS.errors.Exception(e);
        SceneJS._loggingModule.error(e.message);
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.ERROR, {
            exception: e,
            fatal: false
        });
        return e.message;
    };
})();
/**
 * Backend module that provides the current system time, updating it every time a scene is rendered
 *  @private
 */
SceneJS._timeModule = new (function() {

    var time = (new Date()).getTime();

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                time = (new Date()).getTime();
                SceneJS._eventModule.fireEvent(SceneJS._eventModule.TIME_UPDATED, time);
            });

    this.getTime = function() {
        return time;
    };
})();
/**
 * Backend module for VRAM management. This module tries to ensure that SceneJS always has enough video memory
 * to keep things ticking over, at least slowly. Whenever any backend wants to load something into video RAM, it
 * will get the memory manager to mediate the allocation, passing in a callback that will attempt the actual allocation.
 * The memory manager will then try the callback and if no exception is thrown by it, all is good and that's that.
 *
 * However, if the callback throws an out-of-memory exception, the memory manager will poll each registered evictor to
 * evict something to free up some memory in order to satisfy the request. As soon as one of the evictors has
 * successfully evicted something, the memory manager will have another go with the  callback. It will repeat this
 * process, polling a different evictor each time, until the callback succeeds. For fairness, the memory manager
 * remembers the last evictor it polled, to continue with the next one when it needs to evict something again.
 *
 *  @private
 */
SceneJS._memoryModule = new (function() {
    var evictors = [];          // Eviction function for each client
    var iEvictor = 0;           // Fair eviction policy - don't keep starting polling at first evictor

    SceneJS._eventModule.addListener(// Framework reset - start next polling at first evictor
            SceneJS._eventModule.RESET,
            function() {
                iEvictor = 0;
            });

    /**
     * Polls each registered evictor backend to evict something. Stops on the first one to
     * comply. When called again, resumes at the next in sequence to ensure fairness.
     * @private
     */
    function evict() {
        if (evictors.length == 0) {
            return false;
        }
        var tries = 0;
        while (true) {
            if (iEvictor > evictors.length) {
                iEvictor = 0;
            }
            if (evictors[iEvictor++]()) {
                SceneJS._loggingModule.warn("Evicted least-used item from memory");
                return true;
            } else {
                tries++;
                if (tries == evictors.length) {
                    return false;
                }
            }
        }
    }

    // @private
    function outOfMemory(description) {
        SceneJS._loggingModule.error("Memory allocation failed");
        throw SceneJS._errorModule.fatalError(new SceneJS.errors.OutOfVRAMException(
                "Out of memory - failed to allocate memory for " + description));
    }

    /**
     * Volunteers the caller as an evictor that is willing to attempt to free some memory when polled
     * by this module as memory runs low. The given evict callback is to attempt to free some memory
     * held by the caller, and should return true on success else false.
     * @private
     */
    this.registerEvictor = function(evict) {
        evictors.push(evict);
    };

    /**
     * Attempt allocation of some memory for the caller. This method does not return anything - the
     * tryAllocate callback is to wrap the allocation attempt and provide the result to the caller via
     * a closure, IE. not return it.
     * @private
     */
    this.allocate = function(context, description, tryAllocate) {
        // SceneJS._loggingModule.debug("Allocating memory for: " + description);
        var maxTries = 10; // TODO: Heuristic for this? Does this really need be greater than one?
        var tries = 0;
        while (true) {
            try {
                tryAllocate();
                if (context.getError() == context.OUT_OF_MEMORY) {
                    outOfMemory(description);
                }
                return; // No errors, must have worked
            } catch (e) {
                if (context.getError() != context.OUT_OF_MEMORY) {
                    SceneJS._loggingModule.error(e.message || e);
                    throw e; // We only handle out-of-memory error here
                }
                if (++tries > maxTries || !evict()) { // Too many tries or no cacher wants to evict
                    outOfMemory(description);
                }
            }
        }
    };
})();




/**
 * Backend module that services the SceneJS.Symbol and SceneJS.Instance nodes to manage instancing of scene
 * fragments called "symbols".
 *  @private
 */
SceneJS._instancingModule = new function() {
    this._symbols = {};
    this._nameStack = [];
    this._namePath = null;
    var countInstances = 0;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RESET,
            function() {
                this._symbols = {};
                this._nameStack = [];
                this._namePath = null;
                countInstances = 0;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                this._symbols = {};
                this._nameStack = [];
                this._namePath = null;
                countInstances = 0;
            });

    /** Set current SID path
     */
    this.setName = function(restore) {
        this._nameStack = restore.nameStack.slice(0);
        this._namePath = restore.namePath;

        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.NAME_UPDATED,
                this._nameStack);
    };

    /** Push node SID to current path
     */
    this.pushName = function(name) {
        this._nameStack.push(name);
        this._namePath = null;

        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.NAME_UPDATED,
                this._nameStack);
    };

    /** Get current SID path
     */
    this.getName = function() {
        return {
            nameStack : this._nameStack.slice(0),
            namePath : this._namePath
        };
    };

    /** Register Symbol against given SID path
     */
    this.createSymbol = function(name, symbol) {
        if (!this._namePath) {
            this._namePath = this._nameStack.join("/");
        }
        this._symbols[this._namePath ? this._namePath + "/" + name : name] = symbol;
    };

    /** Get Symbol registered against given SID path
     */
    this.getSymbol = function(name) {
        if (!this._namePath) {
            this._namePath = this._nameStack.join("/");
        }
        return this._symbols[getPath(this._namePath, name)];
    };

    /** Acquire instance of Symbol on given SID path
     */
    this.acquireInstance = function(name) {
        if (!this._namePath) {
            this._namePath = this._nameStack.join("/");
        }
        var symbol = this._symbols[getPath(this._namePath, name)];
        if (symbol) {
            countInstances++;
        }
        return symbol;
    };

    /**
     * Query if any Symbols are currently being instanced - useful
     * for determining if certain memoisation tricks can be done safely by nodes
     */
    this.instancing = function() {
        return countInstances > 0;
    };

    /**
     * Release current Symbol instance, effectively reacquires any
     * previously acquired
     */
    this.releaseInstance = function() {
        countInstances--;
    };

    /** Pop node SID off current path
     */
    this.popName = function() {
        this._nameStack.pop();
        this._namePath = null;

        /* Broadcast new current SID path. Not amazingly efficient since we'd do this alot,
         * but potentially there are many other modules that might be interested in it and SID
         * path should be managed in one place (module) - perhaps not instancing module's job,
         * should be factored out into a "SID path module" maybe.
         */
        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.NAME_UPDATED,
                this._nameStack);
    };


    /**
     * Returns concatenation of base and relative paths
     * following simplified UNIX-style format
     *
     * getPath(null, "../alpha") == "alpha"
     * getPath("bla", "../alpha") == "alpha"
     * getPath("boo/baa", "../alpha") == "boo/alpha"
     * getPath("boo/baa/foo", "../alpha") == "boo/baa/alpha"
     * getPath("boo/baa/foo", "../../alpha") == "boo/alpha"
     * getPath("boo/baa/foo", "/alpha") == "alpha"
     * getPath("boo/baa/foo", "alpha") == "boo/baa/foo/alpha"
     *
     * @private
     */
    function getPath(path, name) {
        if (name.charAt(0) == "/") {      // absolute path begins with "/" - remove it
            return name.substr(1);
        } else if (name.substr(0, 3) == "../") {
            name = name.substr(3);
            if (path) {
                var i = path.lastIndexOf("/");
                if (i == 0 || i == -1) {
                    return name;
                }
                return getPath(path.substr(0, i), name);
            } else {
                return name;
            }
        } else if (path) {
            return path + "/" + name;
        } else {
            return name;
        }
    }
}();
/**
 * @class A scene node that marks its subgraph as a "symbol" which can be then instanced with {@link SceneJS.Instance} nodes.
 *
 * <p>This node type is useful for keeping scene size small, while also simplifying editing of a scene; when you edit
 * content within a Symbol, all instances of the Symbol update to reflect the edits.</p>
 *
 * <p>When rendered, SceneJS registers this node against its sub-identifier (SID) and prevents SceneJS from traversing
 * into its subgraph. The content defined within the Symbol will therefore only be rendered when it is instanced.
 * The registered identity will be actually be the concatenation of the SID with the namespace formed by the SIDs
 * any enclosing nodes. When SceneJS then finds a {@link SceneJS.Instance} node with a URL that refers to the
 * registered identity, it will instantiate the Symbol's child nodes as if they were children of the {@link SceneJS.Instance}
 *  node.</p>
 *
 * <p>Beware potential performance penalties for using Symbols and {@link SceneJS.Instances}. Within every subgraph, SceneJS
 * internally memoises whatever state it determines will not change between scene traversals. SceneJS may therefore be
 * restricted in what state it can memoise within a Symbol's subgraph when it is likely to be dynamically affected by
 * the different scene locations it which it is instanced.</p>
 *
 
 * <p><b>Example Usage</b></p><p>Here we're defining a Symbol in a {@link SceneJS.Node}, then instantiating it three times with
 * {@link SceneJS.Instance} nodes to show variations on how an {@link SceneJS.Instance} node can refer to a Symbol, relative to
 * a namespace created by a {@link SceneJS.Node}:</b></p><pre><code>
 * var scene = new SceneJS.Scene(
 *
 *      // ...
 *
 *      // Define a "teapot" symbol inside a namespace.
 *
 *      new SceneJS.Node({ sid: "mySymbols"},
 *
 *          new SceneJS.Symbol({ sid: "teapot" },
 *              new SceneJS.objects.Teapot()
 *          ),
 *
 *          // Instance the teapot Symbol from inside the namespace.
 *          // See how the symbol reference is relative, where it
 *          // does not start with a '/'.
 *
 *          new SceneJS.Instance({ uri: "teapot" })
 *      ),
 *
 *      // Instance the teapot Symbol again, from outside the namespace
 *
 *      new SceneJS.Instance({ uri: "mySymbols/teapot"}),
 *
 *      // Instance the teapot Symbol one more time from outside the
 *      // namespace to show how an absolute path can be specified to
 *      // the Symbol
 *
 *      new SceneJS.Instance({ uri: "/mySymbols/teapot" })
 *
 *      // ...
 * );
 * </pre></code>
 *  @extends SceneJS.Node
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.Symbol
 * @param {Object} [cfg] Static configuration object
 * @param {String} [cfg.name="unnamed"]
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Instance}
 */
SceneJS.Symbol = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "symbol";
};

SceneJS._inherit(SceneJS.Symbol, SceneJS.Node);

// @private
SceneJS.Symbol.prototype._render = function(traversalContext, data) {
    if (!this._sid) {
        throw SceneJS._errorModule.fatalError(new SceneJS.errors.NodeConfigExpectedException
                ("SceneJS.Symbol parameter expected: sid"));
    }
    this._sidPath = SceneJS._instancingModule.getName();  // Path to this Symbol, without this Symbol's SID
    SceneJS._instancingModule.createSymbol(this._sid, this);
};


/**  Factory function that returns a new {@link SceneJS.Symbol}
 * @param {Object} [cfg] Static configuration object
 * @param {String} [cfg.name="unnamed"]
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @returns {SceneJS.Symbol}
 * @since Version 0.7.4
 */
SceneJS.symbol = function() {
    var n = new SceneJS.Symbol();
    SceneJS.Symbol.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class Instantiates the subtree of a target {@link SceneJS.Symbol} at the node's location within the scene graph.
 *
 * The flexible <a href="http://scenejs.wikispaces.com/instancing+algorithm">Instancing Algorithm</a> also permits recursive
 * instantiation, where target {@link SceneJS.Symbol}s may define further instances of other target {@link SceneJS.Symbol}s,
 * and so on. Instances may also be parameterised using the data flow capabilities provided by the
 * {@link SceneJS.WithData} and {@link SceneJS.WithConfigs} nodes.</p>
 *
 * <p>When a {@link SceneJS.Symbol} has been rendered prior to the Instance during the current scene traversal, then the
 * Instance can instantiate it with a URI that which will walk the SIDs (sub-identifiers) of previously rendered
 * nodes to resolve the {@link SceneJS.Symbol}. Here's the most trivial case - see how the fragment URI of the instance
 * maps to the {@link SceneJS.Symbol}'s SID.<p>
 * <pre><code>
 * new SceneJS.Symbol({ sid: "myBox" },
 *    new SceneJS.objects.Cube()
 * ),
 *
 * new SceneJS.Instance( { uri: "myBox" })
 * </code></pre>
 * <p>Another case, in which an Instance resolves a Symbol that is within a namespace defined by the SID of a parent
 * node:</p>
 * <pre><code>
 * new SceneJS.Node({ sid: "mySymbols" },
 *     new SceneJS.Symbol({ sid: "myBox" },
 *         new SceneJS.objects.Cube()
 *     )
 * ),
 *
 * new SceneJS.Instance( { uri: "mySymbols/myBox" })
 * </code></pre>
 * <p>Think of these nested SIDs as directories, where the URI fragment part works works the same way as a directory
 * path. An absolute fragment path begins with a '/' - in the following example, if the node with the "moreSymbols" SID
 * is defined at the top level, we may then reference it with an absolute path:</p>
 * <pre><code>
 * new SceneJS.Node({ sid: "moreSymbols" },
 *     new SceneJS.Symbol({ sid: "myOtherBox" },
 *         new SceneJS.objects.Cube()
 *     )
 * ),
 *
 * new SceneJS.Instance( { uri: "/moreSymbols/myOtherBox" })
 * </code></pre>
 *
 * <h2>States and Events</h2>
 * <p>A SceneJS.Instance has four states which it transitions through during it's lifecycle, as described below. After
 * it transitions into each state, it will fire an event - see {@link SceneJS.Node}. Also, while in {@link #STATE_RENDERING},
 * it can provide its target {@link SceneJS.Symbol} node via {@link #getTarget}.<p>
 *
 * @events
 * @extends SceneJS.Node
 * @constructor
 * Creates a new SceneJS.Instance
 *  @param {Object} [cfg] Static configuration object
 * @param {String} cfg.uri URI of file to load
 * @param {int} [cfg.timeoutSecs] Timeout - falls back on any loadTimoutSecs that was configured on the {@link SceneJS.Scene}
 * at the root of the scene graph, or the default 180 seconds if none configured there
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Instance = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "instance";
    this._uri = null;
    this._symbol = null;
    this._state = SceneJS.Instance.STATE_INITIAL;
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Instance, SceneJS.Node);

/**
 * Initial state of a SceneJS.Instance, in which it has not been rendered yet and thus not attempted to resolve its
 * target {@link SceneJS.Symbol} yet.
 * @const
 */
SceneJS.Instance.STATE_INITIAL = 0;

/**
 * State of a SceneJS.Instance in which instantiation has failed. This condition might be temporary (eg. the target
 * {@link SceneJS.Symbol} has just not been rendered yet for some reason), so a SceneJS.Instance will then try
 * instancing again when next rendered, transitioning to {@link STATE_RENDERING} when that succeeds.
 * @const
 */
SceneJS.Instance.STATE_ERROR = -1;

/**
 * State of a SceneJS.Instance in which it will attempt to instantiate its target when next rendered. This is when it
 * is ready to attempt aquisition of its target {@link SceneJS.Symbol}. From here, it will transition to
 * {@link #STATE_RENDERING} if that succeeds, otherwise it will transition to {@link #STATE_ERROR}.
 * @const
 */
SceneJS.Instance.STATE_READY = 2;


/**
 * State of an SceneJS.Instance in which it is currently rendering its target {@link SceneJS.Symbol}. While in
 * this state, you can obtain the target {@link SceneJS.Symbol} through {@link #getTarget}. From this
 * state, the SceneJS.Instance will transition back to {@link #STATE_READY} once it has completed rendering the target.
 * @const
 */
SceneJS.Instance.STATE_RENDERING = 3;

/**
 * Returns the node's current state. Possible states are {@link #STATE_INITIAL},
 * {@link #STATE_READY}, {@link #STATE_ERROR} and {@link #STATE_RENDERING}.
 * @returns {int} The state
 */
SceneJS.Instance.prototype.getState = function() {
    return this._state;
};

// @private
SceneJS.Instance.prototype._init = function(params) {
    if (params.uri) {
        this._uri = params.uri;
        this._state = SceneJS.Instance.STATE_READY;
        this._mustExist = params.mustExist;
    }
};

// @private
SceneJS.Instance.prototype._render = function(traversalContext, data) {
    if (!this._fixedParams) {
        this._init(this._getParams(data));
    }
    if (this._uri) {
        this._instanceSymbol(this._uri, traversalContext, data);
    } else {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException(
                        "SceneJS.Instance uri property not defined"));
    }
};

// @private
SceneJS.Instance.prototype._changeState = function(newState, exception) {
    var oldState = this._state;
    this._state = newState;
    if (this._listeners["state-changed"]) { // Optimisation
        this.fireEvent("state-changed", { oldState: oldState, newState: newState, exception : exception });
    }
};

/* Returns a traversal context for traversal of the children of the given target node.
 *
 * If this Instance has children then it will have a callback that will render them after the last of
 * the target's sub-nodes have rendered, as effectively the children of that last node. The callback will
 * create a traversal context for the sub-nodes that will:
 *
 * - initially flag the traversal as inside the right fringe if the there are more than one child
 * - pass on any callback that was passed in on the traversal context to this Instance
 * - pass on any WithConfigs configs that were passed in on the traversal context to this Instance
 *
 * @private
 */
SceneJS.Instance.prototype._createTargetTraversalContext = function(traversalContext, target) {
    this._superCallback = traversalContext.callback;
    var _this = this;
    if (!this._callback) {
        this._callback = function(traversalContext, data) {
            var subTraversalContext = {
                callback : _this._superCallback,
                insideRightFringe : _this._children.length > 1,
                configs: traversalContext.configs,
                configsModes: traversalContext.configsModes
            };
            _this._renderNodes(subTraversalContext, data);
        };
    }
    return {
        callback: this._callback,
        insideRightFringe:  target._children.length > 1,
        configs: traversalContext.configs,
        configsModes: traversalContext.configsModes
    };
};

/**
 * Recursively renders the subtrees (child nodes) of the Instance in left-to-right, depth-first order. As the recursion
 * descends, the traversalContext tracks whether the current node is inside the right fringe of the right-most subtree.
 * As soon as the current node is at the right fringe and has no children, then it is the last node to render among all
 * the sub-nodes (the "terminal node"). If a callback is then present on the traversalContext, then that means that this
 * Instance is actually within a subtree of a Symbol node that is being instanced by another super-Instance. The
 * callback is then invoked, which causes the traversal of the super-Instance's subtree as if it were a child of the
 * terminal node.
 *
 * @param traversalContext
 * @param data
 * @private
 */
//SceneJS.Instance.prototype._renderNodes = function(traversalContext, data) {    
//    var numChildren = this._children.length;
//    var child;
//    var childConfigs;
//    var configUnsetters;
//
//    if (numChildren == 0) {
//
//        /* Instance has no child nodes - render super-Instance's child nodes
//         * through callback if one is passed in
//         */
//        if (traversalContext.callback) {
//            traversalContext.callback(traversalContext, data);
//        }
//
//    } else {
//
//        /* Instance has child nodes - last node in Instance's subtree will invoke
//         * the callback, if any (from within its SceneJS.Node#_renderNodes)
//         */
//        var childTraversalContext;
//        for (var i = 0; i < numChildren; i++) {
//            child = this._children[i];
//            configUnsetters = null;
//            childConfigs = traversalContext.configs;
//            if (childConfigs && child._sid) {
//                childConfigs = childConfigs[child._sid];
//                if (childConfigs) {
//                    configUnsetters = this._setConfigs(childConfigs, child);
//                }
//            }
//            childTraversalContext = {
//                insideRightFringe : (i < numChildren - 1),
//                callback : traversalContext.callback,
//                configs : childConfigs || traversalContext.configs,
//                configsModes : traversalContext.configsModes
//            };
//            child._renderWithEvents.call(child, childTraversalContext, data);
//            if (configUnsetters) {
//                this._unsetConfigs(configUnsetters);
//            }
//        }
//    }
//};

/** Instances a Symbol that is currently defined after being rendered prior to this Instance
 *
 * @private
 * @param symbolSIDPath Path to Symbol, relative to this Instance
 * @param traversalContext
 * @param data
 */
SceneJS.Instance.prototype._instanceSymbol = function(symbolSIDPath, traversalContext, data) {
    this._symbol = SceneJS._instancingModule.acquireInstance(symbolSIDPath);
    if (!this._symbol) {
        //SceneJS._loggingModule.info("SceneJS.Instance could not find SceneJS.Symbol to instance: '" + symbolSIDPath + "'");
        if (this._mustExist) {
            SceneJS._instancingModule.releaseInstance();
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.SymbolNotFoundException
                            ("SceneJS.Instance could not find SceneJS.Symbol to instance: '" + symbolSIDPath + "'"));
        }
        this._changeState(SceneJS.Instance.STATE_ERROR);
    } else {
        this._changeState(SceneJS.Instance.STATE_RENDERING);
        this._symbol._renderNodes(this._createTargetTraversalContext(traversalContext, this._symbol), data);
        SceneJS._instancingModule.releaseInstance();
        this._changeState(SceneJS.Instance.STATE_READY);
        this._symbol = null;
    }
};


/**
 * While in {@link #STATE_RENDERING}, returns the target {@link SceneJS.Symbol} currently being rendered.
 * @returns {SceneJS.Symbol} Target symbol
 */
SceneJS.Instance.prototype.getTarget = function() {
    if (this.state != SceneJS.Instance.STATE_RENDERING) {
        return null;
    }
    return this._symbol;
};

/**
 * Returns the URI on which the Instance looks for its target {@link SceneJS.Symbol}
 */
SceneJS.Instance.prototype.getURI = function() {
    return this._uri;
};

/** Factory function that returns a new {@link SceneJS.Instance} instance
 *  @param {Object} [cfg] Static configuration object
 * @param {String} cfg.uri URI of file to load
 * @param {int} [cfg.timeoutSecs] Timeout - falls back on any loadTimoutSecs that was configured on the {@link SceneJS.Scene}
 * at the root of the scene graph, or the default 180 seconds if none configured there
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Instance}
 */
SceneJS.instance = function() {
    var n = new SceneJS.Instance();
    SceneJS.Instance.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class A scene branch node that selects which among its children are currently active.
 *
 * <p>This node is useful for dynamically controlling traversal within a scene graph.</p>

 * <p><b>Example Usage 1</b></p><p>This selector will allow only child nodes at indices 0 and 2 to be rendered,
 * which are the teapot and sphere. Child 1, a cube, is not selected and therefore won't be rendered.</p><pre><code>
 * var s = new SceneJS.Selector({ selection: [0, 2]},
 *
 *      new SceneJS.objects.teapot(),   // Child 0
 *
 *      new SceneJS.objects.cube(),     // Child 1
 *
 *      new SceneJS.objects.sphere())   // Child 2
 *
 * s.setSelection([0,1,2]);  // Select all three child nodes
 *
 * </pre></code>
 * <p><b>Example Usage 2</b></p><p>A more advanced example - the selector in this example switches between three
 * viewpoints of the scene content. The content is instanced within each child of the Selector using Instance and Symbol
 * nodes. When we render the scene, we can pass in the selection.</p><pre><code>
 * var myScene = new SceneJS.Scene({ ... },
 *
 *       new SceneJS.symbol({ name: "theScene" },
 *           new SceneJS.objects.Teapot()
 *       ),
 *
 *       new SceneJS.Selector(
 *               function(data) {   // Child index as a dynamic config
 *                   return {
 *                       selection: [data.get("activeCamera")]  // Selection
 *                   };
 *               },
 *
 *           new SceneJS.LookAt({ eye : { z: 10.0 } },
 *                new SceneJS.Instance({ name: "theScene"})),
 *
 *           new SceneJS.LookAt({ eye : { x: 10.0 }},
 *                new SceneJS.Instance({ name: "theScene"})),
 *
 *           new SceneJS.LookAt({ eye : { x: -5.0, y: 5, z: 5 }},
 *                new SceneJS.Instance({ name: "theScene" })
 *           )
 *       )
 *   );
 *
 * myScene.render({ activeCamera: 0 });  // Render scene for first viewpoint
 * myScene.render({ activeCamera: 1 });  // Once more for second viewpoint
 *
 * </pre></code>
 *
 *
 * @extends SceneJS.Node
 * @constructor
 * Create a new SceneJS.Selector
 * @param {Object} config  Config object or function, followed by zero or more child nodes
 */
SceneJS.Selector = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "selector";
    this._selection = [];
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Selector, SceneJS.Node);

/**
 Sets the indices of selected children. When the value is undefined or an empty array, then no children will be selected.
 @function setSelection
 @param {int []} selection
 @returns {SceneJS.Selector} This Selector node
 */
SceneJS.Selector.prototype.setSelection = function(selection) {
    selection = selection || [];
    this._selection = selection;
    return this;
};

/**
 * Returns the indices of the selected child. The result will be an empty array if none are currently selected.
 * @function {int []} getSelection
 * @returns {int []} Array containing indices of selected children.
 */
SceneJS.Selector.prototype.getSelection = function() {
    var selection = new Array(this._selection.length);
    for (var i = 0; i < this._selection.length; i++) {
        selection[i] = this._selection[i];
    }
    return selection;
};

// @private
SceneJS.Selector.prototype._init = function(params) {
    if (params.selection) {
        this.setSelection(params.selection);
    }
};

// @private
SceneJS.Selector.prototype._render = function(traversalContext, data) {
    if (!this._fixedParams) {
       this._init( this._getParams(data));
    }
    if (this._selection.length) {
        var children = [];
        for (var i = 0; i < this._selection.length; i++) {
            var j = this._selection[i];
            if (0 <= j && j < this._children.length) {
                children.push(this._children[j]);
            }
        }
        this._renderNodes(traversalContext, data, children);
    }
};

/** Factory function that returns a new {@link SceneJS.Selector} instance
 * @param {Arguments} args Variable arguments that are passed to the SceneJS.Selector constructor
 * @returns {SceneJS.Selector}
 */
SceneJS.selector = function() {
    var n = new SceneJS.Selector();
    SceneJS.Selector.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend module for asynchronous process management.
 *
 * This module provides creation, destruction and query of SceneJS processes.
 *
 * This module maintains a separate group of processes for each active scene. When a scene is defined, it
 * will create a group for it, then whenever it is deactivated it will automatically reap all processes
 * in its group that have timed out.
 *
 *  @private
 */
SceneJS._processModule = new (function() {

    var time = (new Date()).getTime();          // System time
    var groups = {};                            // A process group for each existing scene
    var activeSceneId;                          // ID of currently-active scene

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.TIME_UPDATED,
            function(t) {
                time = t;
            });

    SceneJS._eventModule.addListener(// Scene defined, create new process group for it
            SceneJS._eventModule.SCENE_CREATED,
            function(params) {
                var group = {   // IDEA like this
                    sceneId : params.sceneId,
                    processes: {} ,
                    numProcesses : 0
                };
                groups[params.sceneId] = group;
            });

    SceneJS._eventModule.addListener(// Scene traversal begins
            SceneJS._eventModule.SCENE_RENDERING,
            function(params) {
                activeSceneId = params.sceneId;
            });

    SceneJS._eventModule.addListener(// Scene traversed - reap its dead and timed-out processes
            SceneJS._eventModule.SCENE_RENDERED,
            function() {
                var group = groups[activeSceneId];
                var processes = group.processes;
                for (var pid in processes) {
                    var process = processes[pid];
                    if (process) {
                        if (process.destroyed) {
                            processes[pid] = undefined;
                            group.numProcesses--;
                        } else {
                            var elapsed = time - process.timeStarted;
                            if ((process.timeoutSecs > -1) && (elapsed > (process.timeoutSecs * 1000))) {

                                SceneJS._loggingModule.warn("Process timed out after " +
                                                           process.timeoutSecs +
                                                           " seconds: " + process.description);

                                /* Process timed out - notify listeners
                                 */
                                SceneJS._eventModule.fireEvent(SceneJS._eventModule.PROCESS_TIMED_OUT, {
                                    sceneId: activeSceneId,
                                    process: {
                                        id: process.id,
                                        timeStarted : process.timeStarted,
                                        description: process.description,
                                        timeoutSecs: process.timeoutSecs
                                    }
                                });

                                process.destroyed = true;
                                processes[pid] = undefined;
                                group.numProcesses--;
                                if (process.onTimeout) {
                                    process.onTimeout();
                                }
                            } else {
                                process.timeRunning = elapsed;
                            }
                        }
                    }
                }
                activeSceneId = null;
            });

    SceneJS._eventModule.addListener(// Scene destroyed - destroy its process group
            SceneJS._eventModule.SCENE_DESTROYED,
            function(params) {
                groups[params.sceneId] = undefined;
            });

    SceneJS._eventModule.addListener(// Framework reset - destroy all process groups
            SceneJS._eventModule.RESET,
            function(params) {
                groups = {};
                activeSceneId = null;
            });


    /**
     *
     * Creates a new asynchronous process for the currently active scene and returns a handle to it.
     * The handle is actually an object containing live information on the process, which must
     * not be modified.
     *
     * Example:
     *
     * createProcess({
     *      description: "loading texture image",
     *      timeoutSecs: 30,                         // 30 Seconds
     *      onTimeout(function() {
     *              alert("arrrg!!");
     *          });
     *
     * @private
     */
    this.createProcess = function(cfg) {
        if (!activeSceneId) {
            throw SceneJS._errorModule.fatalError(new SceneJS.errors.NoSceneActiveException("No scene active - can't create process"));
        }
        var group = groups[activeSceneId];
        var i = 0;
        while (true) {
            var pid = activeSceneId + i++;
            if (!group.processes[pid]) {

                /* Register process
                 */
                var process = {
                    sceneId: activeSceneId,
                    id: pid,
                    timeStarted : time,
                    timeRunning: 0,
                    description : cfg.description || "",
                    timeoutSecs : cfg.timeoutSecs || 30, // Thirty second default timout
                    onTimeout : cfg.onTimeout
                };
                group.processes[pid] = process;
                group.numProcesses++;

                /* Notify listeners
                 */
                SceneJS._eventModule.fireEvent(SceneJS._eventModule.PROCESS_CREATED, {
                    sceneId: activeSceneId,
                    process: {
                        id: process.id,
                        timeStarted : process.timeStarted,
                        description: process.description,
                        timeoutSecs: process.timeoutSecs
                    }
                });

                return process;
            }
        }
    };

    /**
     * Destroys the given process, which is the object returned by the previous call to createProcess.
     * Does not care if no scene is active, or if the process no longer exists or is dead.
     *
     * @private
     */
    this.killProcess = function(process) {
        if (process) {
            process.destroyed = true;

            /* Notify listeners
             */
            SceneJS._eventModule.fireEvent(SceneJS._eventModule.PROCESS_KILLED, {
                sceneId: activeSceneId,
                process: {
                    id: process.id,
                    timeStarted : process.timeStarted,
                    description: process.description,
                    timeoutSecs: process.timeoutSecs
                }
            });
        }
    };

    /**
     * Returns the number of living processes for either the scene of the given ID, or if
     * no ID supplied, the active scene. If no scene is active, returns zero.
     *
     * @private
     */
    this.getNumProcesses = function(sceneId) {
        var group = groups[sceneId];
        if (!group) {
            return 0;
        }
        return sceneId ? group.numProcesses : (activeSceneId ? groups[activeSceneId].numProcesses : 0);
    };

    /**
     * Returns all living processes for the given scene, which may be null, in which case this
     * method will return the living processes for the currently active scene by default. An empty map
     * will be returned if there is no scene active.
     *
     * Process info looks like this:
     *
     *      {   id: "xx",
     *          timeStarted :   65765765765765,             // System time in milliseconds
     *          timeRunning:    876870,                     // Elapsed time in milliseconds
     *          description :   "loading texture image",
     *          timeoutSecs :       30,                      // Timeout in milliseconds
     *          onTimeout :     <function>                  // Function that will fire on timeoutSecs
     *
     * @private
     */
    this.getProcesses = function(sceneId) {
        var group = groups[sceneId];
        if (!group) {
            return {};
        }
        return sceneId ? group.processes : (activeSceneId ? groups[activeSceneId].processes : {});
    };
})();
/**
 * Backend for a scene node.
 *  @private
 */
SceneJS._sceneModule = new (function() {

    var initialised = false; // True as soon as first scene registered
    var scenes = {};
    var nScenes = 0;
    var activeSceneId;

    var projMat;
    var viewMat;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RESET,
            function() {
                scenes = {};
                nScenes = 0;
                activeSceneId = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.PROJECTION_TRANSFORM_UPDATED,
            function(params) {
                projMat = params.matrix;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.VIEW_TRANSFORM_UPDATED,
            function(params) {
                viewMat = params.matrix;
            });

    /** Locates element in DOM to write logging to
     * @private
     */
    function findLoggingElement(loggingElementId) {
        var element;
        if (!loggingElementId) {
            element = document.getElementById(SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID);
            if (!element) {
                SceneJS._loggingModule.info("SceneJS.Scene config 'loggingElementId' omitted and failed to find default logging element with ID '"
                        + SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID + "' - that's OK, logging to browser console instead");
            }
        } else {
            element = document.getElementById(loggingElementId);
            if (!element) {
                element = document.getElementById(SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID);
                if (!element) {
                    SceneJS._loggingModule.info("SceneJS.Scene config 'loggingElementId' unresolved and failed to find default logging element with ID '"
                            + SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID + "' - that's OK, logging to browser console instead");
                } else {
                    SceneJS._loggingModule.info("SceneJS.Scene config 'loggingElementId' unresolved - found default logging element with ID '"
                            + SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID + "' - logging to browser console also");
                }
            } else {
                SceneJS._loggingModule.info("SceneJS.Scene logging to element with ID '"
                        + loggingElementId + "' - logging to browser console also");
            }
        }
        return element;
    }

    /** Locates canvas in DOM, finds WebGL context on it,
     *  sets some default state on the context, then returns
     *  canvas, canvas ID and context wrapped up in an object.
     *
     * If canvasId is null, will fall back on SceneJS.Scene.DEFAULT_CANVAS_ID
     * @private
     */
    function findCanvas(canvasId) {
        var canvas;
        if (!canvasId) {
            SceneJS._loggingModule.info("SceneJS.Scene config 'canvasId' omitted - looking for default canvas with ID '"
                    + SceneJS.Scene.DEFAULT_CANVAS_ID + "'");
            canvasId = SceneJS.Scene.DEFAULT_CANVAS_ID;
            canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.CanvasNotFoundException
                        ("SceneJS.Scene failed to find default canvas with ID '"
                                + SceneJS.Scene.DEFAULT_CANVAS_ID + "'"));
            }
        } else {
            canvas = document.getElementById(canvasId);
            if (canvas) {
                SceneJS._loggingModule.info("SceneJS.Scene binding to canvas '" + canvasId + "'");
            } else {
                SceneJS._loggingModule.info("SceneJS.Scene config 'canvasId' unresolved - looking for default canvas with " +
                                            "ID '" + SceneJS.Scene.DEFAULT_CANVAS_ID + "'");
                canvasId = SceneJS.Scene.DEFAULT_CANVAS_ID;
                canvas = document.getElementById(canvasId);
                if (!canvas) {
                    throw SceneJS._errorModule.fatalError(new SceneJS.errors.CanvasNotFoundException
                            ("SceneJS.Scene config 'canvasId' does not match any elements in the page and no " +
                             "default canvas found with ID '" + SceneJS.Scene.DEFAULT_CANVAS_ID + "'"));
                }
            }
        }
        var context;
        var contextNames = SceneJS.SUPPORTED_WEBGL_CONTEXT_NAMES;
        for (var i = 0; (!context) && i < contextNames.length; i++) {
            try {            
                if (SceneJS._debugModule.getConfigs("webgl.logTrace") == true) {

                    context = canvas.getContext(contextNames[i]);
                    if (context) {
                       // context = WebGLDebugUtils.makeDebugContext(context);

                        context = WebGLDebugUtils.makeDebugContext(
                                context,
                                function(err, functionName, args) {
                                    SceneJS._loggingModule.error(
                                            "WebGL error calling " + functionName +
                                            " on WebGL canvas context - see console log for details");
                                });
                        context.setTracing(true);
                        

                    }
                } else {
                    context = canvas.getContext(contextNames[i]);
                }
            } catch (e) {

            }
        }
        if (!context) {
            throw SceneJS._errorModule.fatalError(new SceneJS.errors.WebGLNotSupportedException
                    ('Canvas document element with ID \''
                            + canvasId
                            + '\' failed to provide a supported WebGL context'));
        }
        context.clearColor(0.0, 0.0, 0.0, 1.0);
        context.clearDepth(1.0);
        context.enable(context.DEPTH_TEST);
        context.disable(context.CULL_FACE);
        context.depthRange(0, 1);
        context.disable(context.SCISSOR_TEST);
        return {
            canvas: canvas,
            context: context,
            canvasId : canvasId
        };
    }

    /** Registers a scene, finds it's canvas, and returns the ID under which the scene is registered
     * @private
     */
    this.createScene = function(scene, params) {
        if (!initialised) {
            SceneJS._loggingModule.info("SceneJS V" + SceneJS.VERSION + " initialised");
            SceneJS._eventModule.fireEvent(SceneJS._eventModule.INIT);
        }
        var canvas = findCanvas(params.canvasId); // canvasId can be null
        var loggingElement = findLoggingElement(params.loggingElementId); // loggingElementId can be null
        var sceneId = SceneJS._createKeyForMap(scenes, "s");
        scenes[sceneId] = {
            sceneId: sceneId,
            scene:scene,
            canvas: canvas,
            loggingElement: loggingElement
        };
        nScenes++;
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.SCENE_CREATED, {sceneId : sceneId });
        SceneJS._loggingModule.info("Scene defined: " + sceneId);
        return sceneId;
    };

    /** Deregisters scene
     * @private
     */
    this.destroyScene = function(sceneId) {
        scenes[sceneId] = null;
        nScenes--;
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.SCENE_DESTROYED, {sceneId : sceneId });
        if (activeSceneId == sceneId) {
            activeSceneId = null;
        }
        SceneJS._loggingModule.info("Scene destroyed: " + sceneId);
        if (nScenes == 0) {
            SceneJS._loggingModule.info("SceneJS reset");
            SceneJS._eventModule.fireEvent(SceneJS._eventModule.RESET);

        }
    };

    /** Specifies which registered scene is the currently active one
     * @private
     */
    this.activateScene = function(sceneId) {
        var scene = scenes[sceneId];
        if (!scene) {
            throw SceneJS._errorModule.fatalError("Scene not defined: '" + sceneId + "'");
        }
        activeSceneId = sceneId;
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.LOGGING_ELEMENT_ACTIVATED, { loggingElement: scene.loggingElement });
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.SCENE_RENDERING, { sceneId: sceneId, canvas : scene.canvas });
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.CANVAS_ACTIVATED, scene.canvas);

    };

    /** Returns the canvas element the given scene is bound to
     * @private
     */
    this.getSceneCanvas = function(sceneId) {
        var scene = scenes[sceneId];
        if (!scene) {
            throw SceneJS._errorModule.fatalError("Scene not defined: '" + sceneId + "'");
        }
        return scene.canvas.canvas;
    };
    //
    //                activatePick : function(sceneId) {
    //
    //                },

    /** Returns all registered scenes
     * @private
     */
    this.getAllScenes = function() {
        var list = [];
        for (var id in scenes) {
            var scene = scenes[id];
            if (scene) {
                list.push(scene.scene);
            }
        }
        return list;
    };

    /** Finds a registered scene
     * @private
     */
    this.getScene = function(sceneId) {
        return scenes[sceneId].scene;
    };

    /** Deactivates the currently active scene and reaps destroyed and timed out processes
     * @private
     */
    this.deactivateScene = function() {
        if (!activeSceneId) {
            throw SceneJS._errorModule.fatalError("Internal error: no scene active");
        }
        var sceneId = activeSceneId;
        activeSceneId = null;
        var scene = scenes[sceneId];
        if (!scene) {
            throw SceneJS._errorModule.fatalError("Scene not defined: '" + sceneId + "'");
        }
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.CANVAS_DEACTIVATED, scene.canvas);
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.SCENE_RENDERED, {sceneId : sceneId });
        //SceneJS._loggingModule.info("Scene deactivated: " + sceneId);
    };
})();
/**
 *@class Root node of a SceneJS scene graph.
 *
 * <p>This is entry and exit point for traversal of a scene graph, providing the means to inject data, pick 
 * {@link SceneJS.Geometry} and render frames either singularly or in a continuous loop.</p>
 * <p><b>Binding to a canvas</b></p>
 * <p>The Scene node can be configured with a <b>canvasId</b> property to specify the ID of a WebGL compatible Canvas
 * element for the scene to render to. When that is omitted, the node will look for one with the default ID of
 * "_scenejs-default-canvas".</p>
 * <p><b>Usage Example:</b></p><p>Below is a minimal scene graph. To render the scene, SceneJS will traverse its nodes
 * in depth-first order. Each node will set some scene state on entry, then un-set it again before exit. In this graph,
 * the {@link SceneJS.Scene} node binds to a WebGL Canvas element, a {@link SceneJS.LookAt} defines the viewoint,
 * a {@link SceneJS.Camera} defines the projection, a {@link SceneJS.Lights} defines a light source,
 * a {@link SceneJS.Material} defines the current material properties, {@link SceneJS.Rotate} nodes orient the modeling
 * coordinate space, then a {@link SceneJS.objects.Cube} defines our cube.</p>
 * <pre><code>
 *
 * var myScene = new SceneJS.Scene({
 *     canvasId: 'theCanvas'
 *   },
 *
 *   new SceneJS.LookAt({
 *       eye  : { x: -1.0, y: 0.0, z: 15 },
 *       look : { x: -1.0, y: 0, z: 0 },
 *       up   : { y: 1.0 }
 *     },
 *
 *     new SceneJS.Camera({
 *         optics: {
 *           type: "perspective",
 *           fovy   : 55.0,
 *           aspect : 1.0,
 *           near   : 0.10,
 *           far    : 1000.0
 *         }
 *       },
 *
 *       new SceneJS.Lights({
 *           sources: [
 *             {
 *               type:  "dir",
 *               color: { r: 1.0, g: 1.0, b: 1.0 },
 *               dir:   { x: 1.0, y: -1.0, z: 1.0 }
 *             },
 *             {
 *               type:  "dir",
 *               color: { r: 1.0, g: 1.0, b: 1.0 },
 *               dir:   { x: -1.0, y: -1.0, z: -3.0 }
 *             }
 *           ]
 *         },
 *
 *         new SceneJS.Material({
 *                  baseColor:      { r: 0.9, g: 0.2, b: 0.2 },
 *                  specularColor:  { r: 0.9, g: 0.9, b: 0.2 },
 *                  emit:           0.0,
 *                  specular:       0.9,
 *                  shine:          6.0
 *             },
 *
 *             new SceneJS.Rotate(
 *                 function(data) {
 *                    return {
 *                      angle: data.get('yaw'), y : 1.0
 *                   };
 *                 },
 *
 *                 new SceneJS.Rotate(
 *                     function(data) {
 *                       return {
 *                         angle: data.get('pitch'), x : 1.0
 *                       };
 *                     },
 *
 *                     new SceneJS.objects.Cube()
 *                   )
 *                )
 *              )
 *            )
 *          )
 *       )
 *     );
 *
 *   myScene.setData({ yaw: 315, pitch: 20 });
 *   myScene.render();
 * </pre></code>
 * <p>Take a closer look at those rotate nodes. See how they can optionally take a function which feeds them their
 * parameters? You can do that for any node to dynamically evaluate parameters for them at traversal-time. The functions
 * take an immutable data object, which is SceneJS's mechanism for passing variables down into scene graphs. Using the
 * yaw and pitch properties on that data object, our functions create configurations that specify rotations about
 * the X and Y axis. See also how we inject those angles when we render the scene.</p>
 * <h2>Rendering in a Loop</h2>
 * <p>If you wanted to animate the rotation within the scene example above, then instead of rendering just a single frame
 * you could start a rendering loop on the scene, as shown below:</p>
 * <pre><code>
 *    var yaw = 0.0;
 *    var pitch = 20.0
 *
 *    myScene.start({
 *
 *        // Idle function called before each render traversal
 *
 *        idleFunc: function(scene) {
 *             scene.setData({ yaw: yaw, pitch: 20 };
 *
 *             yaw += 2.0;
 *             if (yaw == 360) {
 *                 scene.stop();
 *             }
 *        },
 *
 *        fps: 20
 * });
 * </code></pre>
 * @extends SceneJS.Node
 */
SceneJS.Scene = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "scene";
    if (!this._fixedParams) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException
                        ("Dynamic configuration of SceneJS.scene node is not supported"));
    }
    this._params = this._getParams();
    this._data = {};
    this._configs = {};
    if (this._params.canvasId) {
        this._canvasId = document.getElementById(this._params.canvasId) ? this._params.canvasId : SceneJS.Scene.DEFAULT_CANVAS_ID;
    } else {
        this._canvasId = SceneJS.Scene.DEFAULT_CANVAS_ID;
    }
};

SceneJS._inherit(SceneJS.Scene, SceneJS.Node);

/** ID of canvas SceneJS looks for when {@link SceneJS.Scene} node does not supply one
 */
SceneJS.Scene.DEFAULT_CANVAS_ID = "_scenejs-default-canvas";

/** ID ("_scenejs-default-logging") of default element to which {@link SceneJS.Scene} node will log to, if found.
 */
SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID = "_scenejs-default-logging";

/** Returns the ID of the canvas element that this scene is to bind to. When no canvasId was configured, it will be the
 * the default ID of "_scenejs-default-canvas".
 */
SceneJS.Scene.prototype.getCanvasId = function() {
    return this._canvasId;
};

/**
 * Starts the scene rendering repeatedly in a loop. After this {@link #isRunning} will return true, and you can then stop it again
 * with {@link #stop}. You can specify an idleFunc that will be called within each iteration before the scene graph is
 * traversed for the next frame. You can also specify the desired number of frames per second to render, which SceneJS
 * will attempt to achieve.
 *
 * To render just one frame at a time, use {@link #render}.
 *
 * <p><b>Usage Example: Basic Loop</b></p><p>Here we are rendering a scene in a loop, at each frame feeding some data into it
 * (see main {@link SceneJS.Scene} comment for more info on that), then stopping the loop after ten frames are rendered:</p>
 *
 * <pre><code>
 * var n = 0;
 * myScene.start({
 *     idleFunc: function(scene) {
 *
 *         scene.setData({ someData: 5, moreData: 10 };
 *
 *         n++;
 *         if (n == 100) {
 *             scene.stop();
 *         }
 *     },
 *     fps: 20
 * });
 * </code></pre>
 *
 *
 * <p><b>Usage Example: Picking</b></p><p>The snippet below shows how to do picking via the idle function, where we
 * retain the mouse click event in some variables which are collected when the idleFunc is next called. The idleFunc
 * then puts the scene into picking mode for the next traversal. Then any {@link SceneJS.Geometry} intersecting the
 * canvas-space coordinates during that traversal will fire a "picked" event to be observed by "picked" listeners at
 * higher nodes (see examples, wiki etc. for the finer details of picking). After the traversal, the scene will be back
 * "rendering" mode again.</p>
 *
 * <pre><code>
 * var clicked = false;
 * var clickX, clickY;
 *
 * canvas.addEventListener('mousedown',
 *     function (event) {
 *         clicked = true;
 *         clickX = event.clientX;
 *         clickY = event.clientY;
 * }, false);
 *
 * myScene.start({
 *     idleFunc: function(scene) {
 *         if (clicked) {
 *             scene.pick(clickX, clickY);
 *             clicked = false;
 *         }
 *     }
 * });
 * </code></pre>
 * @param cfg
 */
SceneJS.Scene.prototype.start = function(cfg) {
    if (!this._running) {
        this._running = true;
        var self = this;
        var fnName = "__scenejs_renderScene" + this._sceneId;
        window[fnName] = function() {
            if (cfg.idleFunc) {
                cfg.idleFunc(self);
            }
            if (self._running) { // idleFunc may have stopped render loop
                self.render();
            }
        };
        this._pInterval = setInterval("window['" + fnName + "']()", 1000.0 / (cfg.fps || 10));
    }
};

/** Returns true if the scene is currently rendering repeatedly in a loop after being started with {@link #start}.
 */
SceneJS.Scene.prototype.isRunning = function() {
    return this._running;
};

/**
 * Sets a map of values to set on the global scene data scope when the scene is next rendered.
 * This data will then be available to any configuration callbacks that are used to configure nodes. The map is the same
 * as that configured on a {@link SceneJS.WithData} and works the same way.
 * @param {object} values Values for the global scene data scope, same format as that given to {@link SceneJS.WithData}
 */
SceneJS.Scene.prototype.setData = function(values) {
    this._data = values || {};
    return this;
};

/**
 * Returns any data values map previously set with {@link #setData} since the last call to {@link #render}.
 *
 * @returns {Object} The data values map
 */
SceneJS.Scene.prototype.getData = function() {
    return this._configs;
};

/**
 * Sets a map of values to set on target nodes in the scene graph when the scene is next rendered. The map is the same as that
 * configured on a {@link SceneJS.WithConfigs} and works the same way.
 * @param {object} values Map of values, same format as that given to {@link SceneJS.WithConfigs}
 */
SceneJS.Scene.prototype.setConfigs = function(values) {
    this._configs = values || {};
    return this;
};

/**
 * Returns the config values map that was last set with {@link #setConfigs}.
 *
 * @returns {Object} The config values map
 */
SceneJS.Scene.prototype.getConfigs = function() {
    return this._configs;
};

/**
 * Immediately renders one frame of the scene, applying any config and data scope values given to {@link #setData} and
 * {#link #setConfigs}, retaining those values in the scene afterwards. Has no effect if the scene has been
 * {@link #start}ed and is currently rendering in a loop.
 */
SceneJS.Scene.prototype.render = function() {
    if (!this._running) {
        this._render();
    }
};

/** @private
 */
SceneJS.Scene.prototype._render = function() {
    if (!this._sceneId) {
        this._sceneId = SceneJS._sceneModule.createScene(this, this._getParams());
    }
    SceneJS._sceneModule.activateScene(this._sceneId);
    var traversalContext = {};
    this._renderNodes(traversalContext, new SceneJS.Data(null, false, this._data));
    SceneJS._sceneModule.deactivateScene();
};

/**
 * Picks whatever {@link SceneJS.Geometry} will be rendered at the given canvas coordinates. When this is called within
 * the idle function of a currently running render loop (ie. started with {@link #start) then pick will be performed on
 * the next render. When called on a non-running scene, the pick is performed immediately.
 * When a node is picked (hit), then all nodes on the traversal path to that node that have "picked" listeners will
 * receive a "picked" event as they are rendered (see examples and wiki for more info).
 *
 * @param canvasX Canvas X-coordinate
 * @param canvasY Canvas Y-coordinate
 */
SceneJS.Scene.prototype.pick = function(canvasX, canvasY) {
    if (!this._sceneId) {
        throw new SceneJS.errors.InvalidSceneGraphException
                ("Attempted pick on Scene that has been destroyed or not yet rendered");
    }
    SceneJS._pickModule.pick(canvasX, canvasY); // Enter pick mode
    if (!this._running) {
        this._render(); // Pick-mode traversal - get picked element and fire events
        this._render(); // Render-mode traversal - process events with listeners while drawing
    }
};

/**
 * Returns count of active processes. A non-zero count indicates that the scene should be rendered
 * at least one more time to allow asynchronous processes to complete - since processes are
 * queried like this between renders (ie. in the idle period), to avoid confusion processes are killed
 * during renders, not between, in order to ensure that this count doesnt change unexpectedly and create
 * a race condition.
 */
SceneJS.Scene.prototype.getNumProcesses = function() {
    return (this._sceneId) ? SceneJS._processModule.getNumProcesses(this._sceneId) : 0;
};

/** Destroys this scene. You should destroy
 * a scene as soon as you are no longer using it, to ensure that SceneJS does not retain
 * resources for it (eg. shaders, VBOs etc) that are no longer in use. A destroyed scene
 * becomes un-destroyed as soon as you render it again. If the scene is currently rendering in a loop (after a call
 * to {@link #start}) then the loop is stopped.
 */
SceneJS.Scene.prototype.destroy = function() {
    if (this._sceneId) {
        this.stop();
        SceneJS._sceneModule.destroyScene(this._sceneId); // Last one fires RESET command
        this._sceneId = null;
    }
};

/** Returns true if scene active, ie. not destroyed. A destroyed scene becomes active again
 * when you render it.
 */
SceneJS.Scene.prototype.isActive = function() {
    return (this._sceneId != null);
};

/** Stops current render loop that was started with {@link #start}. After this, {@link #isRunning} will return false.
 */
SceneJS.Scene.prototype.stop = function() {
    if (this._running) {
        this._running = false;
        window["__scenejs_renderScene" + this._sceneId] = null;
        window.clearInterval(this._pInterval);
    }
};

/** Factory function that returns a new {@link SceneJS.Scene} instance
 * @param {Arguments} args Variable arguments that are passed to the SceneJS.Scene constructor
 * @returns {SceneJS.Scene}
 */
SceneJS.scene = function() {
    var n = new SceneJS.Scene();
    SceneJS.Scene.prototype.constructor.apply(n, arguments);
    return n;
};

/** Total SceneJS reset - destroys all scenes and cached resources.
 */
SceneJS.reset = function() {
    var scenes = SceneJS._sceneModule.getAllScenes();
    var temp = [];
    for (var i = 0; i < scenes.length; i++) {
        temp.push(scenes[i]);
    }
    while (temp.length > 0) {

        /* Destroy each scene individually so it they can mark itself as destroyed.
         * A RESET command will be fired after the last one is destroyed.
         */
        temp.pop().destroy();
    }
};

/**
 * This module encapsulates shading behind an event API.
 *
 * By listening to XXX_UPDATED events, this module tracks various elements of scene state, such as WebGL settings,
 * texture layers, lighting, current material properties etc.
 *
 * On a SHADER_ACTIVATE event it will compose and activate a shader taylored to the current scene state
 * (ie. where the shader has variables and routines for the current lights, materials etc), then fire a
 * SHADER_ACTIVATED event when the shader is ready for business.
 *
 * Other modules will then handle the SHADER_ACTIVATED event by firing XXXXX_EXPORTED events parameterised with
 * resources that they want loaded into the shader. This module then handles those by loading their parameters into
 * the shader.
 *
 * The module will avoid constant re-generation of shaders by caching each of them against a hash code that it
 * derives from the current collective scene state; on a SHADER_ACTIVATE event, it will attempt to reuse a shader
 * cached for the hash of the current scene state.
 *
 * Shader allocation and LRU cache eviction is mediated by SceneJS._memoryModule.
 *  @private
 */
SceneJS._shaderModule = new (function() {

    var debugCfg;

    var time = (new Date()).getTime();      // For LRU caching

    /* Resources contributing to shader
     */
    var canvas;                             // Currently active canvas
    var rendererState;                      // WebGL settings state
    var lights = [];                        // Current lighting state
    var material = {};                      // Current material state
    var fog = null;                         // Current fog
    var textureLayers = [];                 // Texture layers are pushed/popped to this as they occur
    var geometry = null;                    // Current geometry

    /* Hash codes identifying states of contributing resources
     */
    var rendererHash = "";
    var fogHash = "";
    var lightsHash = "";
    var textureHash = "";
    var geometryHash = "";

    /* Shader programs
     */
    var programs = {};                      // Program cache
    var activeProgram = null;               // Currently active program

    /* Combined hash from those of contributing resources, to identify shaders
     */
    var sceneHash;


    SceneJS._eventModule.addListener(
            SceneJS._eventModule.TIME_UPDATED,
            function(t) {
                time = t;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RESET,
            function() {
                for (var programId in programs) {  // Just free allocated programs
                    programs[programId].destroy();
                }
                programs = {};
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                debugCfg = SceneJS._debugModule.getConfigs("shading");
                canvas = null;
                rendererState = null;
                activeProgram = null;
                lights = [];
                material = {};
                textureLayers = [];

                sceneHash = null;
                fogHash = "";
                lightsHash = "";
                textureHash = "";
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.CANVAS_ACTIVATED,
            function(c) {
                canvas = c;
                activeProgram = null;
                sceneHash = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.CANVAS_DEACTIVATED,
            function() {
                canvas = null;
                activeProgram = null;
                sceneHash = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RENDERER_UPDATED,
            function(_rendererState) {
                rendererState = _rendererState;  // Canvas change will be signified by a CANVAS_UPDATED
                sceneHash = null;
                rendererHash = "";
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RENDERER_EXPORTED,
            function(_rendererState) {

                /* Default ambient material colour is taken from canvas clear colour
                 */
                var clearColor = _rendererState.clearColor;
                activeProgram.setUniform("uAmbient",
                        clearColor
                                ? [clearColor.r, clearColor.g, clearColor.b]
                                : [0, 0, 0]);
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.TEXTURES_UPDATED,
            function(stack) {
                textureLayers = stack;
                sceneHash = null;

                /* Build texture hash
                 */
                var hash = [];
                for (var i = 0; i < stack.length; i++) {
                    var layer = textureLayers[i];
                    hash.push("/");
                    hash.push(layer.params.applyFrom);
                    hash.push("/");
                    hash.push(layer.params.applyTo);
                    hash.push("/");
                    hash.push(layer.params.blendMode);
                    if (layer.params.matrix) {
                        hash.push("/anim");
                    }
                }
                textureHash = hash.join("");
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.TEXTURES_EXPORTED,
            function(stack) {
                for (var i = 0; i < stack.length; i++) {
                    var layer = stack[i];
                    activeProgram.bindTexture("uSampler" + i, layer.texture, i);
                    if (layer.params.matrixAsArray) {
                        activeProgram.setUniform("uLayer" + i + "Matrix", layer.params.matrixAsArray);
                    }
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.LIGHTS_UPDATED,
            function(l) {
                lights = l;
                sceneHash = null;

                /* Build lights hash
                 */
                var hash = [];
                for (var i = 0; i < lights.length; i++) {
                    var light = lights[i];
                    hash.push(light._type);
                    if (light._specular) {
                        hash.push("s");
                    }
                    if (light._diffuse) {
                        hash.push("d");
                    }
                }
                lightsHash = hash.join("");
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.LIGHTS_EXPORTED,
            function(_lights) {
                var ambient;
                for (var i = 0; i < _lights.length; i++) {
                    var light = _lights[i];
                    activeProgram.setUniform("uLightColor" + i, light._color);
                    activeProgram.setUniform("uLightDiffuse" + i, light._diffuse);
                    if (light._type == "dir") {
                        activeProgram.setUniform("uLightDir" + i, light._viewDir);
                    } else if (light.type == "ambient") {
                        ambient = ambient ? [
                            ambient[0] + light._color[0],
                            ambient[1] + light._color[1],
                            ambient[2] + light._color[2]
                        ] : light._color;
                    } else {
                        if (light._type == "point") {
                            activeProgram.setUniform("uLightPos" + i, light._viewPos);
                        }
                        if (light._type == "spot") {
                            activeProgram.setUniform("uLightPos" + i, light._viewPos);
                            activeProgram.setUniform("uLightDir" + i, light._viewDir);
                            activeProgram.setUniform("uLightSpotCosCutOff" + i, light._spotCosCutOff);
                            activeProgram.setUniform("uLightSpotExp" + i, light._spotExponent);
                        }
                        activeProgram.setUniform("uLightAttenuation" + i,
                                [
                                    light._constantAttenuation,
                                    light._linearAttenuation,
                                    light._quadraticAttenuation
                                ]);
                    }
                }
                if (ambient) {
                    //activeProgram.setUniform("uLightPos" + i, light._viewPos);
                }
            });


    SceneJS._eventModule.addListener(
            SceneJS._eventModule.MATERIAL_UPDATED,
            function(m) {
                material = m;
                sceneHash = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.MATERIAL_EXPORTED,
            function(m) {
                activeProgram.setUniform("uMaterialBaseColor", m.baseColor);
                activeProgram.setUniform("uMaterialSpecularColor", m.specularColor);

                activeProgram.setUniform("uMaterialSpecular", m.specular);
                activeProgram.setUniform("uMaterialShine", m.shine);
                activeProgram.setUniform("uMaterialEmit", m.emit);
                activeProgram.setUniform("uMaterialAlpha", m.alpha);
            });

    /**
     * When in pick mode, then with the pick fragment shader loaded, we'll get the
     * pick color instead of a material
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.PICK_COLOR_EXPORTED,
            function(p) {
                activeProgram.setUniform("uPickColor", p.pickColor);
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.FOG_UPDATED,
            function(f) {
                fog = f;
                sceneHash = null;
                fogHash = fog ? fog.mode : "";
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.FOG_EXPORTED,
            function(f) {
                activeProgram.setUniform("uFogColor", f.color);
                activeProgram.setUniform("uFogDensity", f.density);
                activeProgram.setUniform("uFogStart", f.start);
                activeProgram.setUniform("uFogEnd", f.end);
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.MODEL_TRANSFORM_EXPORTED,
            function(transform) {
                activeProgram.setUniform("uMMatrix", transform.matrixAsArray);
                activeProgram.setUniform("uMNMatrix", transform.normalMatrixAsArray);
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.VIEW_TRANSFORM_EXPORTED,
            function(transform) {
                activeProgram.setUniform("uVMatrix", transform.matrixAsArray);
                activeProgram.setUniform("uVNMatrix", transform.normalMatrixAsArray);
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.PROJECTION_TRANSFORM_EXPORTED,
            function(transform) {
                activeProgram.setUniform("uPMatrix", transform.matrixAsArray);
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.GEOMETRY_UPDATED,
            function(geo) {
                geometry = geo;
                sceneHash = null;
                geometryHash = ([
                    geometry.normalBuf ? "t" : "f",
                    geometry.uvBuf ? "t" : "f",
                    geometry.uvBuf2 ? "t" : "f"]).join("");
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.GEOMETRY_EXPORTED,
            function(geo) {
                if (geo.vertexBuf) {
                    activeProgram.bindFloatArrayBuffer("aVertex", geo.vertexBuf);
                }
                if (geo.normalBuf) {
                    activeProgram.bindFloatArrayBuffer("aNormal", geo.normalBuf);
                }
                if (textureLayers.length > 0) {
                    if (geo.uvBuf) {
                        activeProgram.bindFloatArrayBuffer("aUVCoord", geo.uvBuf);
                    }
                    if (geo.uvBuf2) {
                        activeProgram.bindFloatArrayBuffer("aUVCoord2", geo.uvBuf2);
                    }
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATE, // Request to activate a shader
            function() {
                activateProgram();
            });

    SceneJS._memoryModule.registerEvictor(
            function() {
                var earliest = time;
                var programToEvict;
                for (var hash in programs) {
                    if (hash) {
                        var program = programs[hash];

                        /* Avoiding eviction of shader just used,
                         * currently in use, or likely about to use
                         */
                        if (program.lastUsed < earliest && program.hash != sceneHash) {
                            programToEvict = program;
                            earliest = programToEvict.lastUsed;
                        }
                    }
                }
                if (programToEvict) { // Delete LRU program's shaders and deregister program
                    //  SceneJS._loggingModule.info("Evicting shader: " + hash);
                    programToEvict.destroy();
                    programs[programToEvict.hash] = null;
                    return true;
                }
                return false;   // Couldnt find suitable program to delete
            });

    /**
     * @private
     */
    function activateProgram() {
        if (!canvas) {
            throw SceneJS._errorModule.fatalError(new SceneJS.errors.NoCanvasActiveException("No canvas active"));
        }

        if (!sceneHash) {
            generateHash();
        }

        if (!activeProgram || activeProgram.hash != sceneHash) {
            if (activeProgram) {
                canvas.context.flush();
                activeProgram.unbind();
                activeProgram = null;
                SceneJS._eventModule.fireEvent(SceneJS._eventModule.SHADER_DEACTIVATED);
            }

            if (!programs[sceneHash]) {
                SceneJS._loggingModule.info("Creating shader: '" + sceneHash + "'");
                var vertexShaderSrc = composeVertexShader();
                var fragmentShaderSrc = composeFragmentShader();
                SceneJS._memoryModule.allocate(
                        canvas.context,
                        "shader",
                        function() {
                            try {
                                programs[sceneHash] = new SceneJS._webgl_Program(
                                        sceneHash,
                                        time,
                                        canvas.context,
                                        [vertexShaderSrc],
                                        [fragmentShaderSrc],
                                        SceneJS._loggingModule);
                                //  SceneJS._loggingModule.info("OK - Created shader: '" + sceneHash + "'");
                            } catch (e) {
                                SceneJS._loggingModule.debug("Vertex shader:");
                                SceneJS._loggingModule.debug(getShaderLoggingSource(vertexShaderSrc.split(";")));
                                SceneJS._loggingModule.debug("Fragment shader:");
                                SceneJS._loggingModule.debug(getShaderLoggingSource(fragmentShaderSrc.split(";")));
                                throw SceneJS._errorModule.fatalError(e);
                            }
                        });
            }
            activeProgram = programs[sceneHash];
            activeProgram.lastUsed = time;
            activeProgram.bind();
            SceneJS._eventModule.fireEvent(SceneJS._eventModule.SHADER_ACTIVATED);
        }

        SceneJS._eventModule.fireEvent(SceneJS._eventModule.SHADER_RENDERING);
    }

    /**
     * Generates a shader hash code from current rendering state.
     * @private
     */
    function generateHash() {
        if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
            sceneHash = ([canvas.canvasId, "picking"]).join(";");
        } else {
            sceneHash = ([canvas.canvasId, rendererHash, fogHash, lightsHash, textureHash, geometryHash]).join(";");
        }
    }

    /**
     * @private
     */
    function getShaderLoggingSource(src) {
        //        var src2 = [];
        //        for (var i = 0; i < src.length; i++) {
        //            var padding = (i < 10) ? "&nbsp;&nbsp;&nbsp;" : ((i < 100) ? "&nbsp;&nbsp;" : (i < 1000 ? "&nbsp;" : ""));
        //            src2.push(i + padding + ": " + src[i]);
        //        }
        //       // return src2.join("<br/>");
        return src.join("");
    }

    /**
     * @private
     */
    function composeVertexShader() {
        return SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_RENDER ?
               composeRenderingVertexShader() : composePickingVertexShader();
    }

    /**
     * @private
     */
    function composeFragmentShader() {
        return SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_RENDER ?
               composeRenderingFragmentShader() : composePickingFragmentShader();
    }

    /**
     * Composes a vertex shader script for rendering mode in current scene state
     * @private
     */
    function composePickingVertexShader() {
        var src = [
            "attribute vec3 aVertex;",
            "uniform mat4 uMMatrix;",
            "uniform mat4 uVMatrix;",
            "uniform mat4 uPMatrix;",
            "void main(void) {",
            "  gl_Position = uPMatrix * (uVMatrix * (uMMatrix * vec4(aVertex, 1.0)));",
            "}"
        ];
        if (debugCfg.logScripts == true) {
            SceneJS._loggingModule.info(src);
        }
        return src.join("\n");
    }

    /**
     * Composes a fragment shader script for rendering mode in current scene state
     * @private
     */
    function composePickingFragmentShader() {
        //        var g = parseFloat(Math.round((10 + 1) / 256) / 256);  // TODO: use exported pick color
        //        var r = parseFloat((10 - g * 256 + 1) / 256);
        var src = [
            "#ifdef GL_ES",
            "   precision highp float;",
            "#endif",

            "uniform vec3 uPickColor;",
            "void main(void) {",,
            "    gl_FragColor = vec4(uPickColor.rgb, 1.0);  ",
            "}"
        ];
        if (debugCfg.logScripts == true) {
            SceneJS._loggingModule.info(src);
        }
        return src.join("\n");
    }


    /**
     * @private
     */
    function composeRenderingVertexShader() {

        var texturing = textureLayers.length > 0 && (geometry.uvBuf || geometry.uvBuf2);
        var lighting = (lights.length > 0 && geometry.normalBuf);

        var src = ["\n"];
        src.push("attribute vec3 aVertex;");                // World coordinates

        if (lighting) {
            src.push("attribute vec3 aNormal;");            // Normal vectors
            src.push("uniform mat4 uMNMatrix;");            // Model normal matrix
            src.push("uniform mat4 uVNMatrix;");            // View normal matrix

            src.push("varying vec3 vNormal;");              // Output view normal vector
            src.push("varying vec3 vEyeVec;");              // Output view eye vector

            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                if (light._type == "dir") {
                    src.push("uniform vec3 uLightDir" + i + ";");
                }
                if (light._type == "point") {
                    src.push("uniform vec4 uLightPos" + i + ";");
                }
                if (light._type == "spot") {
                    src.push("uniform vec4 uLightPos" + i + ";");
                }

                src.push("varying vec3 vLightVec" + i + ";");
                src.push("varying float vLightDist" + i + ";");
            }
        }

        if (texturing) {
            if (geometry.uvBuf) {
                src.push("attribute vec2 aUVCoord;");      // UV coords
            }
            if (geometry.uvBuf2) {
                src.push("attribute vec2 aUVCoord2;");     // UV2 coords
            }
        }
        src.push("uniform mat4 uMMatrix;");                // Model matrix
        src.push("uniform mat4 uVMatrix;");                // View matrix
        src.push("uniform mat4 uPMatrix;");                 // Projection matrix

        src.push("varying vec4 vViewVertex;");

        if (texturing) {
            if (geometry.uvBuf) {
                src.push("varying vec2 vUVCoord;");
            }
            if (geometry.uvBuf2) {
                src.push("varying vec2 vUVCoord2;");
            }
        }

        src.push("void main(void) {");
        if (lighting) {
            src.push("  vec4 tmpVNormal = uVNMatrix * (uMNMatrix * vec4(aNormal, 1.0)); ");
            src.push("  vNormal = normalize(tmpVNormal.xyz);");
        }
        src.push("  vec4 tmpVertex = uVMatrix * (uMMatrix * vec4(aVertex, 1.0)); ");
        src.push("  vViewVertex = tmpVertex;");
        src.push("  gl_Position = uPMatrix * vViewVertex;");

        src.push("  vec3 tmpVec;");

        if (lighting) {
            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                if (light._type == "dir") {
                    src.push("tmpVec = -uLightDir" + i + ";");
                }
                if (light._type == "point") {
                    src.push("tmpVec = -(uLightPos" + i + ".xyz - tmpVertex.xyz);");
                    src.push("vLightDist" + i + " = length(tmpVec);");          // Distance from light to vertex
                }
                if (light._type == "spot") {
                    src.push("tmpVec = -(uLightPos" + i + ".xyz - tmpVertex.xyz);");
                    src.push("vLightDist" + i + " = length(tmpVec);");          // Distance from light to vertex

                }
                src.push("vLightVec" + i + " = tmpVec;");                   // Vector from light to vertex

            }
            src.push("vEyeVec = normalize(-vViewVertex.xyz);");
        }

        if (texturing) {
            if (geometry.uvBuf) {
                src.push("vUVCoord = aUVCoord;");
            }
            if (geometry.uvBuf2) {
                src.push("vUVCoord2 = aUVCoord2;");
            }
        }
        src.push("}");
        if (debugCfg.logScripts == true) {
            SceneJS._loggingModule.info(src);
        }
        return src.join("\n");
    }

    /**
     * @private
     */
    function composeRenderingFragmentShader() {
        var texturing = textureLayers.length > 0 && (geometry.uvBuf || geometry.uvBuf2);
        var lighting = (lights.length > 0 && geometry.normalBuf);

        var src = ["\n"];
                
        src.push("#ifdef GL_ES");
        src.push("   precision highp float;");
        src.push("#endif");

        src.push("varying vec4 vViewVertex;");              // View-space vertex

        if (texturing) {
            if (geometry.uvBuf) {
                src.push("varying vec2 vUVCoord;");
            }
            if (geometry.uvBuf2) {
                src.push("varying vec2 vUVCoord2;");
            }

            for (var i = 0; i < textureLayers.length; i++) {
                var layer = textureLayers[i];
                src.push("uniform sampler2D uSampler" + i + ";");
                if (layer.params.matrix) {
                    src.push("uniform mat4 uLayer" + i + "Matrix;");
                }
            }
        }

        src.push("uniform vec3  uMaterialBaseColor;");
        src.push("uniform float uMaterialAlpha;");

        if (lighting) {
            src.push("varying vec3 vNormal;");                  // View-space normal
            src.push("varying vec3 vEyeVec;");                  // Direction of view-space vertex from eye

            src.push("uniform vec3  uAmbient;");                         // Scene ambient colour - taken from clear colour
            src.push("uniform float uMaterialEmit;");

            src.push("uniform vec3  uMaterialSpecularColor;");
            src.push("uniform float uMaterialSpecular;");
            src.push("uniform float uMaterialShine;");

            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                src.push("uniform vec3  uLightColor" + i + ";");
                if (light._type == "point") {
                    src.push("uniform vec4   uLightPos" + i + ";");
                }
                if (light._type == "dir") {
                    src.push("uniform vec3   uLightDir" + i + ";");
                }
                if (light._type == "spot") {
                    src.push("uniform vec4   uLightPos" + i + ";");
                    src.push("uniform vec3   uLightDir" + i + ";");
                    src.push("uniform float  uLightSpotCosCutOff" + i + ";");
                    src.push("uniform float  uLightSpotExp" + i + ";");
                }
                src.push("uniform vec3  uLightAttenuation" + i + ";");
                src.push("varying vec3  vLightVec" + i + ";");         // Vector from light to vertex
                src.push("varying float vLightDist" + i + ";");        // Distance from light to vertex
            }
        }

        /* Fog uniforms
         */
        if (fog && fog.mode != "disabled") {
            src.push("uniform vec3  uFogColor;");
            src.push("uniform float uFogDensity;");
            src.push("uniform float uFogStart;");
            src.push("uniform float uFogEnd;");
        }

        src.push("void main(void) {");
        src.push("  vec3    color   = uMaterialBaseColor;");
        src.push("  float   alpha   = uMaterialAlpha;");

        if (lighting) {
            src.push("  vec3    ambientValue=uAmbient;");
            src.push("  float   emit    = uMaterialEmit;");

            src.push("  vec4    normalmap = vec4(vNormal,0.0);");
            src.push("  float   specular=uMaterialSpecular;");
            src.push("  vec3    specularColor=uMaterialSpecularColor;");
            src.push("  float   shine=uMaterialShine;");
            src.push("  float   attenuation = 1.0;");
        }

        if (texturing) {
            src.push("  vec4    texturePos;");
            src.push("  vec2    textureCoord=vec2(0.0,0.0);");

            for (var i = 0; i < textureLayers.length; i++) {
                var layer = textureLayers[i];

                /* Texture input
                 */
                if (layer.params.applyFrom == "normal" && lighting) {
                    if (geometry.normalBuf) {
                        src.push("texturePos=vec4(vNormal.xyz, 1.0);");
                    } else {
                        SceneJS._loggingModule.warn("Texture layer applyFrom='normal' but geometry has no normal vectors");
                        continue;
                    }
                }
                if (layer.params.applyFrom == "uv") {
                    if (geometry.uvBuf) {
                        src.push("texturePos = vec4(vUVCoord.s, vUVCoord.t, 1.0, 1.0);");
                    } else {
                        SceneJS._loggingModule.warn("Texture layer applyTo='uv' but geometry has no UV coordinates");
                        continue;
                    }
                }
                if (layer.params.applyFrom == "uv2") {
                    if (geometry.uvBuf2) {
                        src.push("texturePos = vec4(vUVCoord2.s, vUVCoord2.t, 1.0, 1.0);");
                    } else {
                        SceneJS._loggingModule.warn("Texture layer applyTo='uv2' but geometry has no UV2 coordinates");
                        continue;
                    }
                }

                /* Texture matrix
                 */
                if (layer.params.matrixAsArray) {
                    src.push("textureCoord=(uLayer" + i + "Matrix * texturePos).xy;");
                } else {
                    src.push("textureCoord=texturePos.xy;");
                }

                /* Texture output
                 */
                if (layer.params.applyTo == "baseColor") {
                    if (layer.params.blendMode == "multiply") {
                        src.push("color  = color * texture2D(uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).rgb;");
                    } else {
                        src.push("color  = color + texture2D(uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).rgb;");
                    }
                }
            }
        }

        if (lighting) {
            src.push("  vec3    lightValue      = uAmbient;");
            src.push("  vec3    specularValue   = vec3(0.0, 0.0, 0.0);");

            src.push("  vec3    lightVec;");
            src.push("  float   dotN;");
            src.push("  float   spotFactor;");
            src.push("  float   pf;");

            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                src.push("lightVec = normalize(vLightVec" + i + ");");

                /* Point Light
                 */
                if (light._type == "point") {
                    src.push("dotN = max(dot(vNormal,lightVec),0.0);");
                    src.push("if (dotN > 0.0) {");
                    src.push("  attenuation = 1.0 / (" +
                             "  uLightAttenuation" + i + "[0] + " +
                             "  uLightAttenuation" + i + "[1] * vLightDist" + i + " + " +
                             "  uLightAttenuation" + i + "[2] * vLightDist" + i + " * vLightDist" + i + ");");
                    if (light._diffuse) {
                        src.push("  lightValue += dotN *  uLightColor" + i + " * attenuation;");
                    }
                    if (light._specular) {
                        src.push("specularValue += attenuation * specularColor * uLightColor" + i +
                                 " * specular  * pow(max(dot(reflect(lightVec, vNormal), vEyeVec),0.0), shine);");
                    }
                    src.push("}");
                }

                /* Directional Light
                 */
                if (light._type == "dir") {
                    src.push("dotN = max(dot(vNormal,lightVec),0.0);");
                    if (light._diffuse) {
                        src.push("lightValue += dotN * uLightColor" + i + ";");
                    }
                    if (light._specular) {
                        src.push("specularValue += specularColor * uLightColor" + i +
                                 " * specular  * pow(max(dot(reflect(lightVec, vNormal),normalize(vEyeVec)),0.0), shine);");
                    }
                }

                /* Spot light
                 */
                if (light._type == "spot") {
                    src.push("spotFactor = max(dot(normalize(uLightDir" + i + "), lightVec));");
                    src.push("if ( spotFactor > 20) {");
                    src.push("  spotFactor = pow(spotFactor, uLightSpotExp" + i + ");");
                    src.push("  dotN = max(dot(vNormal,normalize(lightVec)),0.0);");
                    src.push("      if(dotN>0.0){");

                    //                            src.push("          attenuation = spotFactor / (" +
                    //                                     "uLightAttenuation" + i + "[0] + " +
                    //                                     "uLightAttenuation" + i + "[1] * vLightDist" + i + " + " +
                    //                                     "uLightAttenuation" + i + "[2] * vLightDist" + i + " * vLightDist" + i + ");");
                    src.push("          attenuation = 1;");

                    if (light._diffuse) {
                        src.push("lightValue +=  dotN * uLightColor" + i + " * attenuation;");
                    }
                    if (light._specular) {
                        src.push("specularValue += attenuation * specularColor * uLightColor" + i +
                                 " * specular  * pow(max(dot(reflect(normalize(lightVec), vNormal),normalize(vEyeVec)),0.0), shine);");
                    }

                    src.push("      }");
                    src.push("}");
                }
            }
            src.push("if (emit>0.0) lightValue = vec3(1.0, 1.0, 1.0);");
            src.push("vec4 fragColor = vec4(specularValue.rgb + color.rgb * (emit+1.0) * lightValue.rgb, alpha);");
        } else {

            /* No lighting
             */
            src.push("vec4 fragColor = vec4(color.rgb, alpha);");
        }

        /* Fog
         */
        if (fog && fog.mode != "disabled") {
            src.push("float fogFact=1.0;");
            if (fog.mode == "exp") {
                src.push("fogFact=clamp(pow(max((uFogEnd - length(-vViewVertex.xyz)) / (uFogEnd - uFogStart), 0.0), 2.0), 0.0, 1.0);");
            } else if (fog.mode == "linear") {
                src.push("fogFact=clamp((uFogEnd - length(-vViewVertex.xyz)) / (uFogEnd - uFogStart), 0.0, 1.0);");
            }
            src.push("gl_FragColor = fragColor * fogFact + vec4(uFogColor, 1) * (1.0 - fogFact);");
        } else {
            src.push("gl_FragColor = fragColor;");
        }
        if (debugCfg.whitewash == true) {
            src.push("gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);");
        }
        src.push("}");
        if (debugCfg.logScripts == true) {
            SceneJS._loggingModule.info(src);
        }
        return src.join("\n");
    }
})();
/**
 * Manages a stack of WebGL state frames that may be pushed and popped by SceneJS.renderer nodes.
 *  @private
 */
SceneJS._rendererModule = new (function() {

    var canvas;  // Currently active canvas
    var stateStack;     // Stack of WebGL state frames
    var currentProps;   // Current map of set WebGL modes and states
    var loaded;         // True when current state exported

    /**
     * Maps renderer node properties to WebGL context enums
     * @private
     */
    var glEnum = function(context, name) {
        if (!name) {
            throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException(
                    "Null SceneJS.renderer node config: \"" + name + "\""));
        }
        var result = SceneJS._webgl_enumMap[name];
        if (!result) {
            throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException(
                    "Unrecognised SceneJS.renderer node config value: \"" + name + "\""));
        }
        var value = context[result];
        if (!value) {
            throw SceneJS._errorModule.fatalError(new SceneJS.errors.WebGLUnsupportedNodeConfigException(
                    "This browser's WebGL does not support renderer node config value: \"" + name + "\""));
        }
        return value;
    };


    /**
     * Order-insensitive functions that set WebGL modes ie. not actually causing an
     * immediate change.
     *
     * These map to renderer properties and are called in whatever order their
     * property is found on the renderer config.
     *
     * Each of these wrap a state-setter function on the WebGL context. Each function
     * also uses the glEnum map to convert its renderer node property argument to the
     * WebGL enum constant required by its wrapped function.
     *
     * @private
     */
    var glModeSetters = {

        enableBlend: function(context, flag) {
            if (flag == null || flag == undefined) {
                flag = false;
            }
            context.enable(context.BLEND, flag);
            currentProps.enableBlend = flag;
        },

        blendColor: function(context, color) {
            color = color || {};
            color = {
                r: color.r || 0,
                g: color.g || 0,
                b: color.b || 0,
                a: (color.a == undefined || color.a == null) ? 1 : color.a
            };
            context.blendColor(color.r, color.g, color.b, color.a);
            currentProps.blendColor = color;
        },

        blendEquation: function(context, eqn) {
            eqn = eqn || "funcAdd";
            context.blendEquation(context, glEnum(context, eqn));
            currentProps.blendEquation = eqn;
        },

        /** Sets the RGB blend equation and the alpha blend equation separately
         */
        blendEquationSeparate: function(context, eqn) {
            eqn = eqn || {};
            eqn = {
                rgb : eqn.rgb || "funcAdd",
                alpha : eqn.alpha || "funcAdd"
            };
            context.blendEquation(glEnum(context, eqn.rgb), glEnum(context, eqn.alpha));
            currentProps.blendEquationSeperate = eqn;
        },

        blendFunc: function(context, funcs) {
            blendFunc = blendFunc || {};
            funcs = {
                sfactor : funcs.sfactor || "one",
                dfactor : funcs.dfactor || "zero"
            };
            context.blendFunc(glEnum(context, funcs.sfactor || "one"), glEnum(context, funcs.dfactor || "zero"));
            currentProps.blendFunc = funcs;
        },

        blendFuncSeparate: function(context, func) {
            func = func || {};
            func = {
                srcRGB : func.srcRGB || "zero",
                dstRGB : func.dstRGB || "zero",
                srcAlpha : func.srcAlpha || "zero",
                dstAlpha :  func.dstAlpha || "zero"
            };
            context.blendFuncSeparate(
                    glEnum(context, func.srcRGB || "zero"),
                    glEnum(context, func.dstRGB || "zero"),
                    glEnum(context, func.srcAlpha || "zero"),
                    glEnum(context, func.dstAlpha || "zero"));
            currentProps.blendFuncSeparate = func;
        },

        clearColor: function(context, color) {
            color = color || {};
            color.r = color.r || 0;
            color.g = color.g || 0;
            color.b = color.b || 0;
            color.a = (color.a == undefined || color.a == null) ? 1 : color.a;
            context.clearColor(color.r, color.g, color.b, color.a);
            currentProps.clearColor = color;
        },

        clearDepth: function(context, depth) {
            if (depth == null || depth == undefined) {
                depth = 1;
            }
            context.clearDepth(depth);
            currentProps.clearDepth = depth;
        },

        clearStencil: function(context, clearValue) {
            clearValue = clearValue || 0;
            context.clearStencil(clearValue);
            currentProps.clearStencil = clearValue;
        },

        colorMask: function(context, color) {
            color = color || {};
            color.r = color.r || 0;
            color.g = color.g || 0;
            color.b = color.b || 0;
            color.a = (color.a == undefined || color.a == null) ? 1 : color.a;
            context.colorMask(color.r, color.g, color.b, color.a);
            currentProps.colorMask = color;
        },

        enableCullFace: function(context, flag) {
            if (flag) {
                context.enable(context.CULL_FACE);
            } else {
                flag = false;
                context.disable(context.CULL_FACE);
            }
            currentProps.enableCullFace = flag;
        },

        cullFace: function(context, mode) {
            mode = mode || "back";
            context.cullFace(glEnum(context, mode));
            currentProps.cullFace = mode;
        },

        enableDepthTest: function(context, flag) {
            if (flag == null || flag == undefined) {
                flag = true;
            }
            if (flag) {
                context.enable(context.DEPTH_TEST);
            } else {
                context.disable(context.DEPTH_TEST);
            }
            currentProps.enableDepthTest = flag;
        },

        depthFunc: function(context, func) {
            func = func || "less";
            context.depthFunc(glEnum(context, func));
            currentProps.depthFunc = func;
        },

        enableDepthMask: function(context, flag) {
            if (flag == null || flag == undefined) {
                flag = true;
            }
            context.depthMask(flag);
            currentProps.enableDepthMask = flag;
        },

        depthRange: function(context, range) {
            range = range || {};
            range = {
                zNear : range.zNear || 0,
                zFar : range.zFar || 1
            };
            context.depthRange(range.zNear, range.zFar);
            currentProps.depthRange = range;
        },

        frontFace: function(context, mode) {
            mode = mode || "ccw";
            context.frontFace(glEnum(context, mode));
            currentProps.frontFace = mode;
        },

        lineWidth: function(context, width) {
            width = width || 1;
            context.lineWidth(width);
            currentProps.lineWidth = width;
        },

        enableScissorTest: function(context, flag) {
            if (flag) {
                context.enable(context.SCISSOR_TEST);
            } else {
                flag = false;
                context.disable(context.SCISSOR_TEST);
            }
            currentProps.enableScissorTest = flag;
        }
    };

    /**
     * Order-sensitive functions that immediately effect WebGL state change.
     *
     * These map to renderer properties and are called in a particular order since they
     * affect one another.
     *
     * Each of these wrap a state-setter function on the WebGL context. Each function
     * also uses the glEnum map to convert its renderer node property argument to the
     * WebGL enum constant required by its wrapped function.
     *
     * @private
     */
    var glStateSetters = {

        /** Set viewport on the given context
         */
        viewport: function(context, v) {
            v = v || {};
            v = {
                x : v.x || 1,
                y : v.y || 1,
                width: v.width || canvas.width,
                height: v.height || canvas.height
            };
            currentProps.viewport = v;
            context.viewport(v.x, v.y, v.width, v.height);
            SceneJS._eventModule.fireEvent(SceneJS._eventModule.VIEWPORT_UPDATED, v);
        },

        /** Sets scissor region on the given context
         */
        scissor: function(context, s) {
            s = s || {};
            s = {
                x : s.x || currentProps.viewport.x,
                y : s.y || currentProps.viewport.y,
                width: s.width || currentProps.viewport.width,
                height: s.height || currentProps.viewport.height
            };
            currentProps.scissor = s;
            context.scissor(s.x, s.y, s.width, s.height);
        },

        /** Clears buffers on the given context as specified in mask
         */
        clear:function(context, mask) {
            mask = mask || {};
            var m;
            if (mask.color) {
                m = context.COLOR_BUFFER_BIT;
            }
            if (mask.depth) {
                m = m | context.DEPTH_BUFFER_BIT;
            }
            if (mask.stencil) {
                m = m | context.STENCIL_BUFFER_BIT;
            }
            if (m) {
                context.clear(m);
            }
        }
    };

    /**
     * Sets current renderer properties.
     * @private
     */
    var setProperties = function(context, props) {

        /* Set order-insensitive properties (modes)
         */
        for (var key in props) {
            var setter = glModeSetters[key];
            if (setter) {
                setter(context, props[key]);
            }
        }

        /* Set order-sensitive properties (states)
         */
        if (props.viewport) {
            glStateSetters.viewport(context, props.viewport);
        }
        if (props.scissor) {
            glStateSetters.clear(context, props.scissor);
        }
        if (props.clear) {
            glStateSetters.clear(context, props.clear);
        }

        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.RENDERER_UPDATED,
                currentProps);

        loaded = false;
    };

    /**
     * Restores previous renderer properties, except for clear - that's the reason we
     * have a seperate set and restore semantic - we don't want to keep clearing the buffers
     * @private
     */
    var undoProperties = function(context, props) {

        /* Set order-insensitive properties (modes)
         */
        for (var key in props) {
            var setter = glModeSetters[key];
            if (setter) {
                setter(context, props[key]);
            }
        }

        /* Set order-sensitive properties (states)
         */
        if (props.viewport) {
            glStateSetters.viewport(context, props.viewport);
        }
        if (props.scissor) {
            glStateSetters.clear(context, props.scissor);
        }

        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.RENDERER_UPDATED,
                currentProps);

        loaded = false;
    };


    /** Gets value of the given property on the first higher renderer state that has it
     * @private
     */
    var getSuperProperty = function(name) {
        for (var i = stateStack.length - 1; i >= 0; i--) {
            var state = stateStack[i];
            if (!(state.props[name] == undefined)) {
                return state.props[name];
            }
        }
        return null; // Cause default to be set
    };

    /* Activate initial defaults
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.CANVAS_ACTIVATED,
            function(c) {
                canvas = c;
                currentProps = {
                    clear: { depth : true, color : true},
                    //  clearColor: {r: 0, g : 0, b : 0 },
                    clearDepth: 1.0,
                    enableDepthTest:true,
                    enableCullFace: false,
                    depthRange: { zNear: 0, zFar: 1},
                    enableScissorTest: false,
                    viewport:{ x : 1, y : 1, width: c.canvas.width, height: canvas.canvas.height}
                };
                stateStack = [
                    {
                        props: currentProps,
                        restore : null          // WebGL properties to set for reverting to previous state
                    }
                ];
                loaded = false;

                setProperties(canvas.context, currentProps);

                SceneJS._eventModule.fireEvent(
                        SceneJS._eventModule.RENDERER_UPDATED,
                        currentProps);
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                loaded = false;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                loaded = false;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (!loaded) {
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.RENDERER_EXPORTED,
                            currentProps);
                    loaded = true;
                }
            });

    /**
     * Returns a new WebGL state object to the caller, without making it active.
     * @private
     */
    this.createRendererState = function(props) {

        /* For each property supplied, find the previous value to restore it to
         */
        var restore = {};
        for (var name in props) {
            if (!(props[name] == undefined)) {
                restore[name] = getSuperProperty(name);
            }
        }

        var state = {
            props : props,
            restore : restore
        };
        return state;
    };

    /** Activates the given WebGL state. If no state is active, then it must specify a canvas to activate,
     * in which case the default simple shader will be activated as well
     * @private
     */
    this.setRendererState = function(state) {
        stateStack.push(state);
        setProperties(canvas.context, state.props);
    };

    /**
     * Restores previous WebGL state, if any. We do a seperate restore operation because some "properties",
     * like clear, are actually operations that we don't want to undo, so we don't redo those in a restore.
     * @private
     */
    this.undoRendererState = function(state) {
        stateStack.pop();
        undoProperties(canvas.context, state.restore); // Undo property settings
    };

})();



/** @class A scene node that sets WebGL state for nodes in its subtree.
 * <p>This node basically exposes various WebGL state configurations through the SceneJS API.</p>
 * (TODO: more comments here!)
 
 * @extends SceneJS.Node
 */
SceneJS.Renderer = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "renderer";
};

SceneJS._inherit(SceneJS.Renderer, SceneJS.Node);

// @private
SceneJS.Renderer.prototype._render = function(traversalContext, data) {
    if (this._memoLevel == 0) {  // One-shot dynamic config               
        this._rendererState = SceneJS._rendererModule.createRendererState(this._getParams(data));
        if (this._fixedParams) {
            this._memoLevel = 1;
        }
    }
    SceneJS._rendererModule.setRendererState(this._rendererState);
    this._renderNodes(traversalContext, data);
    SceneJS._rendererModule.undoRendererState(this._rendererState);
};

/** Factory function that returns a new {@link SceneJS.Renderer} instance
 * @param {Arguments} args Variable arguments that are passed to the SceneJS.Renderer constructor
 * @returns {SceneJS.Renderer}
 */
SceneJS.renderer = function() {
    var n = new SceneJS.Renderer();
    SceneJS.Renderer.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Services geometry node requests to store and render elements of geometry.
 *
 * Stores geometry in vertex buffers in video RAM, caching them there under a least-recently-used eviction policy
 * mediated by the "memory" backend.
 *
 * Geometry elements are identified by type IDs, which may either be supplied by scene nodes, or automatically
 * generated by this backend.
 *
 * After creating geometry, the backend returns to the node the type ID for the node to retain. The node
 * can then pass in the type ID to test if the geometry still exists (perhaps it has been evicted) or to have the
 * backend render the geometry.
 *
 * The backend is free to evict whatever geometry it chooses between scene traversals, so the node must always check
 * the existence of the geometry and possibly request its re-creation each time before requesting the backend render it.
 *
 * A geometry buffer consists of positions, normals, optional texture coordinates, indices and a primitive type
 * (eg. "triangles").
 *
 * When rendering a geometry element, the backend will first fire a GEOMETRY_UPDATED to give the shader backend a
 * chance to prepare a shader script to render the geometry for current scene state. Then it will fire a SHADER_ACTIVATE
 * to prompt the shader backend to fire a SHADER_ACTIVATED to marshal resources from various backends (including this one)
 * for its shader script variables, which then provide their resources to the shader through XXX_EXPORTED events.
 * This backend then likewise provides its geometry buffers to the shader backend through a GEOMETRY_EXPORTED event,
 * then bind and draw the index buffer.
 *
 * The backend avoids needlessly re-exporting and re-binding geometry (eg. when rendering a bunch of cubes in a row)
 * by tracking the type of the last geometry rendered. That type is maintained until another either geoemetry is rendered,
 * the canvas switches, shader deactivates or scene deactivates.
 *
 *  @private

 */
SceneJS._geometryModule = new (function() {

    var time = (new Date()).getTime();  // For LRU caching
    var canvas;
    var geoMaps = {};                   // Geometry map for each canvas
    var currentGeoMap = null;
    var currentBoundGeoType;            // Type of geometry currently bound to shader

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.TIME_UPDATED,
            function(t) {
                time = t;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                canvas = null;
                currentGeoMap = null;
                currentBoundGeoType = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.CANVAS_ACTIVATED,
            function(c) {
                if (!geoMaps[c.canvasId]) {      // Lazy-create geometry map for canvas
                    geoMaps[c.canvasId] = {};
                }
                canvas = c;
                currentGeoMap = geoMaps[c.canvasId];
                currentBoundGeoType = null;
            }); 

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.CANVAS_DEACTIVATED,
            function() {
                canvas = null;
                currentGeoMap = null;
                currentBoundGeoType = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                currentBoundGeoType = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                currentBoundGeoType = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RESET,
            function() {
                for (var canvasId in geoMaps) {    // Destroy geometries on all canvases
                    var geoMap = geoMaps[canvasId];
                    for (var type in geoMap) {
                        var geometry = geoMap[type];
                        destroyGeometry(geometry);
                    }
                }
                canvas = null;
                geoMaps = {};
                currentGeoMap = null;
                currentBoundGeoType = null;
            });

    /**
     * Destroys geometry, returning true if memory freed, else false
     * where canvas not found and geometry was implicitly destroyed
     * @private
     */
    function destroyGeometry(geo) {
        //  SceneJS._loggingModule.debug("Destroying geometry : '" + geo.type + "'");
        if (geo.type == currentBoundGeoType) {
            currentBoundGeoType = null;
        }
        if (document.getElementById(geo.canvas.canvasId)) { // Context won't exist if canvas has disappeared
            if (geo.vertexBuf) {
                geo.vertexBuf.destroy();
            }
            if (geo.normalBuf) {
                geo.normalBuf.destroy();
            }
            if (geo.normalBuf) {
                geo.indexBuf.destroy();
            }
            if (geo.uvBuf) {
                geo.uvBuf.destroy();
            }
            if (geo.uvBuf2) {
                geo.uvBuf2.destroy();
            }
        }
        var geoMap = geoMaps[geo.canvas.canvasId];
        if (geoMap) {
            geoMap[geo.type] = null;
        }
    }

    /**
     * Volunteer to attempt to destroy a geometry when asked to by memory module
     *
     */
    SceneJS._memoryModule.registerEvictor(
            function() {
                var earliest = time;
                var evictee;
                for (var canvasId in geoMaps) {
                    var geoMap = geoMaps[canvasId];
                    if (geoMap) {
                        for (var type in geoMap) {
                            var geometry = geoMap[type];
                            if (geometry) {
                                if (geometry.lastUsed < earliest
                                        && document.getElementById(geometry.canvas.canvasId)) { // Canvas must still exist
                                    evictee = geometry;
                                    earliest = geometry.lastUsed;
                                }
                            }
                        }
                    }
                }
                if (evictee) {
                    SceneJS._loggingModule.warn("Evicting geometry from memory: " + evictee.type);
                    destroyGeometry(evictee);
                    return true;
                }
                return false;  // Couldnt find a geometry we can delete
            });

    /**
     * Creates an array buffer
     *
     * @private
     * @param context WebGL context
     * @param bufType Eg. ARRAY_BUFFER
     * @param values WebGL array
     * @param numItems
     * @param itemSize
     * @param usage Eg. STATIC_DRAW
     */
    function createArrayBuffer(description, context, bufType, values, numItems, itemSize, usage) {
        var buf;
        SceneJS._memoryModule.allocate(
                context,
                description,
                function() {
                    buf = new SceneJS._webgl_ArrayBuffer(context, bufType, values, numItems, itemSize, usage);
                });
        return buf;
    }

    /**
     * Converts SceneJS primitive type string to WebGL constant
     * @private
     */
    function getPrimitiveType(context, primitive) {
        switch (primitive) {
            case "points":
                return context.POINTS;
            case "lines":
                return context.LINES;
            case "line-loop":
                return context.LINE_LOOP;
            case "line-strip":
                return context.LINE_STRIP;
            case "triangles":
                return context.TRIANGLES;
            case "triangle-strip":
                return context.TRIANGLE_STRIP;
            case "triangle-fan":
                return context.TRIANGLE_FAN;
            default:
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException(// Logs and throws
                        "SceneJS.geometry primitive unsupported: '" +
                        primitive +
                        "' - supported types are: 'points', 'lines', 'line-loop', " +
                        "'line-strip', 'triangles', 'triangle-strip' and 'triangle-fan'"));
        }
    }


    /**
     * Tests if the given geometry type exists on the currently active canvas
     * @private
     */
    this.testGeometryExists = function(type) {
        return currentGeoMap[type] ? true : false;
    };

    /**
     * Creates geometry on the active canvas - can optionally take a type ID. On success, when ID given
     * will return that ID, else if no ID given, will return a generated one.
     * @private
     */
    this.createGeometry = function(type, data) {
        if (!type) {
            type = SceneJS._createKeyForMap(currentGeoMap, "t");
        }

        //   SceneJS._loggingModule.debug("Creating geometry: '" + type + "'");

        if (!data.primitive) { // "points", "lines", "line-loop", "line-strip", "triangles", "triangle-strip" or "triangle-fan"
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.NodeConfigExpectedException(
                            "SceneJS.geometry node property expected : primitive"));
        }
        var context = canvas.context;
        var usage = context.STATIC_DRAW;
        //var usage = (!data.fixed) ? context.STREAM_DRAW : context.STATIC_DRAW;

        var vertexBuf;
        var normalBuf;
        var uvBuf;
        var uvBuf2;
        var indexBuf;

        try { // TODO: Modify usage flags in accordance with how often geometry is evicted

            vertexBuf = createArrayBuffer("geometry vertex buffer", context, context.ARRAY_BUFFER,
                    new WebGLFloatArray(data.positions), data.positions.length, 3, usage);

            if (data.normals && data.normals.length > 0) {
                normalBuf = createArrayBuffer("geometry normal buffer", context, context.ARRAY_BUFFER,
                        new WebGLFloatArray(data.normals), data.normals.length, 3, usage);
            }

            if (data.uv && data.uv.length > 0) {
                if (data.uv) {
                    uvBuf = createArrayBuffer("geometry UV buffer", context, context.ARRAY_BUFFER,
                            new WebGLFloatArray(data.uv), data.uv.length, 2, usage);
                }
            }

            if (data.uv2 && data.uv2.length > 0) {
                if (data.uv2) {
                    uvBuf2 = createArrayBuffer("geometry UV2 buffer", context, context.ARRAY_BUFFER,
                            new WebGLFloatArray(data.uv2), data.uv2.length, 2, usage);
                }
            }

            indexBuf = createArrayBuffer("geometry index buffer", context, context.ELEMENT_ARRAY_BUFFER,
                    new WebGLUnsignedShortArray(data.indices), data.indices.length, 3, usage);

            var geo = {
                fixed : true, // TODO: support dynamic geometry
                primitive: getPrimitiveType(context, data.primitive),
                type: type,
                lastUsed: time,
                canvas : canvas,
                context : context,
                vertexBuf : vertexBuf,
                normalBuf : normalBuf,
                indexBuf : indexBuf,
                uvBuf: uvBuf,
                uvBuf2: uvBuf2
            };
            currentGeoMap[type] = geo;
            return type;
        } catch (e) { // Allocation failure - delete whatever buffers got allocated

            if (vertexBuf) {
                vertexBuf.destroy();
            }
            if (normalBuf) {
                normalBuf.destroy();
            }
            if (uvBuf) {
                uvBuf.destroy();
            }
            if (uvBuf2) {
                uvBuf2.destroy();
            }
            if (indexBuf) {
                indexBuf.destroy();
            }
            throw e;
        }
    };

    /**
     * Draws the geometry of the given ID that exists on the current canvas.
     * Client node must ensure prior that the geometry exists on the canvas
     * using findGeometry, and have created it if neccessary with createGeometry.
     * @private
     */
    this.drawGeometry = function(type) {
        if (!canvas) {
            throw SceneJS._errorModule.fatalError(SceneJS.errors.NoCanvasActiveException("No canvas active"));
        }       
        var geo = currentGeoMap[type];

        SceneJS._eventModule.fireEvent(SceneJS._eventModule.GEOMETRY_UPDATED, geo);  // Gives shader backend a chance to generate a shader

        /* Prompt shader backend to in turn prompt for exports from all backends.
         * This backend exports proactively however (see below), since it is the one
         * which prompted the shader backend.
         */
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.SHADER_ACTIVATE);

        geo.lastUsed = time;  // Geometry now not evictable in this scene traversal

        var context = canvas.context;

        /* Dont re-export and bind if already the last one exported and bound - this is the case when
         * we're drawing a batch of the same object, Eg. a bunch of cubes in a row
         */
      //  if (currentBoundGeoType != type) {
            for (var i = 0; i < 8; i++) {
                context.disableVertexAttribArray(i);
            }
            SceneJS._eventModule.fireEvent(
                    SceneJS._eventModule.GEOMETRY_EXPORTED,
                    geo);

            geo.indexBuf.bind(); // Bind index buffer

            currentBoundGeoType = type;
       // }

        /* Draw geometry
         */
        context.drawElements(geo.primitive, geo.indexBuf.numItems, context.UNSIGNED_SHORT, 0);
        context.flush();

        /* Don't need to unbind buffers - only one is bound at a time anyway
         */

        /* Destroy one-off geometry
         */
        //                    if (!geo.fixed) {
        //                        destroyGeometry(geo);
        //                        currentBoundGeoType = null;
        //                    }
    };
})();
/**
 * @class A scene node that defines an element of geometry.
 * 
 * <p><b>Example Usage</b></p><p>Definition of a cube, with normals and UV texture coordinates, with coordinates shown here only for the first face:</b></p><pre><code>
 * var g = new SceneJS.Geometry({
 *
 *        // Optional geometry type ID. If some other Geometry node with this type has previously
 *        // been rendered in the scene graph then this Geometry will just re-use the geometry
 *        // (IE. vertex buffers etc.) that were created by it.
 *
 *        type: "cube_5_5_5",   // Optional
 *
 *        // Mandatory primitive type - "points", "lines", "line-loop", "line-strip", "triangles",
 *        // "triangle-strip" or "triangle-fan".
 *
 *        primitive: "triangles",
 *
 *        // Mandatory 3D positions - eight for our cube, each one spaining three array elements for X,Y and Z
 *
 *        positions : [
 *
 *            // Front cube face - vertices 0,1,2,3
 *
 *            5, 5, 5,
 *            -5, 5, 5,
 *            -5,-5, 5,
 *            5,-5, 5,
 *
 *            //...
 *        ],
 *
 *        // Optional normal vectors, one for each vertex. If you omit these, then cube will not be shaded.
 *
 *        normals : [
 *
 *            // Vertices 0,1,2,3
 *
 *            0, 0, -1,
 *            0, 0, -1,
 *            0, 0, -1,
 *            0, 0, -1,
 *
 *            //...
 *        ],
 *
 *        // Optional 2D texture coordinates corresponding to the 3D positions defined above -
 *        // eight for our cube, each one spanning two array elements for X and Y. If you omit these, then the cube
 *        // will never be textured.
 *
 *        uv : [
 *
 *            // Vertices 0,1,2,3
 *
 *            5, 5,
 *            0, 5,
 *            0, 0,
 *            5, 0,
 *
 *            // ...
 *        ],
 *
 *        // Optional coordinates for a second UV layer - just to illustrate their availability
 *
 *        uv2 : [
 *
 *        ],
 *
 *        // Mandatory indices - these organise the positions, normals and uv texture coordinates into geometric
 *        // primitives in accordance with the "primitive" parameter, in this case a set of three indices for each triangle.
 *        // Note that each triangle in this example is specified in counter-clockwise winding order. You can specify them in
 *        // clockwise order if you configure the SceneJS.renderer node's frontFace property as "cw", instead of the
 *        // default "ccw".
 *
 *        indices : [
 *
 *            // Vertices 0,1,2,3
 *
 *            0, 1, 2,
 *            0, 2, 3,
 *
 *            // ...
 *        ]
 * });
 *  </pre></code>
 * @extends SceneJS.Node
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.Geometry
 * @param {Object} [cfg] Static configuration object
 * @param {String} cfg.type Optional geometry type - Geometry nodes with same value of this will share the same vertex buffers
 * @param {String} cfg.primitive The primitive type - "points", "lines", "line-loop", "line-strip", "triangles", "triangle-strip" or "triangle-fan"
 * @param {double[]} cfg.positions Flattened array of 3D coordinates, three elements each
 * @param {double[]} [cfg.normals = []] Flattened array of 3D vertex normal vectors, three elements each
 * @param {double[]} [cfg.uv = []] Flattened array of 2D UV-space coordinates for the first texture layer, two elements each
 * @param {double[]} [cfg.uv2 = []] Flattened array of 2D UV-space coordinates for the second texture layer, two elements each
 * @param {int[]} cfg.indices Flattened array of indices to index the other arrays per the specified primitive type
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @since Version 0.7.3
 */
SceneJS.Geometry = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "geometry";
    this._geo = null;  // Holds geometry when configured as given arrays
    this._create = null; // Callback to create geometry
    this._type = null; // Optional geometry type ID
    this._handle = null; // Handle to created geometry
};

SceneJS._inherit(SceneJS.Geometry, SceneJS.Node);

SceneJS.Geometry.prototype._init = function(params) {
    this._type = params.type;       // Optional - can be null
    if (params.create instanceof Function) {
        this._create = params.create;
    } else {
        this._geo = {
            positions : params.positions || [],
            normals : params.normals || [],
            colors : params.colors || [],
            indices : params.indices || [],
            uv : params.uv || [],
            primitive : params.primitive || "triangles"
        };
    }
};

// @private
SceneJS.Geometry.prototype._render = function(traversalContext, data) {
    if (!this._geo && !this._create) { // Dynamically configured
        this._init(this._getParams(data));
    }
    if (this._handle) { // Was created before - test if not evicted since
        if (!SceneJS._geometryModule.testGeometryExists(this._handle)) {
            this._handle = null;
        }
    }
    if (!this._handle) { // Either not created yet or has been evicted
        if (this._create) { // Use callback to create
            this._handle = SceneJS._geometryModule.createGeometry(this._type, this._create());
        } else { // Or supply arrays
            this._handle = SceneJS._geometryModule.createGeometry(this._type, this._geo);
        }
    }
    SceneJS._geometryModule.drawGeometry(this._handle);
    this._renderNodes(traversalContext, data);
};

/** Factory function that returns a new {@link SceneJS.Geometry} instance
 * @param {Object} [cfg] Static configuration object
 * @param {String} cfg.primitive The primitive type - "points", "lines", "line-loop", "line-strip", "triangles", "triangle-strip" or "triangle-fan"
 * @param {double[]} cfg.positions Flattened array of 3D coordinates, three elements each
 * @param {double[]} [cfg.normals = []] Flattened array of 3D vertex normal vectors, three elements each
 * @param {double[]} [cfg.uv = []] Flattened array of 2D UV-space coordinates for the first texture layer, two elements each
 * @param {double[]} [cfg.uv2 = []] Flattened array of 2D UV-space coordinates for the second texture layer, two elements each
 * @param {int[]} cfg.indices  Flattened array of indices to index the other arrays per the specified primitive type
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Geometry}
 * @since Version 0.7.1
 */
SceneJS.geometry = function() {
    var n = new SceneJS.Geometry();
    SceneJS.Geometry.prototype.constructor.apply(n, arguments);
    return n;
};
SceneJS._namespace("SceneJS.objects");
/**
 * @class A scene node that defines the geometry of the venerable OpenGL teapot.
 * <p><b>Example Usage</b></p><p>Definition of teapot:</b></p><pre><code>
 * var c = new SceneJS.objects.Teapot(); // Requires no parameters
 * </pre></code>
 * @extends SceneJS.Geometry
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.objects.Teapot
 * @param {Object} [cfg] Static configuration object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.objects.Teapot = function() {
    SceneJS.Geometry.apply(this, arguments);
    this._nodeType = "teapot";

    /* Type ID ensures that we save memory by reusing any teapot that has already been created
     */
    this._type = "teapot";

    /* Callback that does the creation when teapot not created yet
     * @private
     */
    this._create = function() {
        var positions = [
            [-3.000000, 1.650000, 0.000000],
            [-2.987110, 1.650000, -0.098438],
            [-2.987110, 1.650000, 0.098438],
            [-2.985380, 1.567320, -0.049219],
            [-2.985380, 1.567320, 0.049219],
            [-2.983500, 1.483080, 0.000000],
            [-2.981890, 1.723470, -0.049219],
            [-2.981890, 1.723470, 0.049219],
            [-2.976560, 1.798530, 0.000000],
            [-2.970900, 1.486210, -0.098438],
            [-2.970900, 1.486210, 0.098438],
            [-2.963880, 1.795340, -0.098438],
            [-2.963880, 1.795340, 0.098438],
            [-2.962210, 1.570170, -0.133594],
            [-2.962210, 1.570170, 0.133594],
            [-2.958640, 1.720570, -0.133594],
            [-2.958640, 1.720570, 0.133594],
            [-2.953130, 1.650000, -0.168750],
            [-2.953130, 1.650000, 0.168750],
            [-2.952470, 1.403740, -0.049219],
            [-2.952470, 1.403740, 0.049219],
            [-2.937700, 1.494470, -0.168750],
            [-2.937700, 1.494470, 0.168750],
            [-2.935230, 1.852150, -0.049219],
            [-2.935230, 1.852150, 0.049219],
            [-2.933590, 1.320120, 0.000000],
            [-2.930450, 1.786930, -0.168750],
            [-2.930450, 1.786930, 0.168750],
            [-2.930370, 1.411500, -0.133594],
            [-2.930370, 1.411500, 0.133594],
            [-2.921880, 1.325530, -0.098438],
            [-2.921880, 1.325530, 0.098438],
            [-2.912780, 1.844170, -0.133594],
            [-2.912780, 1.844170, 0.133594],
            [-2.906250, 1.910160, 0.000000],
            [-2.894230, 1.904570, -0.098438],
            [-2.894230, 1.904570, 0.098438],
            [-2.891380, 1.579100, -0.196875],
            [-2.891380, 1.579100, 0.196875],
            [-2.890990, 1.339800, -0.168750],
            [-2.890990, 1.339800, 0.168750],
            [-2.890650, 1.712080, -0.196875],
            [-2.890650, 1.712080, 0.196875],
            [-2.883460, 1.245790, -0.048343],
            [-2.883460, 1.245790, 0.048343],
            [-2.863460, 1.257130, -0.132718],
            [-2.863460, 1.257130, 0.132718],
            [-2.862660, 1.434830, -0.196875],
            [-2.862660, 1.434830, 0.196875],
            [-2.862550, 1.889830, -0.168750],
            [-2.862550, 1.889830, 0.168750],
            [-2.850000, 1.650000, -0.225000],
            [-2.850000, 1.650000, 0.225000],
            [-2.849710, 1.161550, 0.000000],
            [-2.847100, 1.820820, -0.196875],
            [-2.847100, 1.820820, 0.196875],
            [-2.841940, 1.946920, -0.049219],
            [-2.841940, 1.946920, 0.049219],
            [-2.829000, 1.761400, -0.225000],
            [-2.829000, 1.761400, 0.225000],
            [-2.828670, 1.175980, -0.094933],
            [-2.828670, 1.175980, 0.094933],
            [-2.824700, 1.521940, -0.225000],
            [-2.824700, 1.521940, 0.225000],
            [-2.821150, 1.935200, -0.133594],
            [-2.821150, 1.935200, 0.133594],
            [-2.812310, 1.187190, -0.168750],
            [-2.812310, 1.187190, 0.168750],
            [-2.805010, 1.289970, -0.196875],
            [-2.805010, 1.289970, 0.196875],
            [-2.797270, 1.383110, -0.225000],
            [-2.797270, 1.383110, 0.225000],
            [-2.789060, 1.990140, 0.000000],
            [-2.788360, 1.699320, -0.196875],
            [-2.788360, 1.699320, 0.196875],
            [-2.778210, 1.982830, -0.098438],
            [-2.778210, 1.982830, 0.098438],
            [-2.774420, 1.527380, -0.196875],
            [-2.774420, 1.527380, 0.196875],
            [-2.773560, 1.098600, -0.084375],
            [-2.773560, 1.098600, 0.084375],
            [-2.766410, 1.845120, -0.225000],
            [-2.766410, 1.845120, 0.225000],
            [-2.760340, 1.900900, -0.196875],
            [-2.760340, 1.900900, 0.196875],
            [-2.749600, 1.963560, -0.168750],
            [-2.749600, 1.963560, 0.168750],
            [-2.748310, 1.785700, -0.196875],
            [-2.748310, 1.785700, 0.196875],
            [-2.746880, 1.650000, -0.168750],
            [-2.746880, 1.650000, 0.168750],
            [-2.731250, 1.007810, 0.000000],
            [-2.727560, 1.735870, -0.168750],
            [-2.727560, 1.735870, 0.168750],
            [-2.720360, 1.690830, -0.133594],
            [-2.720360, 1.690830, 0.133594],
            [-2.719480, 1.249770, -0.225000],
            [-2.719480, 1.249770, 0.225000],
            [-2.716780, 1.144680, -0.196875],
            [-2.716780, 1.144680, 0.196875],
            [-2.712890, 1.650000, -0.098438],
            [-2.712890, 1.650000, 0.098438],
            [-2.708990, 1.541770, -0.133594],
            [-2.708990, 1.541770, 0.133594],
            [-2.703540, 1.426410, -0.168750],
            [-2.703540, 1.426410, 0.168750],
            [-2.700980, 1.037840, -0.168750],
            [-2.700980, 1.037840, 0.168750],
            [-2.700000, 1.650000, 0.000000],
            [-2.699650, 2.010790, -0.048346],
            [-2.699650, 2.010790, 0.048346],
            [-2.697120, 1.687930, -0.049219],
            [-2.697120, 1.687930, 0.049219],
            [-2.694130, 1.727460, -0.098438],
            [-2.694130, 1.727460, 0.098438],
            [-2.686620, 1.546690, -0.049219],
            [-2.686620, 1.546690, 0.049219],
            [-2.682630, 1.762350, -0.133594],
            [-2.682630, 1.762350, 0.133594],
            [-2.681480, 1.996460, -0.132721],
            [-2.681480, 1.996460, 0.132721],
            [-2.681440, 1.724270, 0.000000],
            [-2.675740, 1.270850, -0.196875],
            [-2.675740, 1.270850, 0.196875],
            [-2.672650, 1.440680, -0.098438],
            [-2.672650, 1.440680, 0.098438],
            [-2.670260, 1.800400, -0.168750],
            [-2.670260, 1.800400, 0.168750],
            [-2.667800, 1.846230, -0.196875],
            [-2.667800, 1.846230, 0.196875],
            [-2.662790, 1.905100, -0.225000],
            [-2.662790, 1.905100, 0.225000],
            [-2.660940, 1.446090, 0.000000],
            [-2.660180, 1.754370, -0.049219],
            [-2.660180, 1.754370, 0.049219],
            [-2.638580, 1.785670, -0.098438],
            [-2.638580, 1.785670, 0.098438],
            [-2.634380, 1.103910, -0.225000],
            [-2.634380, 1.103910, 0.225000],
            [-2.630740, 1.956740, -0.196875],
            [-2.630740, 1.956740, 0.196875],
            [-2.626560, 1.780080, 0.000000],
            [-2.625000, 2.043750, 0.000000],
            [-2.624640, 1.305020, -0.132813],
            [-2.624640, 1.305020, 0.132813],
            [-2.606420, 1.317450, -0.048438],
            [-2.606420, 1.317450, 0.048438],
            [-2.606320, 2.026440, -0.094945],
            [-2.606320, 2.026440, 0.094945],
            [-2.591800, 2.012990, -0.168750],
            [-2.591800, 2.012990, 0.168750],
            [-2.571730, 1.834290, -0.168750],
            [-2.571730, 1.834290, 0.168750],
            [-2.567770, 1.169970, -0.168750],
            [-2.567770, 1.169970, 0.168750],
            [-2.554600, 1.183040, -0.095315],
            [-2.554600, 1.183040, 0.095315],
            [-2.549750, 1.890590, -0.196875],
            [-2.549750, 1.890590, 0.196875],
            [-2.549540, 0.878984, -0.084375],
            [-2.549540, 0.878984, 0.084375],
            [-2.546430, 1.831970, -0.132721],
            [-2.546430, 1.831970, 0.132721],
            [-2.537500, 1.200000, 0.000000],
            [-2.527210, 1.819200, -0.048346],
            [-2.527210, 1.819200, 0.048346],
            [-2.518750, 1.945310, -0.225000],
            [-2.518750, 1.945310, 0.225000],
            [-2.516830, 0.932671, -0.196875],
            [-2.516830, 0.932671, 0.196875],
            [-2.471840, 1.006490, -0.196875],
            [-2.471840, 1.006490, 0.196875],
            [-2.445700, 1.877640, -0.168750],
            [-2.445700, 1.877640, 0.168750],
            [-2.439130, 1.060180, -0.084375],
            [-2.439130, 1.060180, 0.084375],
            [-2.431180, 1.864180, -0.094945],
            [-2.431180, 1.864180, 0.094945],
            [-2.412500, 1.846870, 0.000000],
            [-2.388280, 0.716602, 0.000000],
            [-2.382250, 0.737663, -0.095854],
            [-2.382250, 0.737663, 0.095854],
            [-2.378840, 2.052020, -0.084375],
            [-2.378840, 2.052020, 0.084375],
            [-2.377660, 0.753680, -0.168750],
            [-2.377660, 0.753680, 0.168750],
            [-2.364750, 0.798761, -0.199836],
            [-2.364750, 0.798761, 0.199836],
            [-2.354300, 0.835254, -0.225000],
            [-2.354300, 0.835254, 0.225000],
            [-2.343840, 0.871747, -0.199836],
            [-2.343840, 0.871747, 0.199836],
            [-2.341150, 1.999720, -0.196875],
            [-2.341150, 1.999720, 0.196875],
            [-2.330930, 0.916827, -0.168750],
            [-2.330930, 0.916827, 0.168750],
            [-2.320310, 0.953906, 0.000000],
            [-2.289320, 1.927820, -0.196875],
            [-2.289320, 1.927820, 0.196875],
            [-2.251620, 1.875520, -0.084375],
            [-2.251620, 1.875520, 0.084375],
            [-2.247410, 0.882285, -0.084375],
            [-2.247410, 0.882285, 0.084375],
            [-2.173630, 0.844043, 0.000000],
            [-2.168530, 0.826951, -0.097184],
            [-2.168530, 0.826951, 0.097184],
            [-2.164770, 0.814364, -0.168750],
            [-2.164770, 0.814364, 0.168750],
            [-2.156880, 0.786694, -0.187068],
            [-2.156880, 0.786694, 0.187068],
            [-2.156250, 2.092970, 0.000000],
            [-2.154120, 0.740520, -0.215193],
            [-2.154120, 0.740520, 0.215193],
            [-2.150170, 0.694734, -0.215193],
            [-2.150170, 0.694734, 0.215193],
            [-2.147420, 0.648560, -0.187068],
            [-2.147420, 0.648560, 0.187068],
            [-2.144960, 0.612777, -0.132948],
            [-2.144960, 0.612777, 0.132948],
            [-2.143710, 0.591789, -0.048573],
            [-2.143710, 0.591789, 0.048573],
            [-2.142330, 2.058360, -0.168750],
            [-2.142330, 2.058360, 0.168750],
            [-2.111720, 1.982230, -0.225000],
            [-2.111720, 1.982230, 0.225000],
            [-2.084470, 0.789526, -0.048905],
            [-2.084470, 0.789526, 0.048905],
            [-2.081100, 1.906090, -0.168750],
            [-2.081100, 1.906090, 0.168750],
            [-2.078340, 0.770387, -0.133280],
            [-2.078340, 0.770387, 0.133280],
            [-2.067190, 1.871480, 0.000000],
            [-2.000000, 0.750000, 0.000000],
            [-1.995700, 0.737109, -0.098438],
            [-1.995700, 0.737109, 0.098438],
            [-1.984380, 0.703125, -0.168750],
            [-1.984380, 0.703125, 0.168750],
            [-1.978520, 0.591650, 0.000000],
            [-1.969370, 0.670825, -0.202656],
            [-1.969370, 0.670825, 0.202656],
            [-1.968360, 0.655078, -0.210938],
            [-1.968360, 0.655078, 0.210938],
            [-1.960000, 0.750000, -0.407500],
            [-1.960000, 0.750000, 0.407500],
            [-1.958730, 0.925195, -0.201561],
            [-1.958730, 0.925195, 0.201561],
            [-1.957030, 1.100390, 0.000000],
            [-1.950000, 0.600000, -0.225000],
            [-1.950000, 0.600000, 0.225000],
            [-1.938950, 0.591650, -0.403123],
            [-1.938950, 0.591650, 0.403123],
            [-1.931640, 0.544922, -0.210938],
            [-1.931640, 0.544922, 0.210938],
            [-1.930690, 0.522583, -0.198676],
            [-1.930690, 0.522583, 0.198676],
            [-1.921880, 0.453516, 0.000000],
            [-1.917890, 1.100390, -0.398745],
            [-1.917890, 1.100390, 0.398745],
            [-1.915620, 0.496875, -0.168750],
            [-1.915620, 0.496875, 0.168750],
            [-1.904300, 0.462891, -0.098438],
            [-1.904300, 0.462891, 0.098438],
            [-1.900000, 0.450000, 0.000000],
            [-1.892280, 0.670825, -0.593047],
            [-1.892280, 0.670825, 0.593047],
            [-1.883440, 0.453516, -0.391582],
            [-1.883440, 0.453516, 0.391582],
            [-1.882060, 0.925195, -0.589845],
            [-1.882060, 0.925195, 0.589845],
            [-1.881390, 1.286130, -0.193602],
            [-1.881390, 1.286130, 0.193602],
            [-1.855120, 0.522583, -0.581402],
            [-1.855120, 0.522583, 0.581402],
            [-1.845000, 0.750000, -0.785000],
            [-1.845000, 0.750000, 0.785000],
            [-1.843750, 1.471870, 0.000000],
            [-1.833170, 1.890680, -0.084375],
            [-1.833170, 1.890680, 0.084375],
            [-1.831800, 1.946490, -0.196875],
            [-1.831800, 1.946490, 0.196875],
            [-1.829920, 2.023230, -0.196875],
            [-1.829920, 2.023230, 0.196875],
            [-1.828550, 2.079040, -0.084375],
            [-1.828550, 2.079040, 0.084375],
            [-1.825180, 0.591650, -0.776567],
            [-1.825180, 0.591650, 0.776567],
            [-1.817580, 0.343945, -0.187036],
            [-1.817580, 0.343945, 0.187036],
            [-1.807750, 1.286130, -0.566554],
            [-1.807750, 1.286130, 0.566554],
            [-1.806870, 1.471870, -0.375664],
            [-1.806870, 1.471870, 0.375664],
            [-1.805360, 1.100390, -0.768135],
            [-1.805360, 1.100390, 0.768135],
            [-1.772930, 0.453516, -0.754336],
            [-1.772930, 0.453516, 0.754336],
            [-1.750000, 0.234375, 0.000000],
            [-1.746440, 0.343945, -0.547339],
            [-1.746440, 0.343945, 0.547339],
            [-1.744330, 0.670825, -0.949871],
            [-1.744330, 0.670825, 0.949871],
            [-1.734910, 0.925195, -0.944741],
            [-1.734910, 0.925195, 0.944741],
            [-1.715000, 0.234375, -0.356563],
            [-1.715000, 0.234375, 0.356562],
            [-1.710080, 0.522583, -0.931218],
            [-1.710080, 0.522583, 0.931218],
            [-1.700860, 1.471870, -0.723672],
            [-1.700860, 1.471870, 0.723672],
            [-1.666400, 1.286130, -0.907437],
            [-1.666400, 1.286130, 0.907437],
            [-1.662500, 0.750000, -1.125000],
            [-1.662500, 0.750000, 1.125000],
            [-1.655160, 1.860940, -0.170322],
            [-1.655160, 1.860940, 0.170322],
            [-1.647420, 0.159961, -0.169526],
            [-1.647420, 0.159961, 0.169526],
            [-1.644640, 0.591650, -1.112920],
            [-1.644640, 0.591650, 1.112920],
            [-1.626780, 1.100390, -1.100830],
            [-1.626780, 1.100390, 1.100830],
            [-1.614370, 0.234375, -0.686875],
            [-1.614370, 0.234375, 0.686875],
            [-1.609890, 0.343945, -0.876660],
            [-1.609890, 0.343945, 0.876660],
            [-1.600000, 1.875000, 0.000000],
            [-1.597560, 0.453516, -1.081060],
            [-1.597560, 0.453516, 1.081060],
            [-1.590370, 1.860940, -0.498428],
            [-1.590370, 1.860940, 0.498428],
            [-1.584380, 1.910160, -0.168750],
            [-1.584380, 1.910160, 0.168750],
            [-1.582940, 0.159961, -0.496099],
            [-1.582940, 0.159961, 0.496099],
            [-1.578130, 0.085547, 0.000000],
            [-1.550000, 1.987500, -0.225000],
            [-1.550000, 1.987500, 0.225000],
            [-1.546560, 0.085547, -0.321543],
            [-1.546560, 0.085547, 0.321543],
            [-1.532970, 0.670825, -1.265670],
            [-1.532970, 0.670825, 1.265670],
            [-1.532620, 1.471870, -1.037110],
            [-1.532620, 1.471870, 1.037110],
            [-1.524690, 0.925195, -1.258830],
            [-1.524690, 0.925195, 1.258830],
            [-1.523670, 0.042773, -0.156792],
            [-1.523670, 0.042773, 0.156792],
            [-1.515630, 2.064840, -0.168750],
            [-1.515630, 2.064840, 0.168750],
            [-1.502870, 0.522583, -1.240810],
            [-1.502870, 0.522583, 1.240810],
            [-1.500000, 0.000000, 0.000000],
            [-1.500000, 2.100000, 0.000000],
            [-1.500000, 2.250000, 0.000000],
            [-1.470000, 0.000000, -0.305625],
            [-1.470000, 0.000000, 0.305625],
            [-1.470000, 2.250000, -0.305625],
            [-1.470000, 2.250000, 0.305625],
            [-1.466020, 1.860940, -0.798320],
            [-1.466020, 1.860940, 0.798320],
            [-1.464490, 1.286130, -1.209120],
            [-1.464490, 1.286130, 1.209120],
            [-1.464030, 0.042773, -0.458833],
            [-1.464030, 0.042773, 0.458833],
            [-1.459860, 2.286910, -0.150226],
            [-1.459860, 2.286910, 0.150226],
            [-1.459170, 0.159961, -0.794590],
            [-1.459170, 0.159961, 0.794590],
            [-1.455820, 0.085547, -0.619414],
            [-1.455820, 0.085547, 0.619414],
            [-1.454690, 0.234375, -0.984375],
            [-1.454690, 0.234375, 0.984375],
            [-1.449220, 2.323830, 0.000000],
            [-1.420230, 2.323830, -0.295278],
            [-1.420230, 2.323830, 0.295278],
            [-1.420000, 0.750000, -1.420000],
            [-1.420000, 0.750000, 1.420000],
            [-1.414820, 0.343945, -1.168120],
            [-1.414820, 0.343945, 1.168120],
            [-1.411910, 2.336130, -0.145291],
            [-1.411910, 2.336130, 0.145291],
            [-1.404750, 0.591650, -1.404750],
            [-1.404750, 0.591650, 1.404750],
            [-1.403130, 2.348440, 0.000000],
            [-1.402720, 2.286910, -0.439618],
            [-1.402720, 2.286910, 0.439618],
            [-1.400000, 2.250000, 0.000000],
            [-1.389490, 1.100390, -1.389490],
            [-1.389490, 1.100390, 1.389490],
            [-1.383750, 0.000000, -0.588750],
            [-1.383750, 0.000000, 0.588750],
            [-1.383750, 2.250000, -0.588750],
            [-1.383750, 2.250000, 0.588750],
            [-1.380470, 2.323830, 0.000000],
            [-1.377880, 2.336130, -0.141789],
            [-1.377880, 2.336130, 0.141789],
            [-1.376330, 2.286910, -0.141630],
            [-1.376330, 2.286910, 0.141630],
            [-1.375060, 2.348440, -0.285887],
            [-1.375060, 2.348440, 0.285887],
            [-1.372000, 2.250000, -0.285250],
            [-1.372000, 2.250000, 0.285250],
            [-1.364530, 0.453516, -1.364530],
            [-1.364530, 0.453516, 1.364530],
            [-1.356650, 2.336130, -0.425177],
            [-1.356650, 2.336130, 0.425177],
            [-1.352860, 2.323830, -0.281271],
            [-1.352860, 2.323830, 0.281271],
            [-1.349570, 0.042773, -0.734902],
            [-1.349570, 0.042773, 0.734902],
            [-1.336900, 2.323830, -0.568818],
            [-1.336900, 2.323830, 0.568818],
            [-1.323950, 2.336130, -0.414929],
            [-1.323950, 2.336130, 0.414929],
            [-1.322460, 2.286910, -0.414464],
            [-1.322460, 2.286910, 0.414464],
            [-1.311820, 0.085547, -0.887695],
            [-1.311820, 0.085547, 0.887695],
            [-1.309060, 1.471870, -1.309060],
            [-1.309060, 1.471870, 1.309060],
            [-1.300000, 2.250000, 0.000000],
            [-1.294380, 2.348440, -0.550727],
            [-1.294380, 2.348440, 0.550727],
            [-1.293050, 2.286910, -0.704126],
            [-1.293050, 2.286910, 0.704126],
            [-1.291500, 2.250000, -0.549500],
            [-1.291500, 2.250000, 0.549500],
            [-1.288390, 1.860940, -1.063730],
            [-1.288390, 1.860940, 1.063730],
            [-1.282370, 0.159961, -1.058760],
            [-1.282370, 0.159961, 1.058760],
            [-1.274000, 2.250000, -0.264875],
            [-1.274000, 2.250000, 0.264875],
            [-1.273480, 2.323830, -0.541834],
            [-1.273480, 2.323830, 0.541834],
            [-1.267660, 2.274900, -0.130448],
            [-1.267660, 2.274900, 0.130448],
            [-1.265670, 0.670825, -1.532970],
            [-1.265670, 0.670825, 1.532970],
            [-1.260940, 2.299800, 0.000000],
            [-1.258830, 0.925195, -1.524690],
            [-1.258830, 0.925195, 1.524690],
            [-1.250570, 2.336130, -0.680997],
            [-1.250570, 2.336130, 0.680997],
            [-1.246880, 0.000000, -0.843750],
            [-1.246880, 0.000000, 0.843750],
            [-1.246880, 2.250000, -0.843750],
            [-1.246880, 2.250000, 0.843750],
            [-1.242500, 0.234375, -1.242500],
            [-1.242500, 0.234375, 1.242500],
            [-1.240810, 0.522583, -1.502870],
            [-1.240810, 0.522583, 1.502870],
            [-1.235720, 2.299800, -0.256916],
            [-1.235720, 2.299800, 0.256916],
            [-1.220430, 2.336130, -0.664583],
            [-1.220430, 2.336130, 0.664583],
            [-1.219060, 2.286910, -0.663837],
            [-1.219060, 2.286910, 0.663837],
            [-1.218050, 2.274900, -0.381740],
            [-1.218050, 2.274900, 0.381740],
            [-1.209120, 1.286130, -1.464490],
            [-1.209120, 1.286130, 1.464490],
            [-1.204660, 2.323830, -0.815186],
            [-1.204660, 2.323830, 0.815186],
            [-1.199250, 2.250000, -0.510250],
            [-1.199250, 2.250000, 0.510250],
            [-1.196510, 2.319430, -0.123125],
            [-1.196510, 2.319430, 0.123125],
            [-1.186040, 0.042773, -0.979229],
            [-1.186040, 0.042773, 0.979229],
            [-1.168120, 0.343945, -1.414820],
            [-1.168120, 0.343945, 1.414820],
            [-1.166350, 2.348440, -0.789258],
            [-1.166350, 2.348440, 0.789258],
            [-1.163750, 2.250000, -0.787500],
            [-1.163750, 2.250000, 0.787500],
            [-1.163220, 2.299800, -0.494918],
            [-1.163220, 2.299800, 0.494918],
            [-1.156250, 2.339060, 0.000000],
            [-1.149680, 2.319430, -0.360312],
            [-1.149680, 2.319430, 0.360312],
            [-1.147520, 2.323830, -0.776514],
            [-1.147520, 2.323830, 0.776514],
            [-1.136370, 2.286910, -0.938220],
            [-1.136370, 2.286910, 0.938220],
            [-1.133120, 2.339060, -0.235586],
            [-1.133120, 2.339060, 0.235586],
            [-1.125000, 0.750000, -1.662500],
            [-1.125000, 0.750000, 1.662500],
            [-1.122810, 2.274900, -0.611424],
            [-1.122810, 2.274900, 0.611424],
            [-1.120470, 0.085547, -1.120470],
            [-1.120470, 0.085547, 1.120470],
            [-1.112920, 0.591650, -1.644640],
            [-1.112920, 0.591650, 1.644640],
            [-1.100830, 1.100390, -1.626780],
            [-1.100830, 1.100390, 1.626780],
            [-1.099040, 2.336130, -0.907402],
            [-1.099040, 2.336130, 0.907402],
            [-1.081060, 0.453516, -1.597560],
            [-1.081060, 0.453516, 1.597560],
            [-1.080630, 2.250000, -0.731250],
            [-1.080630, 2.250000, 0.731250],
            [-1.072550, 2.336130, -0.885531],
            [-1.072550, 2.336130, 0.885531],
            [-1.071350, 2.286910, -0.884537],
            [-1.071350, 2.286910, 0.884537],
            [-1.066640, 2.339060, -0.453828],
            [-1.066640, 2.339060, 0.453828],
            [-1.065000, 0.000000, -1.065000],
            [-1.065000, 0.000000, 1.065000],
            [-1.065000, 2.250000, -1.065000],
            [-1.065000, 2.250000, 1.065000],
            [-1.063730, 1.860940, -1.288390],
            [-1.063730, 1.860940, 1.288390],
            [-1.059790, 2.319430, -0.577104],
            [-1.059790, 2.319430, 0.577104],
            [-1.058760, 0.159961, -1.282370],
            [-1.058760, 0.159961, 1.282370],
            [-1.048150, 2.299800, -0.709277],
            [-1.048150, 2.299800, 0.709277],
            [-1.037110, 1.471870, -1.532620],
            [-1.037110, 1.471870, 1.532620],
            [-1.028940, 2.323830, -1.028940],
            [-1.028940, 2.323830, 1.028940],
            [-0.996219, 2.348440, -0.996219],
            [-0.996219, 2.348440, 0.996219],
            [-0.994000, 2.250000, -0.994000],
            [-0.994000, 2.250000, 0.994000],
            [-0.986761, 2.274900, -0.814698],
            [-0.986761, 2.274900, 0.814698],
            [-0.984375, 0.234375, -1.454690],
            [-0.984375, 0.234375, 1.454690],
            [-0.980719, 2.369530, -0.100920],
            [-0.980719, 2.369530, 0.100920],
            [-0.980133, 2.323830, -0.980133],
            [-0.980133, 2.323830, 0.980133],
            [-0.979229, 0.042773, -1.186040],
            [-0.979229, 0.042773, 1.186040],
            [-0.961133, 2.339060, -0.650391],
            [-0.961133, 2.339060, 0.650391],
            [-0.949871, 0.670825, -1.744330],
            [-0.949871, 0.670825, 1.744330],
            [-0.944741, 0.925195, -1.734910],
            [-0.944741, 0.925195, 1.734910],
            [-0.942332, 2.369530, -0.295330],
            [-0.942332, 2.369530, 0.295330],
            [-0.938220, 2.286910, -1.136370],
            [-0.938220, 2.286910, 1.136370],
            [-0.931373, 2.319430, -0.768968],
            [-0.931373, 2.319430, 0.768968],
            [-0.931218, 0.522583, -1.710080],
            [-0.931218, 0.522583, 1.710080],
            [-0.923000, 2.250000, -0.923000],
            [-0.923000, 2.250000, 0.923000],
            [-0.907437, 1.286130, -1.666400],
            [-0.907437, 1.286130, 1.666400],
            [-0.907402, 2.336130, -1.099040],
            [-0.907402, 2.336130, 1.099040],
            [-0.895266, 2.299800, -0.895266],
            [-0.895266, 2.299800, 0.895266],
            [-0.887695, 0.085547, -1.311820],
            [-0.887695, 0.085547, 1.311820],
            [-0.885531, 2.336130, -1.072550],
            [-0.885531, 2.336130, 1.072550],
            [-0.884537, 2.286910, -1.071350],
            [-0.884537, 2.286910, 1.071350],
            [-0.876660, 0.343945, -1.609890],
            [-0.876660, 0.343945, 1.609890],
            [-0.868654, 2.369530, -0.473023],
            [-0.868654, 2.369530, 0.473023],
            [-0.843750, 0.000000, -1.246880],
            [-0.843750, 0.000000, 1.246880],
            [-0.843750, 2.250000, -1.246880],
            [-0.843750, 2.250000, 1.246880],
            [-0.825000, 2.400000, 0.000000],
            [-0.820938, 2.339060, -0.820938],
            [-0.820938, 2.339060, 0.820938],
            [-0.815186, 2.323830, -1.204660],
            [-0.815186, 2.323830, 1.204660],
            [-0.814698, 2.274900, -0.986761],
            [-0.814698, 2.274900, 0.986761],
            [-0.808500, 2.400000, -0.168094],
            [-0.808500, 2.400000, 0.168094],
            [-0.798320, 1.860940, -1.466020],
            [-0.798320, 1.860940, 1.466020],
            [-0.794590, 0.159961, -1.459170],
            [-0.794590, 0.159961, 1.459170],
            [-0.789258, 2.348440, -1.166350],
            [-0.789258, 2.348440, 1.166350],
            [-0.787500, 2.250000, -1.163750],
            [-0.787500, 2.250000, 1.163750],
            [-0.785000, 0.750000, -1.845000],
            [-0.785000, 0.750000, 1.845000],
            [-0.776567, 0.591650, -1.825180],
            [-0.776567, 0.591650, 1.825180],
            [-0.776514, 2.323830, -1.147520],
            [-0.776514, 2.323830, 1.147520],
            [-0.768968, 2.319430, -0.931373],
            [-0.768968, 2.319430, 0.931373],
            [-0.768135, 1.100390, -1.805360],
            [-0.768135, 1.100390, 1.805360],
            [-0.763400, 2.369530, -0.630285],
            [-0.763400, 2.369530, 0.630285],
            [-0.761063, 2.400000, -0.323813],
            [-0.761063, 2.400000, 0.323813],
            [-0.754336, 0.453516, -1.772930],
            [-0.754336, 0.453516, 1.772930],
            [-0.734902, 0.042773, -1.349570],
            [-0.734902, 0.042773, 1.349570],
            [-0.731250, 2.250000, -1.080630],
            [-0.731250, 2.250000, 1.080630],
            [-0.723672, 1.471870, -1.700860],
            [-0.723672, 1.471870, 1.700860],
            [-0.709277, 2.299800, -1.048150],
            [-0.709277, 2.299800, 1.048150],
            [-0.704126, 2.286910, -1.293050],
            [-0.704126, 2.286910, 1.293050],
            [-0.686875, 0.234375, -1.614370],
            [-0.686875, 0.234375, 1.614370],
            [-0.685781, 2.400000, -0.464063],
            [-0.685781, 2.400000, 0.464063],
            [-0.680997, 2.336130, -1.250570],
            [-0.680997, 2.336130, 1.250570],
            [-0.664583, 2.336130, -1.220430],
            [-0.664583, 2.336130, 1.220430],
            [-0.663837, 2.286910, -1.219060],
            [-0.663837, 2.286910, 1.219060],
            [-0.650391, 2.339060, -0.961133],
            [-0.650391, 2.339060, 0.961133],
            [-0.631998, 2.430470, -0.064825],
            [-0.631998, 2.430470, 0.064825],
            [-0.630285, 2.369530, -0.763400],
            [-0.630285, 2.369530, 0.763400],
            [-0.619414, 0.085547, -1.455820],
            [-0.619414, 0.085547, 1.455820],
            [-0.611424, 2.274900, -1.122810],
            [-0.611424, 2.274900, 1.122810],
            [-0.607174, 2.430470, -0.190548],
            [-0.607174, 2.430470, 0.190548],
            [-0.593047, 0.670825, -1.892280],
            [-0.593047, 0.670825, 1.892280],
            [-0.589845, 0.925195, -1.882060],
            [-0.589845, 0.925195, 1.882060],
            [-0.588750, 0.000000, -1.383750],
            [-0.588750, 0.000000, 1.383750],
            [-0.588750, 2.250000, -1.383750],
            [-0.588750, 2.250000, 1.383750],
            [-0.585750, 2.400000, -0.585750],
            [-0.585750, 2.400000, 0.585750],
            [-0.581402, 0.522583, -1.855120],
            [-0.581402, 0.522583, 1.855120],
            [-0.577104, 2.319430, -1.059790],
            [-0.577104, 2.319430, 1.059790],
            [-0.568818, 2.323830, -1.336900],
            [-0.568818, 2.323830, 1.336900],
            [-0.566554, 1.286130, -1.807750],
            [-0.566554, 1.286130, 1.807750],
            [-0.559973, 2.430470, -0.304711],
            [-0.559973, 2.430470, 0.304711],
            [-0.550727, 2.348440, -1.294380],
            [-0.550727, 2.348440, 1.294380],
            [-0.549500, 2.250000, -1.291500],
            [-0.549500, 2.250000, 1.291500],
            [-0.547339, 0.343945, -1.746440],
            [-0.547339, 0.343945, 1.746440],
            [-0.541834, 2.323830, -1.273480],
            [-0.541834, 2.323830, 1.273480],
            [-0.510250, 2.250000, -1.199250],
            [-0.510250, 2.250000, 1.199250],
            [-0.498428, 1.860940, -1.590370],
            [-0.498428, 1.860940, 1.590370],
            [-0.496099, 0.159961, -1.582940],
            [-0.496099, 0.159961, 1.582940],
            [-0.494918, 2.299800, -1.163220],
            [-0.494918, 2.299800, 1.163220],
            [-0.491907, 2.430470, -0.406410],
            [-0.491907, 2.430470, 0.406410],
            [-0.473023, 2.369530, -0.868654],
            [-0.473023, 2.369530, 0.868654],
            [-0.464063, 2.400000, -0.685781],
            [-0.464063, 2.400000, 0.685781],
            [-0.458833, 0.042773, -1.464030],
            [-0.458833, 0.042773, 1.464030],
            [-0.456250, 2.460940, 0.000000],
            [-0.453828, 2.339060, -1.066640],
            [-0.453828, 2.339060, 1.066640],
            [-0.439618, 2.286910, -1.402720],
            [-0.439618, 2.286910, 1.402720],
            [-0.438241, 2.460940, -0.091207],
            [-0.438241, 2.460940, 0.091207],
            [-0.425177, 2.336130, -1.356650],
            [-0.425177, 2.336130, 1.356650],
            [-0.420891, 2.460940, -0.179078],
            [-0.420891, 2.460940, 0.179078],
            [-0.414929, 2.336130, -1.323950],
            [-0.414929, 2.336130, 1.323950],
            [-0.414464, 2.286910, -1.322460],
            [-0.414464, 2.286910, 1.322460],
            [-0.407500, 0.750000, -1.960000],
            [-0.407500, 0.750000, 1.960000],
            [-0.406410, 2.430470, -0.491907],
            [-0.406410, 2.430470, 0.491907],
            [-0.403123, 0.591650, -1.938950],
            [-0.403123, 0.591650, 1.938950],
            [-0.398745, 1.100390, -1.917890],
            [-0.398745, 1.100390, 1.917890],
            [-0.391582, 0.453516, -1.883440],
            [-0.391582, 0.453516, 1.883440],
            [-0.381740, 2.274900, -1.218050],
            [-0.381740, 2.274900, 1.218050],
            [-0.375664, 1.471870, -1.806870],
            [-0.375664, 1.471870, 1.806870],
            [-0.372159, 2.460940, -0.251889],
            [-0.372159, 2.460940, 0.251889],
            [-0.362109, 2.897170, 0.000000],
            [-0.360312, 2.319430, -1.149680],
            [-0.360312, 2.319430, 1.149680],
            [-0.356563, 0.234375, 1.715000],
            [-0.356562, 0.234375, -1.715000],
            [-0.340625, 2.950780, 0.000000],
            [-0.337859, 2.923970, -0.069278],
            [-0.337859, 2.923970, 0.069278],
            [-0.334238, 2.897170, -0.142705],
            [-0.334238, 2.897170, 0.142705],
            [-0.330325, 2.864210, -0.067672],
            [-0.330325, 2.864210, 0.067672],
            [-0.325000, 2.831250, 0.000000],
            [-0.323938, 2.460940, -0.323938],
            [-0.323938, 2.460940, 0.323938],
            [-0.323813, 2.400000, -0.761063],
            [-0.323813, 2.400000, 0.761063],
            [-0.321543, 0.085547, -1.546560],
            [-0.321543, 0.085547, 1.546560],
            [-0.315410, 2.505470, -0.064395],
            [-0.315410, 2.505470, 0.064395],
            [-0.314464, 2.950780, -0.134407],
            [-0.314464, 2.950780, 0.134407],
            [-0.305625, 0.000000, -1.470000],
            [-0.305625, 0.000000, 1.470000],
            [-0.305625, 2.250000, -1.470000],
            [-0.305625, 2.250000, 1.470000],
            [-0.304711, 2.430470, -0.559973],
            [-0.304711, 2.430470, 0.559973],
            [-0.299953, 2.831250, -0.127984],
            [-0.299953, 2.831250, 0.127984],
            [-0.295330, 2.369530, -0.942332],
            [-0.295330, 2.369530, 0.942332],
            [-0.295278, 2.323830, -1.420230],
            [-0.295278, 2.323830, 1.420230],
            [-0.287197, 2.923970, -0.194300],
            [-0.287197, 2.923970, 0.194300],
            [-0.285887, 2.348440, -1.375060],
            [-0.285887, 2.348440, 1.375060],
            [-0.285250, 2.250000, -1.372000],
            [-0.285250, 2.250000, 1.372000],
            [-0.281271, 2.323830, -1.352860],
            [-0.281271, 2.323830, 1.352860],
            [-0.280732, 2.864210, -0.189856],
            [-0.280732, 2.864210, 0.189856],
            [-0.274421, 2.968800, -0.056380],
            [-0.274421, 2.968800, 0.056380],
            [-0.267832, 2.505470, -0.180879],
            [-0.267832, 2.505470, 0.180879],
            [-0.264875, 2.250000, -1.274000],
            [-0.264875, 2.250000, 1.274000],
            [-0.257610, 2.897170, -0.257610],
            [-0.257610, 2.897170, 0.257610],
            [-0.256916, 2.299800, -1.235720],
            [-0.256916, 2.299800, 1.235720],
            [-0.251889, 2.460940, -0.372159],
            [-0.251889, 2.460940, 0.372159],
            [-0.250872, 2.757420, -0.051347],
            [-0.250872, 2.757420, 0.051347],
            [-0.242477, 2.950780, -0.242477],
            [-0.242477, 2.950780, 0.242477],
            [-0.235586, 2.339060, -1.133120],
            [-0.235586, 2.339060, 1.133120],
            [-0.233382, 2.968800, -0.158018],
            [-0.233382, 2.968800, 0.158018],
            [-0.231125, 2.831250, -0.231125],
            [-0.231125, 2.831250, 0.231125],
            [-0.230078, 2.986820, 0.000000],
            [-0.213159, 2.757420, -0.144103],
            [-0.213159, 2.757420, 0.144103],
            [-0.212516, 2.986820, -0.091113],
            [-0.212516, 2.986820, 0.091113],
            [-0.202656, 0.670825, -1.969370],
            [-0.202656, 0.670825, 1.969370],
            [-0.201561, 0.925195, -1.958730],
            [-0.201561, 0.925195, 1.958730],
            [-0.200000, 2.550000, 0.000000],
            [-0.198676, 0.522583, -1.930690],
            [-0.198676, 0.522583, 1.930690],
            [-0.196875, 2.683590, 0.000000],
            [-0.194300, 2.923970, -0.287197],
            [-0.194300, 2.923970, 0.287197],
            [-0.193602, 1.286130, -1.881390],
            [-0.193602, 1.286130, 1.881390],
            [-0.190548, 2.430470, -0.607174],
            [-0.190548, 2.430470, 0.607174],
            [-0.189856, 2.864210, -0.280732],
            [-0.189856, 2.864210, 0.280732],
            [-0.187036, 0.343945, -1.817580],
            [-0.187036, 0.343945, 1.817580],
            [-0.184500, 2.550000, -0.078500],
            [-0.184500, 2.550000, 0.078500],
            [-0.181661, 2.683590, -0.077405],
            [-0.181661, 2.683590, 0.077405],
            [-0.180879, 2.505470, -0.267832],
            [-0.180879, 2.505470, 0.267832],
            [-0.179078, 2.460940, -0.420891],
            [-0.179078, 2.460940, 0.420891],
            [-0.176295, 2.581200, -0.036001],
            [-0.176295, 2.581200, 0.036001],
            [-0.174804, 2.648000, -0.035727],
            [-0.174804, 2.648000, 0.035727],
            [-0.170322, 1.860940, -1.655160],
            [-0.170322, 1.860940, 1.655160],
            [-0.169526, 0.159961, -1.647420],
            [-0.169526, 0.159961, 1.647420],
            [-0.168094, 2.400000, -0.808500],
            [-0.168094, 2.400000, 0.808500],
            [-0.166797, 2.612400, 0.000000],
            [-0.164073, 2.986820, -0.164073],
            [-0.164073, 2.986820, 0.164073],
            [-0.158018, 2.968800, -0.233382],
            [-0.158018, 2.968800, 0.233382],
            [-0.156792, 0.042773, -1.523670],
            [-0.156792, 0.042773, 1.523670],
            [-0.153882, 2.612400, -0.065504],
            [-0.153882, 2.612400, 0.065504],
            [-0.150226, 2.286910, -1.459860],
            [-0.150226, 2.286910, 1.459860],
            [-0.149710, 2.581200, -0.101116],
            [-0.149710, 2.581200, 0.101116],
            [-0.148475, 2.648000, -0.100316],
            [-0.148475, 2.648000, 0.100316],
            [-0.145291, 2.336130, -1.411910],
            [-0.145291, 2.336130, 1.411910],
            [-0.144103, 2.757420, -0.213159],
            [-0.144103, 2.757420, 0.213159],
            [-0.142705, 2.897170, -0.334238],
            [-0.142705, 2.897170, 0.334238],
            [-0.142000, 2.550000, -0.142000],
            [-0.142000, 2.550000, 0.142000],
            [-0.141789, 2.336130, -1.377880],
            [-0.141789, 2.336130, 1.377880],
            [-0.141630, 2.286910, -1.376330],
            [-0.141630, 2.286910, 1.376330],
            [-0.139898, 2.683590, -0.139898],
            [-0.139898, 2.683590, 0.139898],
            [-0.134407, 2.950780, -0.314464],
            [-0.134407, 2.950780, 0.314464],
            [-0.130448, 2.274900, -1.267660],
            [-0.130448, 2.274900, 1.267660],
            [-0.127984, 2.831250, -0.299953],
            [-0.127984, 2.831250, 0.299953],
            [-0.123125, 2.319430, -1.196510],
            [-0.123125, 2.319430, 1.196510],
            [-0.118458, 2.612400, -0.118458],
            [-0.118458, 2.612400, 0.118458],
            [-0.110649, 2.993410, -0.022778],
            [-0.110649, 2.993410, 0.022778],
            [-0.101116, 2.581200, -0.149710],
            [-0.101116, 2.581200, 0.149710],
            [-0.100920, 2.369530, -0.980719],
            [-0.100920, 2.369530, 0.980719],
            [-0.100316, 2.648000, -0.148475],
            [-0.100316, 2.648000, 0.148475],
            [-0.094147, 2.993410, -0.063797],
            [-0.094147, 2.993410, 0.063797],
            [-0.091207, 2.460940, -0.438241],
            [-0.091207, 2.460940, 0.438241],
            [-0.091113, 2.986820, -0.212516],
            [-0.091113, 2.986820, 0.212516],
            [-0.078500, 2.550000, -0.184500],
            [-0.078500, 2.550000, 0.184500],
            [-0.077405, 2.683590, -0.181661],
            [-0.077405, 2.683590, 0.181661],
            [-0.069278, 2.923970, -0.337859],
            [-0.069278, 2.923970, 0.337859],
            [-0.067672, 2.864210, -0.330325],
            [-0.067672, 2.864210, 0.330325],
            [-0.065504, 2.612400, -0.153882],
            [-0.065504, 2.612400, 0.153882],
            [-0.064825, 2.430470, -0.631998],
            [-0.064825, 2.430470, 0.631998],
            [-0.064395, 2.505470, -0.315410],
            [-0.064395, 2.505470, 0.315410],
            [-0.063797, 2.993410, -0.094147],
            [-0.063797, 2.993410, 0.094147],
            [-0.056380, 2.968800, -0.274421],
            [-0.056380, 2.968800, 0.274421],
            [-0.051347, 2.757420, -0.250872],
            [-0.051347, 2.757420, 0.250872],
            [-0.036001, 2.581200, -0.176295],
            [-0.036001, 2.581200, 0.176295],
            [-0.035727, 2.648000, -0.174804],
            [-0.035727, 2.648000, 0.174804],
            [-0.022778, 2.993410, -0.110649],
            [-0.022778, 2.993410, 0.110649],
            [0.000000, 0.000000, -1.500000],
            [0.000000, 0.000000, 1.500000],
            [0.000000, 0.085547, -1.578130],
            [0.000000, 0.085547, 1.578130],
            [0.000000, 0.234375, -1.750000],
            [0.000000, 0.234375, 1.750000],
            [0.000000, 0.453516, -1.921880],
            [0.000000, 0.453516, 1.921880],
            [0.000000, 0.591650, -1.978520],
            [0.000000, 0.591650, 1.978520],
            [0.000000, 0.750000, -2.000000],
            [0.000000, 0.750000, 2.000000],
            [0.000000, 1.100390, -1.957030],
            [0.000000, 1.100390, 1.957030],
            [0.000000, 1.471870, -1.843750],
            [0.000000, 1.471870, 1.843750],
            [0.000000, 2.250000, -1.500000],
            [0.000000, 2.250000, -1.400000],
            [0.000000, 2.250000, -1.300000],
            [0.000000, 2.250000, 1.300000],
            [0.000000, 2.250000, 1.400000],
            [0.000000, 2.250000, 1.500000],
            [0.000000, 2.299800, -1.260940],
            [0.000000, 2.299800, 1.260940],
            [0.000000, 2.323830, -1.449220],
            [0.000000, 2.323830, -1.380470],
            [0.000000, 2.323830, 1.380470],
            [0.000000, 2.323830, 1.449220],
            [0.000000, 2.339060, -1.156250],
            [0.000000, 2.339060, 1.156250],
            [0.000000, 2.348440, -1.403130],
            [0.000000, 2.348440, 1.403130],
            [0.000000, 2.400000, -0.825000],
            [0.000000, 2.400000, 0.825000],
            [0.000000, 2.460940, -0.456250],
            [0.000000, 2.460940, 0.456250],
            [0.000000, 2.550000, -0.200000],
            [0.000000, 2.550000, 0.200000],
            [0.000000, 2.612400, -0.166797],
            [0.000000, 2.612400, 0.166797],
            [0.000000, 2.683590, -0.196875],
            [0.000000, 2.683590, 0.196875],
            [0.000000, 2.831250, -0.325000],
            [0.000000, 2.831250, 0.325000],
            [0.000000, 2.897170, -0.362109],
            [0.000000, 2.897170, 0.362109],
            [0.000000, 2.950780, -0.340625],
            [0.000000, 2.950780, 0.340625],
            [0.000000, 2.986820, -0.230078],
            [0.000000, 2.986820, 0.230078],
            [0.000000, 3.000000, 0.000000],
            [0.022778, 2.993410, -0.110649],
            [0.022778, 2.993410, 0.110649],
            [0.035727, 2.648000, -0.174804],
            [0.035727, 2.648000, 0.174804],
            [0.036001, 2.581200, -0.176295],
            [0.036001, 2.581200, 0.176295],
            [0.051347, 2.757420, -0.250872],
            [0.051347, 2.757420, 0.250872],
            [0.056380, 2.968800, -0.274421],
            [0.056380, 2.968800, 0.274421],
            [0.063797, 2.993410, -0.094147],
            [0.063797, 2.993410, 0.094147],
            [0.064395, 2.505470, -0.315410],
            [0.064395, 2.505470, 0.315410],
            [0.064825, 2.430470, -0.631998],
            [0.064825, 2.430470, 0.631998],
            [0.065504, 2.612400, -0.153882],
            [0.065504, 2.612400, 0.153882],
            [0.067672, 2.864210, -0.330325],
            [0.067672, 2.864210, 0.330325],
            [0.069278, 2.923970, -0.337859],
            [0.069278, 2.923970, 0.337859],
            [0.077405, 2.683590, -0.181661],
            [0.077405, 2.683590, 0.181661],
            [0.078500, 2.550000, -0.184500],
            [0.078500, 2.550000, 0.184500],
            [0.091113, 2.986820, -0.212516],
            [0.091113, 2.986820, 0.212516],
            [0.091207, 2.460940, -0.438241],
            [0.091207, 2.460940, 0.438241],
            [0.094147, 2.993410, -0.063797],
            [0.094147, 2.993410, 0.063797],
            [0.100316, 2.648000, -0.148475],
            [0.100316, 2.648000, 0.148475],
            [0.100920, 2.369530, -0.980719],
            [0.100920, 2.369530, 0.980719],
            [0.101116, 2.581200, -0.149710],
            [0.101116, 2.581200, 0.149710],
            [0.110649, 2.993410, -0.022778],
            [0.110649, 2.993410, 0.022778],
            [0.118458, 2.612400, -0.118458],
            [0.118458, 2.612400, 0.118458],
            [0.123125, 2.319430, -1.196510],
            [0.123125, 2.319430, 1.196510],
            [0.127984, 2.831250, -0.299953],
            [0.127984, 2.831250, 0.299953],
            [0.130448, 2.274900, -1.267660],
            [0.130448, 2.274900, 1.267660],
            [0.134407, 2.950780, -0.314464],
            [0.134407, 2.950780, 0.314464],
            [0.139898, 2.683590, -0.139898],
            [0.139898, 2.683590, 0.139898],
            [0.141630, 2.286910, -1.376330],
            [0.141630, 2.286910, 1.376330],
            [0.141789, 2.336130, -1.377880],
            [0.141789, 2.336130, 1.377880],
            [0.142000, 2.550000, -0.142000],
            [0.142000, 2.550000, 0.142000],
            [0.142705, 2.897170, -0.334238],
            [0.142705, 2.897170, 0.334238],
            [0.144103, 2.757420, -0.213159],
            [0.144103, 2.757420, 0.213159],
            [0.145291, 2.336130, -1.411910],
            [0.145291, 2.336130, 1.411910],
            [0.148475, 2.648000, -0.100316],
            [0.148475, 2.648000, 0.100316],
            [0.149710, 2.581200, -0.101116],
            [0.149710, 2.581200, 0.101116],
            [0.150226, 2.286910, -1.459860],
            [0.150226, 2.286910, 1.459860],
            [0.153882, 2.612400, -0.065504],
            [0.153882, 2.612400, 0.065504],
            [0.156792, 0.042773, -1.523670],
            [0.156792, 0.042773, 1.523670],
            [0.158018, 2.968800, -0.233382],
            [0.158018, 2.968800, 0.233382],
            [0.164073, 2.986820, -0.164073],
            [0.164073, 2.986820, 0.164073],
            [0.166797, 2.612400, 0.000000],
            [0.168094, 2.400000, -0.808500],
            [0.168094, 2.400000, 0.808500],
            [0.169526, 0.159961, -1.647420],
            [0.169526, 0.159961, 1.647420],
            [0.170322, 1.860940, -1.655160],
            [0.170322, 1.860940, 1.655160],
            [0.174804, 2.648000, -0.035727],
            [0.174804, 2.648000, 0.035727],
            [0.176295, 2.581200, -0.036001],
            [0.176295, 2.581200, 0.036001],
            [0.179078, 2.460940, -0.420891],
            [0.179078, 2.460940, 0.420891],
            [0.180879, 2.505470, -0.267832],
            [0.180879, 2.505470, 0.267832],
            [0.181661, 2.683590, -0.077405],
            [0.181661, 2.683590, 0.077405],
            [0.184500, 2.550000, -0.078500],
            [0.184500, 2.550000, 0.078500],
            [0.187036, 0.343945, -1.817580],
            [0.187036, 0.343945, 1.817580],
            [0.189856, 2.864210, -0.280732],
            [0.189856, 2.864210, 0.280732],
            [0.190548, 2.430470, -0.607174],
            [0.190548, 2.430470, 0.607174],
            [0.193602, 1.286130, -1.881390],
            [0.193602, 1.286130, 1.881390],
            [0.194300, 2.923970, -0.287197],
            [0.194300, 2.923970, 0.287197],
            [0.196875, 2.683590, 0.000000],
            [0.198676, 0.522583, -1.930690],
            [0.198676, 0.522583, 1.930690],
            [0.200000, 2.550000, 0.000000],
            [0.201561, 0.925195, -1.958730],
            [0.201561, 0.925195, 1.958730],
            [0.202656, 0.670825, -1.969370],
            [0.202656, 0.670825, 1.969370],
            [0.212516, 2.986820, -0.091113],
            [0.212516, 2.986820, 0.091113],
            [0.213159, 2.757420, -0.144103],
            [0.213159, 2.757420, 0.144103],
            [0.230078, 2.986820, 0.000000],
            [0.231125, 2.831250, -0.231125],
            [0.231125, 2.831250, 0.231125],
            [0.233382, 2.968800, -0.158018],
            [0.233382, 2.968800, 0.158018],
            [0.235586, 2.339060, -1.133120],
            [0.235586, 2.339060, 1.133120],
            [0.242477, 2.950780, -0.242477],
            [0.242477, 2.950780, 0.242477],
            [0.250872, 2.757420, -0.051347],
            [0.250872, 2.757420, 0.051347],
            [0.251889, 2.460940, -0.372159],
            [0.251889, 2.460940, 0.372159],
            [0.256916, 2.299800, -1.235720],
            [0.256916, 2.299800, 1.235720],
            [0.257610, 2.897170, -0.257610],
            [0.257610, 2.897170, 0.257610],
            [0.264875, 2.250000, -1.274000],
            [0.264875, 2.250000, 1.274000],
            [0.267832, 2.505470, -0.180879],
            [0.267832, 2.505470, 0.180879],
            [0.274421, 2.968800, -0.056380],
            [0.274421, 2.968800, 0.056380],
            [0.280732, 2.864210, -0.189856],
            [0.280732, 2.864210, 0.189856],
            [0.281271, 2.323830, -1.352860],
            [0.281271, 2.323830, 1.352860],
            [0.285250, 2.250000, -1.372000],
            [0.285250, 2.250000, 1.372000],
            [0.285887, 2.348440, -1.375060],
            [0.285887, 2.348440, 1.375060],
            [0.287197, 2.923970, -0.194300],
            [0.287197, 2.923970, 0.194300],
            [0.295278, 2.323830, -1.420230],
            [0.295278, 2.323830, 1.420230],
            [0.295330, 2.369530, -0.942332],
            [0.295330, 2.369530, 0.942332],
            [0.299953, 2.831250, -0.127984],
            [0.299953, 2.831250, 0.127984],
            [0.304711, 2.430470, -0.559973],
            [0.304711, 2.430470, 0.559973],
            [0.305625, 0.000000, -1.470000],
            [0.305625, 0.000000, 1.470000],
            [0.305625, 2.250000, -1.470000],
            [0.305625, 2.250000, 1.470000],
            [0.314464, 2.950780, -0.134407],
            [0.314464, 2.950780, 0.134407],
            [0.315410, 2.505470, -0.064395],
            [0.315410, 2.505470, 0.064395],
            [0.321543, 0.085547, -1.546560],
            [0.321543, 0.085547, 1.546560],
            [0.323813, 2.400000, -0.761063],
            [0.323813, 2.400000, 0.761063],
            [0.323938, 2.460940, -0.323938],
            [0.323938, 2.460940, 0.323938],
            [0.325000, 2.831250, 0.000000],
            [0.330325, 2.864210, -0.067672],
            [0.330325, 2.864210, 0.067672],
            [0.334238, 2.897170, -0.142705],
            [0.334238, 2.897170, 0.142705],
            [0.337859, 2.923970, -0.069278],
            [0.337859, 2.923970, 0.069278],
            [0.340625, 2.950780, 0.000000],
            [0.356562, 0.234375, 1.715000],
            [0.356563, 0.234375, -1.715000],
            [0.360312, 2.319430, -1.149680],
            [0.360312, 2.319430, 1.149680],
            [0.362109, 2.897170, 0.000000],
            [0.372159, 2.460940, -0.251889],
            [0.372159, 2.460940, 0.251889],
            [0.375664, 1.471870, -1.806870],
            [0.375664, 1.471870, 1.806870],
            [0.381740, 2.274900, -1.218050],
            [0.381740, 2.274900, 1.218050],
            [0.391582, 0.453516, -1.883440],
            [0.391582, 0.453516, 1.883440],
            [0.398745, 1.100390, -1.917890],
            [0.398745, 1.100390, 1.917890],
            [0.403123, 0.591650, -1.938950],
            [0.403123, 0.591650, 1.938950],
            [0.406410, 2.430470, -0.491907],
            [0.406410, 2.430470, 0.491907],
            [0.407500, 0.750000, -1.960000],
            [0.407500, 0.750000, 1.960000],
            [0.414464, 2.286910, -1.322460],
            [0.414464, 2.286910, 1.322460],
            [0.414929, 2.336130, -1.323950],
            [0.414929, 2.336130, 1.323950],
            [0.420891, 2.460940, -0.179078],
            [0.420891, 2.460940, 0.179078],
            [0.425177, 2.336130, -1.356650],
            [0.425177, 2.336130, 1.356650],
            [0.438241, 2.460940, -0.091207],
            [0.438241, 2.460940, 0.091207],
            [0.439618, 2.286910, -1.402720],
            [0.439618, 2.286910, 1.402720],
            [0.453828, 2.339060, -1.066640],
            [0.453828, 2.339060, 1.066640],
            [0.456250, 2.460940, 0.000000],
            [0.458833, 0.042773, -1.464030],
            [0.458833, 0.042773, 1.464030],
            [0.464063, 2.400000, -0.685781],
            [0.464063, 2.400000, 0.685781],
            [0.473023, 2.369530, -0.868654],
            [0.473023, 2.369530, 0.868654],
            [0.491907, 2.430470, -0.406410],
            [0.491907, 2.430470, 0.406410],
            [0.494918, 2.299800, -1.163220],
            [0.494918, 2.299800, 1.163220],
            [0.496099, 0.159961, -1.582940],
            [0.496099, 0.159961, 1.582940],
            [0.498428, 1.860940, -1.590370],
            [0.498428, 1.860940, 1.590370],
            [0.510250, 2.250000, -1.199250],
            [0.510250, 2.250000, 1.199250],
            [0.541834, 2.323830, -1.273480],
            [0.541834, 2.323830, 1.273480],
            [0.547339, 0.343945, -1.746440],
            [0.547339, 0.343945, 1.746440],
            [0.549500, 2.250000, -1.291500],
            [0.549500, 2.250000, 1.291500],
            [0.550727, 2.348440, -1.294380],
            [0.550727, 2.348440, 1.294380],
            [0.559973, 2.430470, -0.304711],
            [0.559973, 2.430470, 0.304711],
            [0.566554, 1.286130, -1.807750],
            [0.566554, 1.286130, 1.807750],
            [0.568818, 2.323830, -1.336900],
            [0.568818, 2.323830, 1.336900],
            [0.577104, 2.319430, -1.059790],
            [0.577104, 2.319430, 1.059790],
            [0.581402, 0.522583, -1.855120],
            [0.581402, 0.522583, 1.855120],
            [0.585750, 2.400000, -0.585750],
            [0.585750, 2.400000, 0.585750],
            [0.588750, 0.000000, -1.383750],
            [0.588750, 0.000000, 1.383750],
            [0.588750, 2.250000, -1.383750],
            [0.588750, 2.250000, 1.383750],
            [0.589845, 0.925195, -1.882060],
            [0.589845, 0.925195, 1.882060],
            [0.593047, 0.670825, -1.892280],
            [0.593047, 0.670825, 1.892280],
            [0.607174, 2.430470, -0.190548],
            [0.607174, 2.430470, 0.190548],
            [0.611424, 2.274900, -1.122810],
            [0.611424, 2.274900, 1.122810],
            [0.619414, 0.085547, -1.455820],
            [0.619414, 0.085547, 1.455820],
            [0.630285, 2.369530, -0.763400],
            [0.630285, 2.369530, 0.763400],
            [0.631998, 2.430470, -0.064825],
            [0.631998, 2.430470, 0.064825],
            [0.650391, 2.339060, -0.961133],
            [0.650391, 2.339060, 0.961133],
            [0.663837, 2.286910, -1.219060],
            [0.663837, 2.286910, 1.219060],
            [0.664583, 2.336130, -1.220430],
            [0.664583, 2.336130, 1.220430],
            [0.680997, 2.336130, -1.250570],
            [0.680997, 2.336130, 1.250570],
            [0.685781, 2.400000, -0.464063],
            [0.685781, 2.400000, 0.464063],
            [0.686875, 0.234375, -1.614370],
            [0.686875, 0.234375, 1.614370],
            [0.704126, 2.286910, -1.293050],
            [0.704126, 2.286910, 1.293050],
            [0.709277, 2.299800, -1.048150],
            [0.709277, 2.299800, 1.048150],
            [0.723672, 1.471870, -1.700860],
            [0.723672, 1.471870, 1.700860],
            [0.731250, 2.250000, -1.080630],
            [0.731250, 2.250000, 1.080630],
            [0.734902, 0.042773, -1.349570],
            [0.734902, 0.042773, 1.349570],
            [0.754336, 0.453516, -1.772930],
            [0.754336, 0.453516, 1.772930],
            [0.761063, 2.400000, -0.323813],
            [0.761063, 2.400000, 0.323813],
            [0.763400, 2.369530, -0.630285],
            [0.763400, 2.369530, 0.630285],
            [0.768135, 1.100390, -1.805360],
            [0.768135, 1.100390, 1.805360],
            [0.768968, 2.319430, -0.931373],
            [0.768968, 2.319430, 0.931373],
            [0.776514, 2.323830, -1.147520],
            [0.776514, 2.323830, 1.147520],
            [0.776567, 0.591650, -1.825180],
            [0.776567, 0.591650, 1.825180],
            [0.785000, 0.750000, -1.845000],
            [0.785000, 0.750000, 1.845000],
            [0.787500, 2.250000, -1.163750],
            [0.787500, 2.250000, 1.163750],
            [0.789258, 2.348440, -1.166350],
            [0.789258, 2.348440, 1.166350],
            [0.794590, 0.159961, -1.459170],
            [0.794590, 0.159961, 1.459170],
            [0.798320, 1.860940, -1.466020],
            [0.798320, 1.860940, 1.466020],
            [0.808500, 2.400000, -0.168094],
            [0.808500, 2.400000, 0.168094],
            [0.814698, 2.274900, -0.986761],
            [0.814698, 2.274900, 0.986761],
            [0.815186, 2.323830, -1.204660],
            [0.815186, 2.323830, 1.204660],
            [0.820938, 2.339060, -0.820938],
            [0.820938, 2.339060, 0.820938],
            [0.825000, 2.400000, 0.000000],
            [0.843750, 0.000000, -1.246880],
            [0.843750, 0.000000, 1.246880],
            [0.843750, 2.250000, -1.246880],
            [0.843750, 2.250000, 1.246880],
            [0.868654, 2.369530, -0.473023],
            [0.868654, 2.369530, 0.473023],
            [0.876660, 0.343945, -1.609890],
            [0.876660, 0.343945, 1.609890],
            [0.884537, 2.286910, -1.071350],
            [0.884537, 2.286910, 1.071350],
            [0.885531, 2.336130, -1.072550],
            [0.885531, 2.336130, 1.072550],
            [0.887695, 0.085547, -1.311820],
            [0.887695, 0.085547, 1.311820],
            [0.895266, 2.299800, -0.895266],
            [0.895266, 2.299800, 0.895266],
            [0.907402, 2.336130, -1.099040],
            [0.907402, 2.336130, 1.099040],
            [0.907437, 1.286130, -1.666400],
            [0.907437, 1.286130, 1.666400],
            [0.923000, 2.250000, -0.923000],
            [0.923000, 2.250000, 0.923000],
            [0.931218, 0.522583, -1.710080],
            [0.931218, 0.522583, 1.710080],
            [0.931373, 2.319430, -0.768968],
            [0.931373, 2.319430, 0.768968],
            [0.938220, 2.286910, -1.136370],
            [0.938220, 2.286910, 1.136370],
            [0.942332, 2.369530, -0.295330],
            [0.942332, 2.369530, 0.295330],
            [0.944741, 0.925195, -1.734910],
            [0.944741, 0.925195, 1.734910],
            [0.949871, 0.670825, -1.744330],
            [0.949871, 0.670825, 1.744330],
            [0.961133, 2.339060, -0.650391],
            [0.961133, 2.339060, 0.650391],
            [0.979229, 0.042773, -1.186040],
            [0.979229, 0.042773, 1.186040],
            [0.980133, 2.323830, -0.980133],
            [0.980133, 2.323830, 0.980133],
            [0.980719, 2.369530, -0.100920],
            [0.980719, 2.369530, 0.100920],
            [0.984375, 0.234375, -1.454690],
            [0.984375, 0.234375, 1.454690],
            [0.986761, 2.274900, -0.814698],
            [0.986761, 2.274900, 0.814698],
            [0.994000, 2.250000, -0.994000],
            [0.994000, 2.250000, 0.994000],
            [0.996219, 2.348440, -0.996219],
            [0.996219, 2.348440, 0.996219],
            [1.028940, 2.323830, -1.028940],
            [1.028940, 2.323830, 1.028940],
            [1.037110, 1.471870, -1.532620],
            [1.037110, 1.471870, 1.532620],
            [1.048150, 2.299800, -0.709277],
            [1.048150, 2.299800, 0.709277],
            [1.058760, 0.159961, -1.282370],
            [1.058760, 0.159961, 1.282370],
            [1.059790, 2.319430, -0.577104],
            [1.059790, 2.319430, 0.577104],
            [1.063730, 1.860940, -1.288390],
            [1.063730, 1.860940, 1.288390],
            [1.065000, 0.000000, -1.065000],
            [1.065000, 0.000000, 1.065000],
            [1.065000, 2.250000, -1.065000],
            [1.065000, 2.250000, 1.065000],
            [1.066640, 2.339060, -0.453828],
            [1.066640, 2.339060, 0.453828],
            [1.071350, 2.286910, -0.884537],
            [1.071350, 2.286910, 0.884537],
            [1.072550, 2.336130, -0.885531],
            [1.072550, 2.336130, 0.885531],
            [1.080630, 2.250000, -0.731250],
            [1.080630, 2.250000, 0.731250],
            [1.081060, 0.453516, -1.597560],
            [1.081060, 0.453516, 1.597560],
            [1.099040, 2.336130, -0.907402],
            [1.099040, 2.336130, 0.907402],
            [1.100830, 1.100390, -1.626780],
            [1.100830, 1.100390, 1.626780],
            [1.112920, 0.591650, -1.644640],
            [1.112920, 0.591650, 1.644640],
            [1.120470, 0.085547, -1.120470],
            [1.120470, 0.085547, 1.120470],
            [1.122810, 2.274900, -0.611424],
            [1.122810, 2.274900, 0.611424],
            [1.125000, 0.750000, -1.662500],
            [1.125000, 0.750000, 1.662500],
            [1.133120, 2.339060, -0.235586],
            [1.133120, 2.339060, 0.235586],
            [1.136370, 2.286910, -0.938220],
            [1.136370, 2.286910, 0.938220],
            [1.147520, 2.323830, -0.776514],
            [1.147520, 2.323830, 0.776514],
            [1.149680, 2.319430, -0.360312],
            [1.149680, 2.319430, 0.360312],
            [1.156250, 2.339060, 0.000000],
            [1.163220, 2.299800, -0.494918],
            [1.163220, 2.299800, 0.494918],
            [1.163750, 2.250000, -0.787500],
            [1.163750, 2.250000, 0.787500],
            [1.166350, 2.348440, -0.789258],
            [1.166350, 2.348440, 0.789258],
            [1.168120, 0.343945, -1.414820],
            [1.168120, 0.343945, 1.414820],
            [1.186040, 0.042773, -0.979229],
            [1.186040, 0.042773, 0.979229],
            [1.196510, 2.319430, -0.123125],
            [1.196510, 2.319430, 0.123125],
            [1.199250, 2.250000, -0.510250],
            [1.199250, 2.250000, 0.510250],
            [1.204660, 2.323830, -0.815186],
            [1.204660, 2.323830, 0.815186],
            [1.209120, 1.286130, -1.464490],
            [1.209120, 1.286130, 1.464490],
            [1.218050, 2.274900, -0.381740],
            [1.218050, 2.274900, 0.381740],
            [1.219060, 2.286910, -0.663837],
            [1.219060, 2.286910, 0.663837],
            [1.220430, 2.336130, -0.664583],
            [1.220430, 2.336130, 0.664583],
            [1.235720, 2.299800, -0.256916],
            [1.235720, 2.299800, 0.256916],
            [1.240810, 0.522583, -1.502870],
            [1.240810, 0.522583, 1.502870],
            [1.242500, 0.234375, -1.242500],
            [1.242500, 0.234375, 1.242500],
            [1.246880, 0.000000, -0.843750],
            [1.246880, 0.000000, 0.843750],
            [1.246880, 2.250000, -0.843750],
            [1.246880, 2.250000, 0.843750],
            [1.250570, 2.336130, -0.680997],
            [1.250570, 2.336130, 0.680997],
            [1.258830, 0.925195, -1.524690],
            [1.258830, 0.925195, 1.524690],
            [1.260940, 2.299800, 0.000000],
            [1.265670, 0.670825, -1.532970],
            [1.265670, 0.670825, 1.532970],
            [1.267660, 2.274900, -0.130448],
            [1.267660, 2.274900, 0.130448],
            [1.273480, 2.323830, -0.541834],
            [1.273480, 2.323830, 0.541834],
            [1.274000, 2.250000, -0.264875],
            [1.274000, 2.250000, 0.264875],
            [1.282370, 0.159961, -1.058760],
            [1.282370, 0.159961, 1.058760],
            [1.288390, 1.860940, -1.063730],
            [1.288390, 1.860940, 1.063730],
            [1.291500, 2.250000, -0.549500],
            [1.291500, 2.250000, 0.549500],
            [1.293050, 2.286910, -0.704126],
            [1.293050, 2.286910, 0.704126],
            [1.294380, 2.348440, -0.550727],
            [1.294380, 2.348440, 0.550727],
            [1.300000, 2.250000, 0.000000],
            [1.309060, 1.471870, -1.309060],
            [1.309060, 1.471870, 1.309060],
            [1.311820, 0.085547, -0.887695],
            [1.311820, 0.085547, 0.887695],
            [1.322460, 2.286910, -0.414464],
            [1.322460, 2.286910, 0.414464],
            [1.323950, 2.336130, -0.414929],
            [1.323950, 2.336130, 0.414929],
            [1.336900, 2.323830, -0.568818],
            [1.336900, 2.323830, 0.568818],
            [1.349570, 0.042773, -0.734902],
            [1.349570, 0.042773, 0.734902],
            [1.352860, 2.323830, -0.281271],
            [1.352860, 2.323830, 0.281271],
            [1.356650, 2.336130, -0.425177],
            [1.356650, 2.336130, 0.425177],
            [1.364530, 0.453516, -1.364530],
            [1.364530, 0.453516, 1.364530],
            [1.372000, 2.250000, -0.285250],
            [1.372000, 2.250000, 0.285250],
            [1.375060, 2.348440, -0.285887],
            [1.375060, 2.348440, 0.285887],
            [1.376330, 2.286910, -0.141630],
            [1.376330, 2.286910, 0.141630],
            [1.377880, 2.336130, -0.141789],
            [1.377880, 2.336130, 0.141789],
            [1.380470, 2.323830, 0.000000],
            [1.383750, 0.000000, -0.588750],
            [1.383750, 0.000000, 0.588750],
            [1.383750, 2.250000, -0.588750],
            [1.383750, 2.250000, 0.588750],
            [1.389490, 1.100390, -1.389490],
            [1.389490, 1.100390, 1.389490],
            [1.400000, 2.250000, 0.000000],
            [1.402720, 2.286910, -0.439618],
            [1.402720, 2.286910, 0.439618],
            [1.403130, 2.348440, 0.000000],
            [1.404750, 0.591650, -1.404750],
            [1.404750, 0.591650, 1.404750],
            [1.411910, 2.336130, -0.145291],
            [1.411910, 2.336130, 0.145291],
            [1.414820, 0.343945, -1.168120],
            [1.414820, 0.343945, 1.168120],
            [1.420000, 0.750000, -1.420000],
            [1.420000, 0.750000, 1.420000],
            [1.420230, 2.323830, -0.295278],
            [1.420230, 2.323830, 0.295278],
            [1.449220, 2.323830, 0.000000],
            [1.454690, 0.234375, -0.984375],
            [1.454690, 0.234375, 0.984375],
            [1.455820, 0.085547, -0.619414],
            [1.455820, 0.085547, 0.619414],
            [1.459170, 0.159961, -0.794590],
            [1.459170, 0.159961, 0.794590],
            [1.459860, 2.286910, -0.150226],
            [1.459860, 2.286910, 0.150226],
            [1.464030, 0.042773, -0.458833],
            [1.464030, 0.042773, 0.458833],
            [1.464490, 1.286130, -1.209120],
            [1.464490, 1.286130, 1.209120],
            [1.466020, 1.860940, -0.798320],
            [1.466020, 1.860940, 0.798320],
            [1.470000, 0.000000, -0.305625],
            [1.470000, 0.000000, 0.305625],
            [1.470000, 2.250000, -0.305625],
            [1.470000, 2.250000, 0.305625],
            [1.500000, 0.000000, 0.000000],
            [1.500000, 2.250000, 0.000000],
            [1.502870, 0.522583, -1.240810],
            [1.502870, 0.522583, 1.240810],
            [1.523670, 0.042773, -0.156792],
            [1.523670, 0.042773, 0.156792],
            [1.524690, 0.925195, -1.258830],
            [1.524690, 0.925195, 1.258830],
            [1.532620, 1.471870, -1.037110],
            [1.532620, 1.471870, 1.037110],
            [1.532970, 0.670825, -1.265670],
            [1.532970, 0.670825, 1.265670],
            [1.546560, 0.085547, -0.321543],
            [1.546560, 0.085547, 0.321543],
            [1.578130, 0.085547, 0.000000],
            [1.582940, 0.159961, -0.496099],
            [1.582940, 0.159961, 0.496099],
            [1.590370, 1.860940, -0.498428],
            [1.590370, 1.860940, 0.498428],
            [1.597560, 0.453516, -1.081060],
            [1.597560, 0.453516, 1.081060],
            [1.609890, 0.343945, -0.876660],
            [1.609890, 0.343945, 0.876660],
            [1.614370, 0.234375, -0.686875],
            [1.614370, 0.234375, 0.686875],
            [1.626780, 1.100390, -1.100830],
            [1.626780, 1.100390, 1.100830],
            [1.644640, 0.591650, -1.112920],
            [1.644640, 0.591650, 1.112920],
            [1.647420, 0.159961, -0.169526],
            [1.647420, 0.159961, 0.169526],
            [1.655160, 1.860940, -0.170322],
            [1.655160, 1.860940, 0.170322],
            [1.662500, 0.750000, -1.125000],
            [1.662500, 0.750000, 1.125000],
            [1.666400, 1.286130, -0.907437],
            [1.666400, 1.286130, 0.907437],
            [1.700000, 0.450000, 0.000000],
            [1.700000, 0.485449, -0.216563],
            [1.700000, 0.485449, 0.216563],
            [1.700000, 0.578906, -0.371250],
            [1.700000, 0.578906, 0.371250],
            [1.700000, 0.711035, -0.464063],
            [1.700000, 0.711035, 0.464063],
            [1.700000, 0.862500, -0.495000],
            [1.700000, 0.862500, 0.495000],
            [1.700000, 1.013970, -0.464063],
            [1.700000, 1.013970, 0.464063],
            [1.700000, 1.146090, -0.371250],
            [1.700000, 1.146090, 0.371250],
            [1.700000, 1.239550, -0.216563],
            [1.700000, 1.239550, 0.216563],
            [1.700000, 1.275000, 0.000000],
            [1.700860, 1.471870, -0.723672],
            [1.700860, 1.471870, 0.723672],
            [1.710080, 0.522583, -0.931218],
            [1.710080, 0.522583, 0.931218],
            [1.715000, 0.234375, -0.356562],
            [1.715000, 0.234375, 0.356563],
            [1.734910, 0.925195, -0.944741],
            [1.734910, 0.925195, 0.944741],
            [1.744330, 0.670825, -0.949871],
            [1.744330, 0.670825, 0.949871],
            [1.746440, 0.343945, -0.547339],
            [1.746440, 0.343945, 0.547339],
            [1.750000, 0.234375, 0.000000],
            [1.772930, 0.453516, -0.754336],
            [1.772930, 0.453516, 0.754336],
            [1.805360, 1.100390, -0.768135],
            [1.805360, 1.100390, 0.768135],
            [1.806870, 1.471870, -0.375664],
            [1.806870, 1.471870, 0.375664],
            [1.807750, 1.286130, -0.566554],
            [1.807750, 1.286130, 0.566554],
            [1.808680, 0.669440, -0.415335],
            [1.808680, 0.669440, 0.415335],
            [1.815230, 0.556498, -0.292881],
            [1.815230, 0.556498, 0.292881],
            [1.817580, 0.343945, -0.187036],
            [1.817580, 0.343945, 0.187036],
            [1.818500, 0.493823, -0.107904],
            [1.818500, 0.493823, 0.107904],
            [1.825180, 0.591650, -0.776567],
            [1.825180, 0.591650, 0.776567],
            [1.843750, 1.471870, 0.000000],
            [1.844080, 1.273110, -0.106836],
            [1.844080, 1.273110, 0.106836],
            [1.845000, 0.750000, -0.785000],
            [1.845000, 0.750000, 0.785000],
            [1.849890, 1.212450, -0.289984],
            [1.849890, 1.212450, 0.289984],
            [1.855120, 0.522583, -0.581402],
            [1.855120, 0.522583, 0.581402],
            [1.860070, 1.106280, -0.412082],
            [1.860070, 1.106280, 0.412082],
            [1.872860, 0.972820, -0.473131],
            [1.872860, 0.972820, 0.473131],
            [1.881390, 1.286130, -0.193602],
            [1.881390, 1.286130, 0.193602],
            [1.882060, 0.925195, -0.589845],
            [1.882060, 0.925195, 0.589845],
            [1.883440, 0.453516, -0.391582],
            [1.883440, 0.453516, 0.391582],
            [1.886520, 0.830257, -0.473131],
            [1.886520, 0.830257, 0.473131],
            [1.892280, 0.670825, -0.593047],
            [1.892280, 0.670825, 0.593047],
            [1.908980, 0.762851, -0.457368],
            [1.908980, 0.762851, 0.457368],
            [1.917890, 1.100390, -0.398745],
            [1.917890, 1.100390, 0.398745],
            [1.921880, 0.453516, 0.000000],
            [1.925720, 0.624968, -0.368660],
            [1.925720, 0.624968, 0.368660],
            [1.930690, 0.522583, -0.198676],
            [1.930690, 0.522583, 0.198676],
            [1.935200, 0.536667, -0.215052],
            [1.935200, 0.536667, 0.215052],
            [1.938790, 0.503174, 0.000000],
            [1.938950, 0.591650, -0.403123],
            [1.938950, 0.591650, 0.403123],
            [1.957030, 1.100390, 0.000000],
            [1.958730, 0.925195, -0.201561],
            [1.958730, 0.925195, 0.201561],
            [1.960000, 0.750000, -0.407500],
            [1.960000, 0.750000, 0.407500],
            [1.969370, 0.670825, -0.202656],
            [1.969370, 0.670825, 0.202656],
            [1.978520, 0.591650, 0.000000],
            [1.984960, 1.304590, 0.000000],
            [1.991360, 1.273310, -0.210782],
            [1.991360, 1.273310, 0.210782],
            [2.000000, 0.750000, 0.000000],
            [2.007990, 0.721263, -0.409761],
            [2.007990, 0.721263, 0.409761],
            [2.008210, 1.190840, -0.361340],
            [2.008210, 1.190840, 0.361340],
            [2.024710, 0.614949, -0.288958],
            [2.024710, 0.614949, 0.288958],
            [2.032050, 1.074240, -0.451675],
            [2.032050, 1.074240, 0.451675],
            [2.033790, 0.556062, -0.106458],
            [2.033790, 0.556062, 0.106458],
            [2.059380, 0.940576, -0.481787],
            [2.059380, 0.940576, 0.481787],
            [2.086440, 1.330480, -0.101581],
            [2.086440, 1.330480, 0.101581],
            [2.086700, 0.806915, -0.451675],
            [2.086700, 0.806915, 0.451675],
            [2.101410, 1.278150, -0.275720],
            [2.101410, 1.278150, 0.275720],
            [2.110530, 0.690317, -0.361340],
            [2.110530, 0.690317, 0.361340],
            [2.127390, 0.607845, -0.210782],
            [2.127390, 0.607845, 0.210782],
            [2.127600, 1.186560, -0.391812],
            [2.127600, 1.186560, 0.391812],
            [2.133790, 0.576563, 0.000000],
            [2.160540, 1.071430, -0.449859],
            [2.160540, 1.071430, 0.449859],
            [2.169220, 0.790259, -0.399360],
            [2.169220, 0.790259, 0.399360],
            [2.179690, 1.385160, 0.000000],
            [2.189760, 1.358870, -0.195542],
            [2.189760, 1.358870, 0.195542],
            [2.194810, 0.691761, -0.281559],
            [2.194810, 0.691761, 0.281559],
            [2.195710, 0.948444, -0.449859],
            [2.195710, 0.948444, 0.449859],
            [2.208370, 0.637082, -0.103732],
            [2.208370, 0.637082, 0.103732],
            [2.216310, 1.289570, -0.335215],
            [2.216310, 1.289570, 0.335215],
            [2.220200, 0.891314, -0.434457],
            [2.220200, 0.891314, 0.434457],
            [2.248570, 1.433000, -0.092384],
            [2.248570, 1.433000, 0.092384],
            [2.253840, 1.191600, -0.419019],
            [2.253840, 1.191600, 0.419019],
            [2.259440, 0.772489, -0.349967],
            [2.259440, 0.772489, 0.349967],
            [2.268570, 1.390160, -0.250758],
            [2.268570, 1.390160, 0.250758],
            [2.281890, 0.696393, -0.204147],
            [2.281890, 0.696393, 0.204147],
            [2.290410, 0.667529, 0.000000],
            [2.296880, 1.079300, -0.446953],
            [2.296880, 1.079300, 0.446953],
            [2.299250, 0.874953, -0.384664],
            [2.299250, 0.874953, 0.384664],
            [2.303580, 1.315200, -0.356340],
            [2.303580, 1.315200, 0.356340],
            [2.306440, 1.504400, 0.000000],
            [2.318380, 1.483560, -0.173996],
            [2.318380, 1.483560, 0.173996],
            [2.330690, 0.784406, -0.271218],
            [2.330690, 0.784406, 0.271218],
            [2.339910, 0.966989, -0.419019],
            [2.339910, 0.966989, 0.419019],
            [2.347590, 0.734271, -0.099922],
            [2.347590, 0.734271, 0.099922],
            [2.347590, 1.220960, -0.409131],
            [2.347590, 1.220960, 0.409131],
            [2.349840, 1.428640, -0.298279],
            [2.349840, 1.428640, 0.298279],
            [2.353180, 1.568160, -0.080823],
            [2.353180, 1.568160, 0.080823],
            [2.375750, 1.535310, -0.219377],
            [2.375750, 1.535310, 0.219377],
            [2.377440, 0.869019, -0.335215],
            [2.377440, 0.869019, 0.335215],
            [2.387500, 1.650000, 0.000000],
            [2.394320, 1.350980, -0.372849],
            [2.394320, 1.350980, 0.372849],
            [2.394600, 1.120300, -0.409131],
            [2.394600, 1.120300, 0.409131],
            [2.400390, 1.634690, -0.149297],
            [2.400390, 1.634690, 0.149297],
            [2.403990, 0.799722, -0.195542],
            [2.403990, 0.799722, 0.195542],
            [2.414060, 0.773438, 0.000000],
            [2.415240, 1.477810, -0.311747],
            [2.415240, 1.477810, 0.311747],
            [2.434380, 1.594340, -0.255938],
            [2.434380, 1.594340, 0.255938],
            [2.438610, 1.026060, -0.356340],
            [2.438610, 1.026060, 0.356340],
            [2.445310, 1.261960, -0.397705],
            [2.445310, 1.261960, 0.397705],
            [2.451680, 1.805340, -0.063087],
            [2.451680, 1.805340, 0.063087],
            [2.464890, 1.405520, -0.357931],
            [2.464890, 1.405520, 0.357931],
            [2.473620, 0.951099, -0.250758],
            [2.473620, 0.951099, 0.250758],
            [2.477680, 1.786380, -0.171237],
            [2.477680, 1.786380, 0.171237],
            [2.482420, 1.537280, -0.319922],
            [2.482420, 1.537280, 0.319922],
            [2.493620, 0.908264, -0.092384],
            [2.493620, 0.908264, 0.092384],
            [2.496300, 1.172950, -0.372849],
            [2.496300, 1.172950, 0.372849],
            [2.501560, 1.971090, 0.000000],
            [2.517270, 1.965550, -0.103052],
            [2.517270, 1.965550, 0.103052],
            [2.517920, 1.328310, -0.357931],
            [2.517920, 1.328310, 0.357931],
            [2.523180, 1.753220, -0.243336],
            [2.523180, 1.753220, 0.243336],
            [2.537500, 1.471870, -0.341250],
            [2.537500, 1.471870, 0.341250],
            [2.540780, 1.095290, -0.298279],
            [2.540780, 1.095290, 0.298279],
            [2.549110, 2.044640, -0.047716],
            [2.549110, 2.044640, 0.047716],
            [2.558690, 1.950950, -0.176660],
            [2.558690, 1.950950, 0.176660],
            [2.567570, 1.256030, -0.311747],
            [2.567570, 1.256030, 0.311747],
            [2.572250, 1.040360, -0.173996],
            [2.572250, 1.040360, 0.173996],
            [2.579100, 2.121970, 0.000000],
            [2.580390, 1.711530, -0.279386],
            [2.580390, 1.711530, 0.279386],
            [2.581010, 2.037730, -0.129515],
            [2.581010, 2.037730, 0.129515],
            [2.584180, 1.019530, 0.000000],
            [2.592580, 1.406470, -0.319922],
            [2.592580, 1.406470, 0.319922],
            [2.598490, 2.119920, -0.087812],
            [2.598490, 2.119920, 0.087812],
            [2.601780, 1.554720, -0.304019],
            [2.601780, 1.554720, 0.304019],
            [2.607070, 1.198530, -0.219377],
            [2.607070, 1.198530, 0.219377],
            [2.611620, 1.691280, -0.287908],
            [2.611620, 1.691280, 0.287908],
            [2.617250, 1.930310, -0.220825],
            [2.617250, 1.930310, 0.220825],
            [2.629630, 1.165680, -0.080823],
            [2.629630, 1.165680, 0.080823],
            [2.637880, 2.025550, -0.180818],
            [2.637880, 2.025550, 0.180818],
            [2.640630, 1.349410, -0.255938],
            [2.640630, 1.349410, 0.255938],
            [2.649600, 2.114510, -0.150535],
            [2.649600, 2.114510, 0.150535],
            [2.650840, 2.185470, -0.042461],
            [2.650840, 2.185470, 0.042461],
            [2.653910, 1.504200, -0.264113],
            [2.653910, 1.504200, 0.264113],
            [2.665420, 1.649250, -0.266995],
            [2.665420, 1.649250, 0.266995],
            [2.674610, 1.309060, -0.149297],
            [2.674610, 1.309060, 0.149297],
            [2.678230, 1.782540, -0.252819],
            [2.678230, 1.782540, 0.252819],
            [2.684380, 1.906640, -0.235547],
            [2.684380, 1.906640, 0.235547],
            [2.687500, 1.293750, 0.000000],
            [2.691900, 2.183610, -0.115251],
            [2.691900, 2.183610, 0.115251],
            [2.696450, 1.463800, -0.185857],
            [2.696450, 1.463800, 0.185857],
            [2.700000, 2.250000, 0.000000],
            [2.708080, 2.010370, -0.208084],
            [2.708080, 2.010370, 0.208084],
            [2.717030, 1.611670, -0.213596],
            [2.717030, 1.611670, 0.213596],
            [2.720760, 1.440720, -0.068474],
            [2.720760, 1.440720, 0.068474],
            [2.725780, 2.250000, -0.082031],
            [2.725780, 2.250000, 0.082031],
            [2.725990, 2.106430, -0.175250],
            [2.725990, 2.106430, 0.175250],
            [2.736000, 1.751550, -0.219519],
            [2.736000, 1.751550, 0.219519],
            [2.750210, 2.269190, -0.039734],
            [2.750210, 2.269190, 0.039734],
            [2.751500, 1.882970, -0.220825],
            [2.751500, 1.882970, 0.220825],
            [2.753540, 1.585080, -0.124598],
            [2.753540, 1.585080, 0.124598],
            [2.767380, 1.575000, 0.000000],
            [2.775560, 2.284000, 0.000000],
            [2.780990, 1.994370, -0.208084],
            [2.780990, 1.994370, 0.208084],
            [2.783030, 1.726700, -0.154476],
            [2.783030, 1.726700, 0.154476],
            [2.793750, 2.250000, -0.140625],
            [2.793750, 2.250000, 0.140625],
            [2.797820, 2.271750, -0.107849],
            [2.797820, 2.271750, 0.107849],
            [2.799490, 2.292750, -0.076904],
            [2.799490, 2.292750, 0.076904],
            [2.800000, 2.250000, 0.000000],
            [2.804690, 2.098100, -0.200713],
            [2.804690, 2.098100, 0.200713],
            [2.809900, 1.712500, -0.056912],
            [2.809900, 1.712500, 0.056912],
            [2.810060, 1.862330, -0.176660],
            [2.810060, 1.862330, 0.176660],
            [2.812010, 2.178150, -0.169843],
            [2.812010, 2.178150, 0.169843],
            [2.812740, 2.297540, -0.035632],
            [2.812740, 2.297540, 0.035632],
            [2.817190, 2.250000, -0.049219],
            [2.817190, 2.250000, 0.049219],
            [2.825000, 2.306250, 0.000000],
            [2.830110, 2.271290, -0.025891],
            [2.830110, 2.271290, 0.025891],
            [2.840630, 2.292190, 0.000000],
            [2.844790, 2.299640, -0.029993],
            [2.844790, 2.299640, 0.029993],
            [2.850920, 2.307160, -0.065625],
            [2.850920, 2.307160, 0.065625],
            [2.851180, 1.979190, -0.180818],
            [2.851180, 1.979190, 0.180818],
            [2.851480, 1.847730, -0.103052],
            [2.851480, 1.847730, 0.103052],
            [2.860480, 2.300930, -0.096716],
            [2.860480, 2.300930, 0.096716],
            [2.862500, 2.250000, -0.084375],
            [2.862500, 2.250000, 0.084375],
            [2.862630, 2.292980, -0.054346],
            [2.862630, 2.292980, 0.054346],
            [2.865740, 2.272010, -0.070276],
            [2.865740, 2.272010, 0.070276],
            [2.867190, 1.842190, 0.000000],
            [2.872280, 2.294250, -0.131836],
            [2.872280, 2.294250, 0.131836],
            [2.883390, 2.089770, -0.175250],
            [2.883390, 2.089770, 0.175250],
            [2.888360, 2.301190, -0.081409],
            [2.888360, 2.301190, 0.081409],
            [2.898270, 2.170880, -0.194382],
            [2.898270, 2.170880, 0.194382],
            [2.908050, 1.967000, -0.129515],
            [2.908050, 1.967000, 0.129515],
            [2.919240, 2.309550, -0.112500],
            [2.919240, 2.309550, 0.112500],
            [2.920640, 2.295070, -0.093164],
            [2.920640, 2.295070, 0.093164],
            [2.932790, 2.131030, -0.172211],
            [2.932790, 2.131030, 0.172211],
            [2.939800, 2.273260, -0.158936],
            [2.939800, 2.273260, 0.158936],
            [2.939960, 1.960100, -0.047716],
            [2.939960, 1.960100, 0.047716],
            [2.959780, 2.081680, -0.150535],
            [2.959780, 2.081680, 0.150535],
            [2.969950, 2.274120, -0.103564],
            [2.969950, 2.274120, 0.103564],
            [3.000000, 2.250000, -0.187500],
            [3.000000, 2.250000, -0.112500],
            [3.000000, 2.250000, 0.112500],
            [3.000000, 2.250000, 0.187500],
            [3.002810, 2.304840, -0.142529],
            [3.002810, 2.304840, 0.142529],
            [3.010890, 2.076270, -0.087812],
            [3.010890, 2.076270, 0.087812],
            [3.015780, 2.305710, -0.119971],
            [3.015780, 2.305710, 0.119971],
            [3.030270, 2.074220, 0.000000],
            [3.041500, 2.125670, -0.116276],
            [3.041500, 2.125670, 0.116276],
            [3.043230, 2.211080, -0.166431],
            [3.043230, 2.211080, 0.166431],
            [3.068420, 2.173450, -0.143215],
            [3.068420, 2.173450, 0.143215],
            [3.079290, 2.123060, -0.042838],
            [3.079290, 2.123060, 0.042838],
            [3.093160, 2.298780, -0.175781],
            [3.093160, 2.298780, 0.175781],
            [3.096680, 2.301420, -0.124219],
            [3.096680, 2.301420, 0.124219],
            [3.126560, 2.316800, -0.150000],
            [3.126560, 2.316800, 0.150000],
            [3.126720, 2.277290, -0.103564],
            [3.126720, 2.277290, 0.103564],
            [3.126910, 2.171280, -0.083542],
            [3.126910, 2.171280, 0.083542],
            [3.137500, 2.250000, -0.084375],
            [3.137500, 2.250000, 0.084375],
            [3.149100, 2.170460, 0.000000],
            [3.153370, 2.275520, -0.158936],
            [3.153370, 2.275520, 0.158936],
            [3.168950, 2.211180, -0.112353],
            [3.168950, 2.211180, 0.112353],
            [3.182810, 2.250000, -0.049219],
            [3.182810, 2.250000, 0.049219],
            [3.200000, 2.250000, 0.000000],
            [3.206250, 2.250000, -0.140625],
            [3.206250, 2.250000, 0.140625],
            [3.207460, 2.312510, -0.119971],
            [3.207460, 2.312510, 0.119971],
            [3.212560, 2.210430, -0.041393],
            [3.212560, 2.210430, 0.041393],
            [3.216920, 2.310730, -0.142529],
            [3.216920, 2.310730, 0.142529],
            [3.230940, 2.279400, -0.070276],
            [3.230940, 2.279400, 0.070276],
            [3.267240, 2.278140, -0.025891],
            [3.267240, 2.278140, 0.025891],
            [3.272720, 2.307760, -0.093164],
            [3.272720, 2.307760, 0.093164],
            [3.274220, 2.250000, -0.082031],
            [3.274220, 2.250000, 0.082031],
            [3.295340, 2.277030, -0.107849],
            [3.295340, 2.277030, 0.107849],
            [3.300000, 2.250000, 0.000000],
            [3.314050, 2.303310, -0.131836],
            [3.314050, 2.303310, 0.131836],
            [3.330730, 2.309850, -0.054346],
            [3.330730, 2.309850, 0.054346],
            [3.333890, 2.324050, -0.112500],
            [3.333890, 2.324050, 0.112500],
            [3.334890, 2.317020, -0.081409],
            [3.334890, 2.317020, 0.081409],
            [3.342360, 2.280060, -0.039734],
            [3.342360, 2.280060, 0.039734],
            [3.355430, 2.302700, 0.000000],
            [3.359250, 2.314650, -0.096716],
            [3.359250, 2.314650, 0.096716],
            [3.379120, 2.316580, -0.029993],
            [3.379120, 2.316580, 0.029993],
            [3.386840, 2.304810, -0.076904],
            [3.386840, 2.304810, 0.076904],
            [3.402210, 2.326440, -0.065625],
            [3.402210, 2.326440, 0.065625],
            [3.406390, 2.318500, -0.035632],
            [3.406390, 2.318500, 0.035632],
            [3.408380, 2.315430, 0.000000],
            [3.428120, 2.327340, 0.000000]
        ];

        var indices = [
            [1454,1468,1458],
            [1448,1454,1458],
            [1461,1448,1458],
            [1468,1461,1458],
            [1429,1454,1440],
            [1421,1429,1440],
            [1448,1421,1440],
            [1454,1448,1440],
            [1380,1429,1398],
            [1373,1380,1398],
            [1421,1373,1398],
            [1429,1421,1398],
            [1327,1380,1349],
            [1319,1327,1349],
            [1373,1319,1349],
            [1380,1373,1349],
            [1448,1461,1460],
            [1456,1448,1460],
            [1471,1456,1460],
            [1461,1471,1460],
            [1421,1448,1442],
            [1433,1421,1442],
            [1456,1433,1442],
            [1448,1456,1442],
            [1373,1421,1400],
            [1382,1373,1400],
            [1433,1382,1400],
            [1421,1433,1400],
            [1319,1373,1351],
            [1329,1319,1351],
            [1382,1329,1351],
            [1373,1382,1351],
            [1264,1327,1289],
            [1258,1264,1289],
            [1319,1258,1289],
            [1327,1319,1289],
            [1192,1264,1228],
            [1188,1192,1228],
            [1258,1188,1228],
            [1264,1258,1228],
            [1100,1192,1157],
            [1098,1100,1157],
            [1188,1098,1157],
            [1192,1188,1157],
            [922,1100,1006],
            [928,922,1006],
            [1098,928,1006],
            [1100,1098,1006],
            [1258,1319,1291],
            [1266,1258,1291],
            [1329,1266,1291],
            [1319,1329,1291],
            [1188,1258,1230],
            [1194,1188,1230],
            [1266,1194,1230],
            [1258,1266,1230],
            [1098,1188,1159],
            [1102,1098,1159],
            [1194,1102,1159],
            [1188,1194,1159],
            [928,1098,1008],
            [933,928,1008],
            [1102,933,1008],
            [1098,1102,1008],
            [1456,1471,1475],
            [1481,1456,1475],
            [1482,1481,1475],
            [1471,1482,1475],
            [1433,1456,1450],
            [1444,1433,1450],
            [1481,1444,1450],
            [1456,1481,1450],
            [1382,1433,1412],
            [1392,1382,1412],
            [1444,1392,1412],
            [1433,1444,1412],
            [1329,1382,1357],
            [1331,1329,1357],
            [1392,1331,1357],
            [1382,1392,1357],
            [1481,1482,1490],
            [1500,1481,1490],
            [1502,1500,1490],
            [1482,1502,1490],
            [1444,1481,1470],
            [1465,1444,1470],
            [1500,1465,1470],
            [1481,1500,1470],
            [1392,1444,1431],
            [1410,1392,1431],
            [1465,1410,1431],
            [1444,1465,1431],
            [1331,1392,1371],
            [1345,1331,1371],
            [1410,1345,1371],
            [1392,1410,1371],
            [1266,1329,1297],
            [1276,1266,1297],
            [1331,1276,1297],
            [1329,1331,1297],
            [1194,1266,1232],
            [1200,1194,1232],
            [1276,1200,1232],
            [1266,1276,1232],
            [1102,1194,1163],
            [1106,1102,1163],
            [1200,1106,1163],
            [1194,1200,1163],
            [933,1102,1016],
            [929,933,1016],
            [1106,929,1016],
            [1102,1106,1016],
            [1276,1331,1307],
            [1283,1276,1307],
            [1345,1283,1307],
            [1331,1345,1307],
            [1200,1276,1238],
            [1210,1200,1238],
            [1283,1210,1238],
            [1276,1283,1238],
            [1106,1200,1167],
            [1116,1106,1167],
            [1210,1116,1167],
            [1200,1210,1167],
            [929,1106,1022],
            [923,929,1022],
            [1116,923,1022],
            [1106,1116,1022],
            [755,922,849],
            [757,755,849],
            [928,757,849],
            [922,928,849],
            [663,755,698],
            [667,663,698],
            [757,667,698],
            [755,757,698],
            [591,663,627],
            [597,591,627],
            [667,597,627],
            [663,667,627],
            [528,591,566],
            [536,528,566],
            [597,536,566],
            [591,597,566],
            [757,928,847],
            [753,757,847],
            [933,753,847],
            [928,933,847],
            [667,757,696],
            [661,667,696],
            [753,661,696],
            [757,753,696],
            [597,667,625],
            [589,597,625],
            [661,589,625],
            [667,661,625],
            [536,597,564],
            [526,536,564],
            [589,526,564],
            [597,589,564],
            [475,528,506],
            [482,475,506],
            [536,482,506],
            [528,536,506],
            [426,475,457],
            [434,426,457],
            [482,434,457],
            [475,482,457],
            [401,426,415],
            [407,401,415],
            [434,407,415],
            [426,434,415],
            [386,401,397],
            [393,386,397],
            [407,393,397],
            [401,407,397],
            [482,536,504],
            [473,482,504],
            [526,473,504],
            [536,526,504],
            [434,482,455],
            [422,434,455],
            [473,422,455],
            [482,473,455],
            [407,434,413],
            [399,407,413],
            [422,399,413],
            [434,422,413],
            [393,407,395],
            [383,393,395],
            [399,383,395],
            [407,399,395],
            [753,933,839],
            [749,753,839],
            [929,749,839],
            [933,929,839],
            [661,753,692],
            [655,661,692],
            [749,655,692],
            [753,749,692],
            [589,661,623],
            [579,589,623],
            [655,579,623],
            [661,655,623],
            [526,589,558],
            [524,526,558],
            [579,524,558],
            [589,579,558],
            [749,929,833],
            [741,749,833],
            [923,741,833],
            [929,923,833],
            [655,749,688],
            [647,655,688],
            [741,647,688],
            [749,741,688],
            [579,655,617],
            [574,579,617],
            [647,574,617],
            [655,647,617],
            [524,579,548],
            [512,524,548],
            [574,512,548],
            [579,574,548],
            [473,526,498],
            [463,473,498],
            [524,463,498],
            [526,524,498],
            [422,473,443],
            [411,422,443],
            [463,411,443],
            [473,463,443],
            [399,422,405],
            [374,399,405],
            [411,374,405],
            [422,411,405],
            [383,399,380],
            [372,383,380],
            [374,372,380],
            [399,374,380],
            [463,524,484],
            [447,463,484],
            [512,447,484],
            [524,512,484],
            [411,463,424],
            [392,411,424],
            [447,392,424],
            [463,447,424],
            [374,411,385],
            [357,374,385],
            [392,357,385],
            [411,392,385],
            [372,374,365],
            [353,372,365],
            [357,353,365],
            [374,357,365],
            [400,386,396],
            [406,400,396],
            [393,406,396],
            [386,393,396],
            [425,400,414],
            [433,425,414],
            [406,433,414],
            [400,406,414],
            [474,425,456],
            [481,474,456],
            [433,481,456],
            [425,433,456],
            [527,474,505],
            [535,527,505],
            [481,535,505],
            [474,481,505],
            [406,393,394],
            [398,406,394],
            [383,398,394],
            [393,383,394],
            [433,406,412],
            [421,433,412],
            [398,421,412],
            [406,398,412],
            [481,433,454],
            [472,481,454],
            [421,472,454],
            [433,421,454],
            [535,481,503],
            [525,535,503],
            [472,525,503],
            [481,472,503],
            [590,527,565],
            [596,590,565],
            [535,596,565],
            [527,535,565],
            [662,590,626],
            [666,662,626],
            [596,666,626],
            [590,596,626],
            [754,662,697],
            [756,754,697],
            [666,756,697],
            [662,666,697],
            [919,754,848],
            [927,919,848],
            [756,927,848],
            [754,756,848],
            [596,535,563],
            [588,596,563],
            [525,588,563],
            [535,525,563],
            [666,596,624],
            [660,666,624],
            [588,660,624],
            [596,588,624],
            [756,666,695],
            [752,756,695],
            [660,752,695],
            [666,660,695],
            [927,756,846],
            [932,927,846],
            [752,932,846],
            [756,752,846],
            [398,383,379],
            [373,398,379],
            [372,373,379],
            [383,372,379],
            [421,398,404],
            [410,421,404],
            [373,410,404],
            [398,373,404],
            [472,421,442],
            [462,472,442],
            [410,462,442],
            [421,410,442],
            [525,472,497],
            [523,525,497],
            [462,523,497],
            [472,462,497],
            [373,372,364],
            [356,373,364],
            [353,356,364],
            [372,353,364],
            [410,373,384],
            [391,410,384],
            [356,391,384],
            [373,356,384],
            [462,410,423],
            [446,462,423],
            [391,446,423],
            [410,391,423],
            [523,462,483],
            [511,523,483],
            [446,511,483],
            [462,446,483],
            [588,525,557],
            [578,588,557],
            [523,578,557],
            [525,523,557],
            [660,588,622],
            [654,660,622],
            [578,654,622],
            [588,578,622],
            [752,660,691],
            [748,752,691],
            [654,748,691],
            [660,654,691],
            [932,752,838],
            [926,932,838],
            [748,926,838],
            [752,748,838],
            [578,523,547],
            [573,578,547],
            [511,573,547],
            [523,511,547],
            [654,578,616],
            [646,654,616],
            [573,646,616],
            [578,573,616],
            [748,654,687],
            [740,748,687],
            [646,740,687],
            [654,646,687],
            [926,748,832],
            [918,926,832],
            [740,918,832],
            [748,740,832],
            [1099,919,1005],
            [1097,1099,1005],
            [927,1097,1005],
            [919,927,1005],
            [1191,1099,1156],
            [1187,1191,1156],
            [1097,1187,1156],
            [1099,1097,1156],
            [1263,1191,1227],
            [1257,1263,1227],
            [1187,1257,1227],
            [1191,1187,1227],
            [1326,1263,1288],
            [1318,1326,1288],
            [1257,1318,1288],
            [1263,1257,1288],
            [1097,927,1007],
            [1101,1097,1007],
            [932,1101,1007],
            [927,932,1007],
            [1187,1097,1158],
            [1193,1187,1158],
            [1101,1193,1158],
            [1097,1101,1158],
            [1257,1187,1229],
            [1265,1257,1229],
            [1193,1265,1229],
            [1187,1193,1229],
            [1318,1257,1290],
            [1328,1318,1290],
            [1265,1328,1290],
            [1257,1265,1290],
            [1379,1326,1348],
            [1372,1379,1348],
            [1318,1372,1348],
            [1326,1318,1348],
            [1428,1379,1397],
            [1420,1428,1397],
            [1372,1420,1397],
            [1379,1372,1397],
            [1453,1428,1439],
            [1447,1453,1439],
            [1420,1447,1439],
            [1428,1420,1439],
            [1468,1453,1457],
            [1461,1468,1457],
            [1447,1461,1457],
            [1453,1447,1457],
            [1372,1318,1350],
            [1381,1372,1350],
            [1328,1381,1350],
            [1318,1328,1350],
            [1420,1372,1399],
            [1432,1420,1399],
            [1381,1432,1399],
            [1372,1381,1399],
            [1447,1420,1441],
            [1455,1447,1441],
            [1432,1455,1441],
            [1420,1432,1441],
            [1461,1447,1459],
            [1471,1461,1459],
            [1455,1471,1459],
            [1447,1455,1459],
            [1101,932,1015],
            [1105,1101,1015],
            [926,1105,1015],
            [932,926,1015],
            [1193,1101,1162],
            [1199,1193,1162],
            [1105,1199,1162],
            [1101,1105,1162],
            [1265,1193,1231],
            [1275,1265,1231],
            [1199,1275,1231],
            [1193,1199,1231],
            [1328,1265,1296],
            [1330,1328,1296],
            [1275,1330,1296],
            [1265,1275,1296],
            [1105,926,1021],
            [1115,1105,1021],
            [918,1115,1021],
            [926,918,1021],
            [1199,1105,1166],
            [1209,1199,1166],
            [1115,1209,1166],
            [1105,1115,1166],
            [1275,1199,1237],
            [1282,1275,1237],
            [1209,1282,1237],
            [1199,1209,1237],
            [1330,1275,1306],
            [1344,1330,1306],
            [1282,1344,1306],
            [1275,1282,1306],
            [1381,1328,1356],
            [1391,1381,1356],
            [1330,1391,1356],
            [1328,1330,1356],
            [1432,1381,1411],
            [1443,1432,1411],
            [1391,1443,1411],
            [1381,1391,1411],
            [1455,1432,1449],
            [1480,1455,1449],
            [1443,1480,1449],
            [1432,1443,1449],
            [1471,1455,1474],
            [1482,1471,1474],
            [1480,1482,1474],
            [1455,1480,1474],
            [1391,1330,1370],
            [1409,1391,1370],
            [1344,1409,1370],
            [1330,1344,1370],
            [1443,1391,1430],
            [1464,1443,1430],
            [1409,1464,1430],
            [1391,1409,1430],
            [1480,1443,1469],
            [1499,1480,1469],
            [1464,1499,1469],
            [1443,1464,1469],
            [1482,1480,1489],
            [1502,1482,1489],
            [1499,1502,1489],
            [1480,1499,1489],
            [1500,1502,1533],
            [1572,1500,1533],
            [1585,1572,1533],
            [1502,1585,1533],
            [1465,1500,1519],
            [1555,1465,1519],
            [1572,1555,1519],
            [1500,1572,1519],
            [1410,1465,1496],
            [1510,1410,1496],
            [1555,1510,1496],
            [1465,1555,1496],
            [1345,1410,1427],
            [1436,1345,1427],
            [1510,1436,1427],
            [1410,1510,1427],
            [1283,1345,1341],
            [1333,1283,1341],
            [1436,1333,1341],
            [1345,1436,1341],
            [1210,1283,1270],
            [1242,1210,1270],
            [1333,1242,1270],
            [1283,1333,1270],
            [1116,1210,1184],
            [1143,1116,1184],
            [1242,1143,1184],
            [1210,1242,1184],
            [923,1116,1037],
            [917,923,1037],
            [1143,917,1037],
            [1116,1143,1037],
            [1572,1585,1599],
            [1611,1572,1599],
            [1622,1611,1599],
            [1585,1622,1599],
            [1555,1572,1574],
            [1570,1555,1574],
            [1611,1570,1574],
            [1572,1611,1574],
            [1510,1555,1537],
            [1527,1510,1537],
            [1570,1527,1537],
            [1555,1570,1537],
            [1436,1510,1494],
            [1467,1436,1494],
            [1527,1467,1494],
            [1510,1527,1494],
            [1611,1622,1624],
            [1626,1611,1624],
            [1633,1626,1624],
            [1622,1633,1624],
            [1570,1611,1601],
            [1589,1570,1601],
            [1626,1589,1601],
            [1611,1626,1601],
            [1527,1570,1561],
            [1535,1527,1561],
            [1589,1535,1561],
            [1570,1589,1561],
            [1467,1527,1508],
            [1479,1467,1508],
            [1535,1479,1508],
            [1527,1535,1508],
            [1333,1436,1394],
            [1359,1333,1394],
            [1467,1359,1394],
            [1436,1467,1394],
            [1242,1333,1299],
            [1254,1242,1299],
            [1359,1254,1299],
            [1333,1359,1299],
            [1143,1242,1198],
            [1149,1143,1198],
            [1254,1149,1198],
            [1242,1254,1198],
            [917,1143,1057],
            [915,917,1057],
            [1149,915,1057],
            [1143,1149,1057],
            [1359,1467,1414],
            [1367,1359,1414],
            [1479,1367,1414],
            [1467,1479,1414],
            [1254,1359,1311],
            [1262,1254,1311],
            [1367,1262,1311],
            [1359,1367,1311],
            [1149,1254,1212],
            [1155,1149,1212],
            [1262,1155,1212],
            [1254,1262,1212],
            [915,1149,1065],
            [913,915,1065],
            [1155,913,1065],
            [1149,1155,1065],
            [741,923,818],
            [712,741,818],
            [917,712,818],
            [923,917,818],
            [647,741,671],
            [613,647,671],
            [712,613,671],
            [741,712,671],
            [574,647,585],
            [522,574,585],
            [613,522,585],
            [647,613,585],
            [512,574,514],
            [419,512,514],
            [522,419,514],
            [574,522,514],
            [447,512,428],
            [342,447,428],
            [419,342,428],
            [512,419,428],
            [392,447,359],
            [308,392,359],
            [342,308,359],
            [447,342,359],
            [357,392,329],
            [291,357,329],
            [308,291,329],
            [392,308,329],
            [353,357,314],
            [275,353,314],
            [291,275,314],
            [357,291,314],
            [712,917,798],
            [706,712,798],
            [915,706,798],
            [917,915,798],
            [613,712,657],
            [601,613,657],
            [706,601,657],
            [712,706,657],
            [522,613,556],
            [496,522,556],
            [601,496,556],
            [613,601,556],
            [419,522,461],
            [388,419,461],
            [496,388,461],
            [522,496,461],
            [706,915,790],
            [700,706,790],
            [913,700,790],
            [915,913,790],
            [601,706,643],
            [593,601,643],
            [700,593,643],
            [706,700,643],
            [496,601,544],
            [488,496,544],
            [593,488,544],
            [601,593,544],
            [388,496,441],
            [376,388,441],
            [488,376,441],
            [496,488,441],
            [342,419,361],
            [320,342,361],
            [388,320,361],
            [419,388,361],
            [308,342,310],
            [293,308,310],
            [320,293,310],
            [342,320,310],
            [291,308,289],
            [257,291,289],
            [293,257,289],
            [308,293,289],
            [275,291,270],
            [246,275,270],
            [257,246,270],
            [291,257,270],
            [320,388,344],
            [312,320,344],
            [376,312,344],
            [388,376,344],
            [293,320,302],
            [274,293,302],
            [312,274,302],
            [320,312,302],
            [257,293,268],
            [243,257,268],
            [274,243,268],
            [293,274,268],
            [246,257,245],
            [232,246,245],
            [243,232,245],
            [257,243,245],
            [356,353,313],
            [290,356,313],
            [275,290,313],
            [353,275,313],
            [391,356,328],
            [307,391,328],
            [290,307,328],
            [356,290,328],
            [446,391,358],
            [341,446,358],
            [307,341,358],
            [391,307,358],
            [511,446,427],
            [418,511,427],
            [341,418,427],
            [446,341,427],
            [573,511,513],
            [521,573,513],
            [418,521,513],
            [511,418,513],
            [646,573,584],
            [612,646,584],
            [521,612,584],
            [573,521,584],
            [740,646,670],
            [711,740,670],
            [612,711,670],
            [646,612,670],
            [918,740,817],
            [916,918,817],
            [711,916,817],
            [740,711,817],
            [290,275,269],
            [256,290,269],
            [246,256,269],
            [275,246,269],
            [307,290,288],
            [292,307,288],
            [256,292,288],
            [290,256,288],
            [341,307,309],
            [319,341,309],
            [292,319,309],
            [307,292,309],
            [418,341,360],
            [387,418,360],
            [319,387,360],
            [341,319,360],
            [256,246,244],
            [242,256,244],
            [232,242,244],
            [246,232,244],
            [292,256,267],
            [273,292,267],
            [242,273,267],
            [256,242,267],
            [319,292,301],
            [311,319,301],
            [273,311,301],
            [292,273,301],
            [387,319,343],
            [375,387,343],
            [311,375,343],
            [319,311,343],
            [521,418,460],
            [495,521,460],
            [387,495,460],
            [418,387,460],
            [612,521,555],
            [600,612,555],
            [495,600,555],
            [521,495,555],
            [711,612,656],
            [705,711,656],
            [600,705,656],
            [612,600,656],
            [916,711,797],
            [914,916,797],
            [705,914,797],
            [711,705,797],
            [495,387,440],
            [487,495,440],
            [375,487,440],
            [387,375,440],
            [600,495,543],
            [592,600,543],
            [487,592,543],
            [495,487,543],
            [705,600,642],
            [699,705,642],
            [592,699,642],
            [600,592,642],
            [914,705,789],
            [912,914,789],
            [699,912,789],
            [705,699,789],
            [1115,918,1036],
            [1142,1115,1036],
            [916,1142,1036],
            [918,916,1036],
            [1209,1115,1183],
            [1241,1209,1183],
            [1142,1241,1183],
            [1115,1142,1183],
            [1282,1209,1269],
            [1332,1282,1269],
            [1241,1332,1269],
            [1209,1241,1269],
            [1344,1282,1340],
            [1435,1344,1340],
            [1332,1435,1340],
            [1282,1332,1340],
            [1409,1344,1426],
            [1509,1409,1426],
            [1435,1509,1426],
            [1344,1435,1426],
            [1464,1409,1495],
            [1554,1464,1495],
            [1509,1554,1495],
            [1409,1509,1495],
            [1499,1464,1518],
            [1571,1499,1518],
            [1554,1571,1518],
            [1464,1554,1518],
            [1502,1499,1532],
            [1585,1502,1532],
            [1571,1585,1532],
            [1499,1571,1532],
            [1142,916,1056],
            [1148,1142,1056],
            [914,1148,1056],
            [916,914,1056],
            [1241,1142,1197],
            [1253,1241,1197],
            [1148,1253,1197],
            [1142,1148,1197],
            [1332,1241,1298],
            [1358,1332,1298],
            [1253,1358,1298],
            [1241,1253,1298],
            [1435,1332,1393],
            [1466,1435,1393],
            [1358,1466,1393],
            [1332,1358,1393],
            [1148,914,1064],
            [1154,1148,1064],
            [912,1154,1064],
            [914,912,1064],
            [1253,1148,1211],
            [1261,1253,1211],
            [1154,1261,1211],
            [1148,1154,1211],
            [1358,1253,1310],
            [1366,1358,1310],
            [1261,1366,1310],
            [1253,1261,1310],
            [1466,1358,1413],
            [1478,1466,1413],
            [1366,1478,1413],
            [1358,1366,1413],
            [1509,1435,1493],
            [1526,1509,1493],
            [1466,1526,1493],
            [1435,1466,1493],
            [1554,1509,1536],
            [1569,1554,1536],
            [1526,1569,1536],
            [1509,1526,1536],
            [1571,1554,1573],
            [1610,1571,1573],
            [1569,1610,1573],
            [1554,1569,1573],
            [1585,1571,1598],
            [1622,1585,1598],
            [1610,1622,1598],
            [1571,1610,1598],
            [1526,1466,1507],
            [1534,1526,1507],
            [1478,1534,1507],
            [1466,1478,1507],
            [1569,1526,1560],
            [1588,1569,1560],
            [1534,1588,1560],
            [1526,1534,1560],
            [1610,1569,1600],
            [1625,1610,1600],
            [1588,1625,1600],
            [1569,1588,1600],
            [1622,1610,1623],
            [1633,1622,1623],
            [1625,1633,1623],
            [1610,1625,1623],
            [1626,1633,1628],
            [1621,1626,1628],
            [1629,1621,1628],
            [1633,1629,1628],
            [1589,1626,1607],
            [1584,1589,1607],
            [1621,1584,1607],
            [1626,1621,1607],
            [1621,1629,1616],
            [1603,1621,1616],
            [1612,1603,1616],
            [1629,1612,1616],
            [1584,1621,1593],
            [1568,1584,1593],
            [1603,1568,1593],
            [1621,1603,1593],
            [1535,1589,1563],
            [1529,1535,1563],
            [1584,1529,1563],
            [1589,1584,1563],
            [1479,1535,1512],
            [1473,1479,1512],
            [1529,1473,1512],
            [1535,1529,1512],
            [1529,1584,1557],
            [1521,1529,1557],
            [1568,1521,1557],
            [1584,1568,1557],
            [1473,1529,1504],
            [1452,1473,1504],
            [1521,1452,1504],
            [1529,1521,1504],
            [1603,1612,1580],
            [1559,1603,1580],
            [1566,1559,1580],
            [1612,1566,1580],
            [1568,1603,1565],
            [1525,1568,1565],
            [1559,1525,1565],
            [1603,1559,1565],
            [1521,1568,1523],
            [1484,1521,1523],
            [1525,1484,1523],
            [1568,1525,1523],
            [1452,1521,1477],
            [1406,1452,1477],
            [1484,1406,1477],
            [1521,1484,1477],
            [1367,1479,1417],
            [1361,1367,1417],
            [1473,1361,1417],
            [1479,1473,1417],
            [1262,1367,1313],
            [1260,1262,1313],
            [1361,1260,1313],
            [1367,1361,1313],
            [1361,1473,1404],
            [1355,1361,1404],
            [1452,1355,1404],
            [1473,1452,1404],
            [1260,1361,1303],
            [1248,1260,1303],
            [1355,1248,1303],
            [1361,1355,1303],
            [1155,1262,1214],
            [1151,1155,1214],
            [1260,1151,1214],
            [1262,1260,1214],
            [913,1155,1067],
            [911,913,1067],
            [1151,911,1067],
            [1155,1151,1067],
            [1151,1260,1204],
            [1147,1151,1204],
            [1248,1147,1204],
            [1260,1248,1204],
            [911,1151,1062],
            [909,911,1062],
            [1147,909,1062],
            [1151,1147,1062],
            [1355,1452,1384],
            [1323,1355,1384],
            [1406,1323,1384],
            [1452,1406,1384],
            [1248,1355,1287],
            [1236,1248,1287],
            [1323,1236,1287],
            [1355,1323,1287],
            [1147,1248,1190],
            [1135,1147,1190],
            [1236,1135,1190],
            [1248,1236,1190],
            [909,1147,1051],
            [907,909,1051],
            [1135,907,1051],
            [1147,1135,1051],
            [1559,1566,1531],
            [1514,1559,1531],
            [1515,1514,1531],
            [1566,1515,1531],
            [1525,1559,1517],
            [1486,1525,1517],
            [1514,1486,1517],
            [1559,1514,1517],
            [1484,1525,1488],
            [1438,1484,1488],
            [1486,1438,1488],
            [1525,1486,1488],
            [1406,1484,1425],
            [1363,1406,1425],
            [1438,1363,1425],
            [1484,1438,1425],
            [1514,1515,1506],
            [1498,1514,1506],
            [1501,1498,1506],
            [1515,1501,1506],
            [1486,1514,1492],
            [1463,1486,1492],
            [1498,1463,1492],
            [1514,1498,1492],
            [1438,1486,1446],
            [1408,1438,1446],
            [1463,1408,1446],
            [1486,1463,1446],
            [1363,1438,1386],
            [1343,1363,1386],
            [1408,1343,1386],
            [1438,1408,1386],
            [1323,1406,1337],
            [1293,1323,1337],
            [1363,1293,1337],
            [1406,1363,1337],
            [1236,1323,1268],
            [1220,1236,1268],
            [1293,1220,1268],
            [1323,1293,1268],
            [1135,1236,1182],
            [1122,1135,1182],
            [1220,1122,1182],
            [1236,1220,1182],
            [907,1135,1035],
            [905,907,1035],
            [1122,905,1035],
            [1135,1122,1035],
            [1293,1363,1317],
            [1281,1293,1317],
            [1343,1281,1317],
            [1363,1343,1317],
            [1220,1293,1246],
            [1208,1220,1246],
            [1281,1208,1246],
            [1293,1281,1246],
            [1122,1220,1172],
            [1114,1122,1172],
            [1208,1114,1172],
            [1220,1208,1172],
            [905,1122,1026],
            [903,905,1026],
            [1114,903,1026],
            [1122,1114,1026],
            [700,913,788],
            [704,700,788],
            [911,704,788],
            [913,911,788],
            [593,700,641],
            [595,593,641],
            [704,595,641],
            [700,704,641],
            [704,911,793],
            [708,704,793],
            [909,708,793],
            [911,909,793],
            [595,704,651],
            [607,595,651],
            [708,607,651],
            [704,708,651],
            [488,593,542],
            [494,488,542],
            [595,494,542],
            [593,595,542],
            [376,488,438],
            [382,376,438],
            [494,382,438],
            [488,494,438],
            [494,595,552],
            [500,494,552],
            [607,500,552],
            [595,607,552],
            [382,494,451],
            [403,382,451],
            [500,403,451],
            [494,500,451],
            [708,909,804],
            [718,708,804],
            [907,718,804],
            [909,907,804],
            [607,708,665],
            [619,607,665],
            [718,619,665],
            [708,718,665],
            [500,607,568],
            [532,500,568],
            [619,532,568],
            [607,619,568],
            [403,500,471],
            [449,403,471],
            [532,449,471],
            [500,532,471],
            [312,376,340],
            [318,312,340],
            [382,318,340],
            [376,382,340],
            [274,312,300],
            [285,274,300],
            [318,285,300],
            [312,318,300],
            [318,382,350],
            [327,318,350],
            [403,327,350],
            [382,403,350],
            [285,318,306],
            [295,285,306],
            [327,295,306],
            [318,327,306],
            [243,274,264],
            [250,243,264],
            [285,250,264],
            [274,285,264],
            [232,243,239],
            [237,232,239],
            [250,237,239],
            [243,250,239],
            [250,285,272],
            [266,250,272],
            [295,266,272],
            [285,295,272],
            [237,250,254],
            [255,237,254],
            [266,255,254],
            [250,266,254],
            [327,403,378],
            [371,327,378],
            [449,371,378],
            [403,449,378],
            [295,327,324],
            [322,295,324],
            [371,322,324],
            [327,371,324],
            [266,295,298],
            [304,266,298],
            [322,304,298],
            [295,322,298],
            [255,266,287],
            [296,255,287],
            [304,296,287],
            [266,304,287],
            [718,907,820],
            [733,718,820],
            [905,733,820],
            [907,905,820],
            [619,718,673],
            [635,619,673],
            [733,635,673],
            [718,733,673],
            [532,619,587],
            [562,532,587],
            [635,562,587],
            [619,635,587],
            [449,532,518],
            [492,449,518],
            [562,492,518],
            [532,562,518],
            [733,905,829],
            [739,733,829],
            [903,739,829],
            [905,903,829],
            [635,733,683],
            [645,635,683],
            [739,645,683],
            [733,739,683],
            [562,635,609],
            [572,562,609],
            [645,572,609],
            [635,645,609],
            [492,562,538],
            [510,492,538],
            [572,510,538],
            [562,572,538],
            [371,449,430],
            [417,371,430],
            [492,417,430],
            [449,492,430],
            [322,371,367],
            [369,322,367],
            [417,369,367],
            [371,417,367],
            [304,322,333],
            [338,304,333],
            [369,338,333],
            [322,369,333],
            [296,304,316],
            [334,296,316],
            [338,334,316],
            [304,338,316],
            [417,492,469],
            [445,417,469],
            [510,445,469],
            [492,510,469],
            [369,417,409],
            [390,369,409],
            [445,390,409],
            [417,445,409],
            [338,369,363],
            [355,338,363],
            [390,355,363],
            [369,390,363],
            [334,338,346],
            [351,334,346],
            [355,351,346],
            [338,355,346],
            [242,232,238],
            [249,242,238],
            [237,249,238],
            [232,237,238],
            [273,242,263],
            [284,273,263],
            [249,284,263],
            [242,249,263],
            [249,237,253],
            [265,249,253],
            [255,265,253],
            [237,255,253],
            [284,249,271],
            [294,284,271],
            [265,294,271],
            [249,265,271],
            [311,273,299],
            [317,311,299],
            [284,317,299],
            [273,284,299],
            [375,311,339],
            [381,375,339],
            [317,381,339],
            [311,317,339],
            [317,284,305],
            [326,317,305],
            [294,326,305],
            [284,294,305],
            [381,317,349],
            [402,381,349],
            [326,402,349],
            [317,326,349],
            [265,255,286],
            [303,265,286],
            [296,303,286],
            [255,296,286],
            [294,265,297],
            [321,294,297],
            [303,321,297],
            [265,303,297],
            [326,294,323],
            [370,326,323],
            [321,370,323],
            [294,321,323],
            [402,326,377],
            [448,402,377],
            [370,448,377],
            [326,370,377],
            [487,375,437],
            [493,487,437],
            [381,493,437],
            [375,381,437],
            [592,487,541],
            [594,592,541],
            [493,594,541],
            [487,493,541],
            [493,381,450],
            [499,493,450],
            [402,499,450],
            [381,402,450],
            [594,493,551],
            [606,594,551],
            [499,606,551],
            [493,499,551],
            [699,592,640],
            [703,699,640],
            [594,703,640],
            [592,594,640],
            [912,699,787],
            [910,912,787],
            [703,910,787],
            [699,703,787],
            [703,594,650],
            [707,703,650],
            [606,707,650],
            [594,606,650],
            [910,703,792],
            [908,910,792],
            [707,908,792],
            [703,707,792],
            [499,402,470],
            [531,499,470],
            [448,531,470],
            [402,448,470],
            [606,499,567],
            [618,606,567],
            [531,618,567],
            [499,531,567],
            [707,606,664],
            [719,707,664],
            [618,719,664],
            [606,618,664],
            [908,707,803],
            [906,908,803],
            [719,906,803],
            [707,719,803],
            [303,296,315],
            [337,303,315],
            [334,337,315],
            [296,334,315],
            [321,303,332],
            [368,321,332],
            [337,368,332],
            [303,337,332],
            [370,321,366],
            [416,370,366],
            [368,416,366],
            [321,368,366],
            [448,370,429],
            [491,448,429],
            [416,491,429],
            [370,416,429],
            [337,334,345],
            [354,337,345],
            [351,354,345],
            [334,351,345],
            [368,337,362],
            [389,368,362],
            [354,389,362],
            [337,354,362],
            [416,368,408],
            [444,416,408],
            [389,444,408],
            [368,389,408],
            [491,416,468],
            [509,491,468],
            [444,509,468],
            [416,444,468],
            [531,448,517],
            [561,531,517],
            [491,561,517],
            [448,491,517],
            [618,531,586],
            [634,618,586],
            [561,634,586],
            [531,561,586],
            [719,618,672],
            [732,719,672],
            [634,732,672],
            [618,634,672],
            [906,719,819],
            [904,906,819],
            [732,904,819],
            [719,732,819],
            [561,491,537],
            [571,561,537],
            [509,571,537],
            [491,509,537],
            [634,561,608],
            [644,634,608],
            [571,644,608],
            [561,571,608],
            [732,634,682],
            [738,732,682],
            [644,738,682],
            [634,644,682],
            [904,732,828],
            [902,904,828],
            [738,902,828],
            [732,738,828],
            [1154,912,1066],
            [1150,1154,1066],
            [910,1150,1066],
            [912,910,1066],
            [1261,1154,1213],
            [1259,1261,1213],
            [1150,1259,1213],
            [1154,1150,1213],
            [1150,910,1061],
            [1146,1150,1061],
            [908,1146,1061],
            [910,908,1061],
            [1259,1150,1203],
            [1247,1259,1203],
            [1146,1247,1203],
            [1150,1146,1203],
            [1366,1261,1312],
            [1360,1366,1312],
            [1259,1360,1312],
            [1261,1259,1312],
            [1478,1366,1416],
            [1472,1478,1416],
            [1360,1472,1416],
            [1366,1360,1416],
            [1360,1259,1302],
            [1354,1360,1302],
            [1247,1354,1302],
            [1259,1247,1302],
            [1472,1360,1403],
            [1451,1472,1403],
            [1354,1451,1403],
            [1360,1354,1403],
            [1146,908,1050],
            [1136,1146,1050],
            [906,1136,1050],
            [908,906,1050],
            [1247,1146,1189],
            [1235,1247,1189],
            [1136,1235,1189],
            [1146,1136,1189],
            [1354,1247,1286],
            [1322,1354,1286],
            [1235,1322,1286],
            [1247,1235,1286],
            [1451,1354,1383],
            [1405,1451,1383],
            [1322,1405,1383],
            [1354,1322,1383],
            [1534,1478,1511],
            [1528,1534,1511],
            [1472,1528,1511],
            [1478,1472,1511],
            [1588,1534,1562],
            [1583,1588,1562],
            [1528,1583,1562],
            [1534,1528,1562],
            [1528,1472,1503],
            [1520,1528,1503],
            [1451,1520,1503],
            [1472,1451,1503],
            [1583,1528,1556],
            [1567,1583,1556],
            [1520,1567,1556],
            [1528,1520,1556],
            [1625,1588,1606],
            [1620,1625,1606],
            [1583,1620,1606],
            [1588,1583,1606],
            [1633,1625,1627],
            [1629,1633,1627],
            [1620,1629,1627],
            [1625,1620,1627],
            [1620,1583,1592],
            [1602,1620,1592],
            [1567,1602,1592],
            [1583,1567,1592],
            [1629,1620,1615],
            [1612,1629,1615],
            [1602,1612,1615],
            [1620,1602,1615],
            [1520,1451,1476],
            [1483,1520,1476],
            [1405,1483,1476],
            [1451,1405,1476],
            [1567,1520,1522],
            [1524,1567,1522],
            [1483,1524,1522],
            [1520,1483,1522],
            [1602,1567,1564],
            [1558,1602,1564],
            [1524,1558,1564],
            [1567,1524,1564],
            [1612,1602,1579],
            [1566,1612,1579],
            [1558,1566,1579],
            [1602,1558,1579],
            [1136,906,1034],
            [1121,1136,1034],
            [904,1121,1034],
            [906,904,1034],
            [1235,1136,1181],
            [1219,1235,1181],
            [1121,1219,1181],
            [1136,1121,1181],
            [1322,1235,1267],
            [1292,1322,1267],
            [1219,1292,1267],
            [1235,1219,1267],
            [1405,1322,1336],
            [1362,1405,1336],
            [1292,1362,1336],
            [1322,1292,1336],
            [1121,904,1025],
            [1113,1121,1025],
            [902,1113,1025],
            [904,902,1025],
            [1219,1121,1171],
            [1207,1219,1171],
            [1113,1207,1171],
            [1121,1113,1171],
            [1292,1219,1245],
            [1280,1292,1245],
            [1207,1280,1245],
            [1219,1207,1245],
            [1362,1292,1316],
            [1342,1362,1316],
            [1280,1342,1316],
            [1292,1280,1316],
            [1483,1405,1424],
            [1437,1483,1424],
            [1362,1437,1424],
            [1405,1362,1424],
            [1524,1483,1487],
            [1485,1524,1487],
            [1437,1485,1487],
            [1483,1437,1487],
            [1558,1524,1516],
            [1513,1558,1516],
            [1485,1513,1516],
            [1524,1485,1516],
            [1566,1558,1530],
            [1515,1566,1530],
            [1513,1515,1530],
            [1558,1513,1530],
            [1437,1362,1385],
            [1407,1437,1385],
            [1342,1407,1385],
            [1362,1342,1385],
            [1485,1437,1445],
            [1462,1485,1445],
            [1407,1462,1445],
            [1437,1407,1445],
            [1513,1485,1491],
            [1497,1513,1491],
            [1462,1497,1491],
            [1485,1462,1491],
            [1515,1513,1505],
            [1501,1515,1505],
            [1497,1501,1505],
            [1513,1497,1505],
            [331,325,277],
            [228,331,277],
            [231,228,277],
            [325,231,277],
            [336,331,279],
            [224,336,279],
            [228,224,279],
            [331,228,279],
            [228,231,200],
            [173,228,200],
            [178,173,200],
            [231,178,200],
            [224,228,198],
            [167,224,198],
            [173,167,198],
            [228,173,198],
            [348,336,281],
            [222,348,281],
            [224,222,281],
            [336,224,281],
            [352,348,283],
            [210,352,283],
            [222,210,283],
            [348,222,283],
            [222,224,193],
            [150,222,193],
            [167,150,193],
            [224,167,193],
            [210,222,183],
            [142,210,183],
            [150,142,183],
            [222,150,183],
            [177,178,165],
            [136,177,165],
            [141,136,165],
            [178,141,165],
            [173,177,162],
            [127,173,162],
            [136,127,162],
            [177,136,162],
            [167,173,158],
            [131,167,158],
            [152,131,158],
            [173,152,158],
            [131,152,129],
            [82,131,129],
            [127,82,129],
            [152,127,129],
            [136,141,134],
            [114,136,134],
            [121,114,134],
            [141,121,134],
            [127,136,118],
            [93,127,118],
            [114,93,118],
            [136,114,118],
            [114,121,112],
            [101,114,112],
            [108,101,112],
            [121,108,112],
            [93,114,95],
            [90,93,95],
            [101,90,95],
            [114,101,95],
            [82,127,88],
            [59,82,88],
            [93,59,88],
            [127,93,88],
            [59,93,74],
            [52,59,74],
            [90,52,74],
            [93,90,74],
            [150,167,140],
            [86,150,140],
            [131,86,140],
            [167,131,140],
            [86,131,84],
            [50,86,84],
            [82,50,84],
            [131,82,84],
            [148,150,120],
            [76,148,120],
            [86,76,120],
            [150,86,120],
            [142,148,110],
            [72,142,110],
            [76,72,110],
            [148,76,110],
            [76,86,65],
            [36,76,65],
            [50,36,65],
            [86,50,65],
            [72,76,57],
            [34,72,57],
            [36,34,57],
            [76,36,57],
            [50,82,55],
            [27,50,55],
            [59,27,55],
            [82,59,55],
            [27,59,42],
            [18,27,42],
            [52,18,42],
            [59,52,42],
            [36,50,33],
            [12,36,33],
            [27,12,33],
            [50,27,33],
            [34,36,24],
            [8,34,24],
            [12,8,24],
            [36,12,24],
            [12,27,16],
            [2,12,16],
            [18,2,16],
            [27,18,16],
            [8,12,7],
            [0,8,7],
            [2,0,7],
            [12,2,7],
            [347,352,282],
            [221,347,282],
            [210,221,282],
            [352,210,282],
            [335,347,280],
            [223,335,280],
            [221,223,280],
            [347,221,280],
            [221,210,182],
            [149,221,182],
            [142,149,182],
            [210,142,182],
            [223,221,192],
            [166,223,192],
            [149,166,192],
            [221,149,192],
            [330,335,278],
            [227,330,278],
            [223,227,278],
            [335,223,278],
            [325,330,276],
            [231,325,276],
            [227,231,276],
            [330,227,276],
            [227,223,197],
            [172,227,197],
            [166,172,197],
            [223,166,197],
            [231,227,199],
            [178,231,199],
            [172,178,199],
            [227,172,199],
            [147,142,109],
            [75,147,109],
            [72,75,109],
            [142,72,109],
            [149,147,119],
            [85,149,119],
            [75,85,119],
            [147,75,119],
            [75,72,56],
            [35,75,56],
            [34,35,56],
            [72,34,56],
            [85,75,64],
            [49,85,64],
            [35,49,64],
            [75,35,64],
            [166,149,139],
            [130,166,139],
            [85,130,139],
            [149,85,139],
            [130,85,83],
            [81,130,83],
            [49,81,83],
            [85,49,83],
            [35,34,23],
            [11,35,23],
            [8,11,23],
            [34,8,23],
            [49,35,32],
            [26,49,32],
            [11,26,32],
            [35,11,32],
            [11,8,6],
            [1,11,6],
            [0,1,6],
            [8,0,6],
            [26,11,15],
            [17,26,15],
            [1,17,15],
            [11,1,15],
            [81,49,54],
            [58,81,54],
            [26,58,54],
            [49,26,54],
            [58,26,41],
            [51,58,41],
            [17,51,41],
            [26,17,41],
            [172,166,157],
            [151,172,157],
            [130,151,157],
            [166,130,157],
            [151,130,128],
            [126,151,128],
            [81,126,128],
            [130,81,128],
            [176,172,161],
            [135,176,161],
            [126,135,161],
            [172,126,161],
            [178,176,164],
            [141,178,164],
            [135,141,164],
            [176,135,164],
            [126,81,87],
            [92,126,87],
            [58,92,87],
            [81,58,87],
            [92,58,73],
            [89,92,73],
            [51,89,73],
            [58,51,73],
            [135,126,117],
            [113,135,117],
            [92,113,117],
            [126,92,117],
            [141,135,133],
            [121,141,133],
            [113,121,133],
            [135,113,133],
            [113,92,94],
            [100,113,94],
            [89,100,94],
            [92,89,94],
            [121,113,111],
            [108,121,111],
            [100,108,111],
            [113,100,111],
            [101,108,116],
            [125,101,116],
            [132,125,116],
            [108,132,116],
            [90,101,103],
            [105,90,103],
            [125,105,103],
            [101,125,103],
            [52,90,78],
            [71,52,78],
            [105,71,78],
            [90,105,78],
            [125,132,146],
            [156,125,146],
            [163,156,146],
            [132,163,146],
            [105,125,144],
            [154,105,144],
            [156,154,144],
            [125,156,144],
            [71,105,123],
            [138,71,123],
            [154,138,123],
            [105,154,123],
            [18,52,38],
            [22,18,38],
            [63,22,38],
            [52,63,38],
            [22,63,48],
            [40,22,48],
            [71,40,48],
            [63,71,48],
            [2,18,14],
            [10,2,14],
            [22,10,14],
            [18,22,14],
            [0,2,4],
            [5,0,4],
            [10,5,4],
            [2,10,4],
            [10,22,29],
            [31,10,29],
            [40,31,29],
            [22,40,29],
            [5,10,20],
            [25,5,20],
            [31,25,20],
            [10,31,20],
            [40,71,69],
            [67,40,69],
            [97,67,69],
            [71,97,69],
            [67,97,99],
            [107,67,99],
            [138,107,99],
            [97,138,99],
            [31,40,46],
            [61,31,46],
            [67,61,46],
            [40,67,46],
            [25,31,44],
            [53,25,44],
            [61,53,44],
            [31,61,44],
            [53,67,80],
            [91,53,80],
            [107,91,80],
            [67,107,80],
            [154,163,175],
            [195,154,175],
            [196,195,175],
            [163,196,175],
            [138,154,171],
            [189,138,171],
            [195,189,171],
            [154,195,171],
            [195,196,202],
            [207,195,202],
            [203,207,202],
            [196,203,202],
            [205,203,226],
            [234,205,226],
            [232,234,226],
            [203,232,226],
            [207,205,230],
            [236,207,230],
            [234,236,230],
            [205,234,230],
            [191,195,209],
            [241,191,209],
            [236,241,209],
            [195,236,209],
            [189,191,212],
            [248,189,212],
            [241,248,212],
            [191,241,212],
            [107,138,169],
            [185,107,169],
            [189,185,169],
            [138,189,169],
            [91,107,160],
            [179,91,160],
            [185,179,160],
            [107,185,160],
            [187,189,214],
            [252,187,214],
            [248,252,214],
            [189,248,214],
            [185,187,216],
            [259,185,216],
            [252,259,216],
            [187,252,216],
            [181,185,218],
            [261,181,218],
            [259,261,218],
            [185,259,218],
            [179,181,220],
            [262,179,220],
            [261,262,220],
            [181,261,220],
            [1,0,3],
            [9,1,3],
            [5,9,3],
            [0,5,3],
            [17,1,13],
            [21,17,13],
            [9,21,13],
            [1,9,13],
            [9,5,19],
            [30,9,19],
            [25,30,19],
            [5,25,19],
            [21,9,28],
            [39,21,28],
            [30,39,28],
            [9,30,28],
            [51,17,37],
            [62,51,37],
            [21,62,37],
            [17,21,37],
            [62,21,47],
            [70,62,47],
            [39,70,47],
            [21,39,47],
            [30,25,43],
            [60,30,43],
            [53,60,43],
            [25,53,43],
            [39,30,45],
            [66,39,45],
            [60,66,45],
            [30,60,45],
            [66,53,79],
            [106,66,79],
            [91,106,79],
            [53,91,79],
            [70,39,68],
            [96,70,68],
            [66,96,68],
            [39,66,68],
            [96,66,98],
            [137,96,98],
            [106,137,98],
            [66,106,98],
            [89,51,77],
            [104,89,77],
            [70,104,77],
            [51,70,77],
            [100,89,102],
            [124,100,102],
            [104,124,102],
            [89,104,102],
            [108,100,115],
            [132,108,115],
            [124,132,115],
            [100,124,115],
            [104,70,122],
            [153,104,122],
            [137,153,122],
            [70,137,122],
            [124,104,143],
            [155,124,143],
            [153,155,143],
            [104,153,143],
            [132,124,145],
            [163,132,145],
            [155,163,145],
            [124,155,145],
            [106,91,159],
            [184,106,159],
            [179,184,159],
            [91,179,159],
            [137,106,168],
            [188,137,168],
            [184,188,168],
            [106,184,168],
            [180,179,219],
            [260,180,219],
            [262,260,219],
            [179,262,219],
            [184,180,217],
            [258,184,217],
            [260,258,217],
            [180,260,217],
            [186,184,215],
            [251,186,215],
            [258,251,215],
            [184,258,215],
            [188,186,213],
            [247,188,213],
            [251,247,213],
            [186,251,213],
            [153,137,170],
            [194,153,170],
            [188,194,170],
            [137,188,170],
            [163,153,174],
            [196,163,174],
            [194,196,174],
            [153,194,174],
            [190,188,211],
            [240,190,211],
            [247,240,211],
            [188,247,211],
            [194,190,208],
            [235,194,208],
            [240,235,208],
            [190,240,208],
            [196,194,201],
            [203,196,201],
            [206,203,201],
            [194,206,201],
            [204,206,229],
            [233,204,229],
            [235,233,229],
            [206,235,229],
            [203,204,225],
            [232,203,225],
            [233,232,225],
            [204,233,225],
            [1552,1553,1587],
            [1632,1552,1587],
            [1630,1632,1587],
            [1553,1630,1587],
            [1550,1552,1591],
            [1637,1550,1591],
            [1632,1637,1591],
            [1552,1632,1591],
            [1632,1630,1647],
            [1665,1632,1647],
            [1663,1665,1647],
            [1630,1663,1647],
            [1637,1632,1651],
            [1673,1637,1651],
            [1665,1673,1651],
            [1632,1665,1651],
            [1548,1550,1595],
            [1641,1548,1595],
            [1637,1641,1595],
            [1550,1637,1595],
            [1546,1548,1597],
            [1645,1546,1597],
            [1641,1645,1597],
            [1548,1641,1597],
            [1641,1637,1657],
            [1679,1641,1657],
            [1673,1679,1657],
            [1637,1673,1657],
            [1645,1641,1660],
            [1688,1645,1660],
            [1679,1688,1660],
            [1641,1679,1660],
            [1665,1663,1677],
            [1695,1665,1677],
            [1693,1695,1677],
            [1663,1693,1677],
            [1673,1665,1683],
            [1705,1673,1683],
            [1695,1705,1683],
            [1665,1695,1683],
            [1695,1693,1707],
            [1718,1695,1707],
            [1712,1718,1707],
            [1693,1712,1707],
            [1705,1695,1709],
            [1725,1705,1709],
            [1718,1725,1709],
            [1695,1718,1709],
            [1679,1673,1692],
            [1714,1679,1692],
            [1705,1714,1692],
            [1673,1705,1692],
            [1688,1679,1703],
            [1729,1688,1703],
            [1714,1729,1703],
            [1679,1714,1703],
            [1714,1705,1723],
            [1739,1714,1723],
            [1725,1739,1723],
            [1705,1725,1723],
            [1729,1714,1733],
            [1752,1729,1733],
            [1739,1752,1733],
            [1714,1739,1733],
            [1544,1546,1605],
            [1649,1544,1605],
            [1645,1649,1605],
            [1546,1645,1605],
            [1542,1544,1576],
            [1614,1542,1576],
            [1609,1614,1576],
            [1544,1609,1576],
            [1614,1609,1635],
            [1653,1614,1635],
            [1649,1653,1635],
            [1609,1649,1635],
            [1649,1645,1669],
            [1699,1649,1669],
            [1688,1699,1669],
            [1645,1688,1669],
            [1653,1649,1662],
            [1681,1653,1662],
            [1675,1681,1662],
            [1649,1675,1662],
            [1681,1675,1690],
            [1711,1681,1690],
            [1699,1711,1690],
            [1675,1699,1690],
            [1540,1542,1578],
            [1618,1540,1578],
            [1614,1618,1578],
            [1542,1614,1578],
            [1618,1614,1639],
            [1655,1618,1639],
            [1653,1655,1639],
            [1614,1653,1639],
            [1538,1540,1582],
            [1619,1538,1582],
            [1618,1619,1582],
            [1540,1618,1582],
            [1619,1618,1643],
            [1658,1619,1643],
            [1655,1658,1643],
            [1618,1655,1643],
            [1655,1653,1667],
            [1685,1655,1667],
            [1681,1685,1667],
            [1653,1681,1667],
            [1685,1681,1697],
            [1720,1685,1697],
            [1711,1720,1697],
            [1681,1711,1697],
            [1658,1655,1671],
            [1686,1658,1671],
            [1685,1686,1671],
            [1655,1685,1671],
            [1686,1685,1701],
            [1721,1686,1701],
            [1720,1721,1701],
            [1685,1720,1701],
            [1699,1688,1716],
            [1743,1699,1716],
            [1729,1743,1716],
            [1688,1729,1716],
            [1711,1699,1727],
            [1754,1711,1727],
            [1743,1754,1727],
            [1699,1743,1727],
            [1743,1729,1748],
            [1770,1743,1748],
            [1752,1770,1748],
            [1729,1752,1748],
            [1754,1743,1760],
            [1786,1754,1760],
            [1770,1786,1760],
            [1743,1770,1760],
            [1720,1711,1735],
            [1762,1720,1735],
            [1754,1762,1735],
            [1711,1754,1735],
            [1721,1720,1741],
            [1768,1721,1741],
            [1762,1768,1741],
            [1720,1762,1741],
            [1762,1754,1776],
            [1796,1762,1776],
            [1786,1796,1776],
            [1754,1786,1776],
            [1768,1762,1782],
            [1801,1768,1782],
            [1796,1801,1782],
            [1762,1796,1782],
            [1718,1712,1731],
            [1746,1718,1731],
            [1744,1746,1731],
            [1712,1744,1731],
            [1725,1718,1737],
            [1758,1725,1737],
            [1746,1758,1737],
            [1718,1746,1737],
            [1739,1725,1750],
            [1780,1739,1750],
            [1758,1780,1750],
            [1725,1758,1750],
            [1752,1739,1765],
            [1800,1752,1765],
            [1780,1800,1765],
            [1739,1780,1765],
            [1746,1744,1756],
            [1772,1746,1756],
            [1763,1772,1756],
            [1744,1763,1756],
            [1758,1746,1767],
            [1788,1758,1767],
            [1772,1788,1767],
            [1746,1772,1767],
            [1772,1763,1790],
            [1814,1772,1790],
            [1806,1814,1790],
            [1763,1806,1790],
            [1788,1772,1803],
            [1832,1788,1803],
            [1814,1832,1803],
            [1772,1814,1803],
            [1780,1758,1784],
            [1816,1780,1784],
            [1788,1816,1784],
            [1758,1788,1784],
            [1800,1780,1808],
            [1839,1800,1808],
            [1816,1839,1808],
            [1780,1816,1808],
            [1839,1788,1845],
            [1898,1839,1845],
            [1832,1898,1845],
            [1788,1832,1845],
            [1770,1752,1774],
            [1794,1770,1774],
            [1778,1794,1774],
            [1752,1778,1774],
            [1786,1770,1792],
            [1810,1786,1792],
            [1794,1810,1792],
            [1770,1794,1792],
            [1794,1778,1798],
            [1822,1794,1798],
            [1800,1822,1798],
            [1778,1800,1798],
            [1810,1794,1818],
            [1843,1810,1818],
            [1822,1843,1818],
            [1794,1822,1818],
            [1796,1786,1805],
            [1824,1796,1805],
            [1810,1824,1805],
            [1786,1810,1805],
            [1801,1796,1812],
            [1825,1801,1812],
            [1824,1825,1812],
            [1796,1824,1812],
            [1824,1810,1830],
            [1861,1824,1830],
            [1843,1861,1830],
            [1810,1843,1830],
            [1825,1824,1841],
            [1870,1825,1841],
            [1861,1870,1841],
            [1824,1861,1841],
            [1822,1800,1828],
            [1874,1822,1828],
            [1839,1874,1828],
            [1800,1839,1828],
            [1843,1822,1859],
            [1892,1843,1859],
            [1874,1892,1859],
            [1822,1874,1859],
            [1892,1839,1886],
            [1911,1892,1886],
            [1878,1911,1886],
            [1839,1878,1886],
            [1911,1878,1909],
            [1935,1911,1909],
            [1898,1935,1909],
            [1878,1898,1909],
            [1861,1843,1880],
            [1902,1861,1880],
            [1892,1902,1880],
            [1843,1892,1880],
            [1870,1861,1890],
            [1905,1870,1890],
            [1902,1905,1890],
            [1861,1902,1890],
            [1902,1892,1907],
            [1923,1902,1907],
            [1911,1923,1907],
            [1892,1911,1907],
            [1923,1911,1930],
            [1949,1923,1930],
            [1935,1949,1930],
            [1911,1935,1930],
            [1905,1902,1913],
            [1926,1905,1913],
            [1923,1926,1913],
            [1902,1923,1913],
            [1926,1923,1939],
            [1952,1926,1939],
            [1949,1952,1939],
            [1923,1949,1939],
            [1539,1538,1581],
            [1617,1539,1581],
            [1619,1617,1581],
            [1538,1619,1581],
            [1617,1619,1642],
            [1654,1617,1642],
            [1658,1654,1642],
            [1619,1658,1642],
            [1541,1539,1577],
            [1613,1541,1577],
            [1617,1613,1577],
            [1539,1617,1577],
            [1613,1617,1638],
            [1652,1613,1638],
            [1654,1652,1638],
            [1617,1654,1638],
            [1654,1658,1670],
            [1684,1654,1670],
            [1686,1684,1670],
            [1658,1686,1670],
            [1684,1686,1700],
            [1719,1684,1700],
            [1721,1719,1700],
            [1686,1721,1700],
            [1652,1654,1666],
            [1680,1652,1666],
            [1684,1680,1666],
            [1654,1684,1666],
            [1680,1684,1696],
            [1710,1680,1696],
            [1719,1710,1696],
            [1684,1719,1696],
            [1543,1541,1575],
            [1608,1543,1575],
            [1613,1608,1575],
            [1541,1613,1575],
            [1608,1613,1634],
            [1648,1608,1634],
            [1652,1648,1634],
            [1613,1652,1634],
            [1545,1543,1604],
            [1644,1545,1604],
            [1648,1644,1604],
            [1543,1648,1604],
            [1648,1652,1661],
            [1674,1648,1661],
            [1680,1674,1661],
            [1652,1680,1661],
            [1674,1680,1689],
            [1698,1674,1689],
            [1710,1698,1689],
            [1680,1710,1689],
            [1644,1648,1668],
            [1687,1644,1668],
            [1698,1687,1668],
            [1648,1698,1668],
            [1719,1721,1740],
            [1761,1719,1740],
            [1768,1761,1740],
            [1721,1768,1740],
            [1710,1719,1734],
            [1753,1710,1734],
            [1761,1753,1734],
            [1719,1761,1734],
            [1761,1768,1781],
            [1795,1761,1781],
            [1801,1795,1781],
            [1768,1801,1781],
            [1753,1761,1775],
            [1785,1753,1775],
            [1795,1785,1775],
            [1761,1795,1775],
            [1698,1710,1726],
            [1742,1698,1726],
            [1753,1742,1726],
            [1710,1753,1726],
            [1687,1698,1715],
            [1728,1687,1715],
            [1742,1728,1715],
            [1698,1742,1715],
            [1742,1753,1759],
            [1769,1742,1759],
            [1785,1769,1759],
            [1753,1785,1759],
            [1728,1742,1747],
            [1751,1728,1747],
            [1769,1751,1747],
            [1742,1769,1747],
            [1547,1545,1596],
            [1640,1547,1596],
            [1644,1640,1596],
            [1545,1644,1596],
            [1549,1547,1594],
            [1636,1549,1594],
            [1640,1636,1594],
            [1547,1640,1594],
            [1640,1644,1659],
            [1678,1640,1659],
            [1687,1678,1659],
            [1644,1687,1659],
            [1636,1640,1656],
            [1672,1636,1656],
            [1678,1672,1656],
            [1640,1678,1656],
            [1551,1549,1590],
            [1631,1551,1590],
            [1636,1631,1590],
            [1549,1636,1590],
            [1553,1551,1586],
            [1630,1553,1586],
            [1631,1630,1586],
            [1551,1631,1586],
            [1631,1636,1650],
            [1664,1631,1650],
            [1672,1664,1650],
            [1636,1672,1650],
            [1630,1631,1646],
            [1663,1630,1646],
            [1664,1663,1646],
            [1631,1664,1646],
            [1678,1687,1702],
            [1713,1678,1702],
            [1728,1713,1702],
            [1687,1728,1702],
            [1672,1678,1691],
            [1704,1672,1691],
            [1713,1704,1691],
            [1678,1713,1691],
            [1713,1728,1732],
            [1738,1713,1732],
            [1751,1738,1732],
            [1728,1751,1732],
            [1704,1713,1722],
            [1724,1704,1722],
            [1738,1724,1722],
            [1713,1738,1722],
            [1664,1672,1682],
            [1694,1664,1682],
            [1704,1694,1682],
            [1672,1704,1682],
            [1663,1664,1676],
            [1693,1663,1676],
            [1694,1693,1676],
            [1664,1694,1676],
            [1694,1704,1708],
            [1717,1694,1708],
            [1724,1717,1708],
            [1704,1724,1708],
            [1693,1694,1706],
            [1712,1693,1706],
            [1717,1712,1706],
            [1694,1717,1706],
            [1795,1801,1811],
            [1823,1795,1811],
            [1825,1823,1811],
            [1801,1825,1811],
            [1785,1795,1804],
            [1809,1785,1804],
            [1823,1809,1804],
            [1795,1823,1804],
            [1823,1825,1840],
            [1860,1823,1840],
            [1870,1860,1840],
            [1825,1870,1840],
            [1809,1823,1829],
            [1842,1809,1829],
            [1860,1842,1829],
            [1823,1860,1829],
            [1769,1785,1791],
            [1793,1769,1791],
            [1809,1793,1791],
            [1785,1809,1791],
            [1751,1769,1773],
            [1777,1751,1773],
            [1793,1777,1773],
            [1769,1793,1773],
            [1793,1809,1817],
            [1821,1793,1817],
            [1842,1821,1817],
            [1809,1842,1817],
            [1777,1793,1797],
            [1799,1777,1797],
            [1821,1799,1797],
            [1793,1821,1797],
            [1860,1870,1889],
            [1901,1860,1889],
            [1905,1901,1889],
            [1870,1905,1889],
            [1842,1860,1879],
            [1891,1842,1879],
            [1901,1891,1879],
            [1860,1901,1879],
            [1901,1905,1912],
            [1922,1901,1912],
            [1926,1922,1912],
            [1905,1926,1912],
            [1922,1926,1938],
            [1948,1922,1938],
            [1952,1948,1938],
            [1926,1952,1938],
            [1891,1901,1906],
            [1910,1891,1906],
            [1922,1910,1906],
            [1901,1922,1906],
            [1910,1922,1929],
            [1934,1910,1929],
            [1948,1934,1929],
            [1922,1948,1929],
            [1821,1842,1858],
            [1873,1821,1858],
            [1891,1873,1858],
            [1842,1891,1858],
            [1799,1821,1827],
            [1838,1799,1827],
            [1873,1838,1827],
            [1821,1873,1827],
            [1838,1891,1885],
            [1877,1838,1885],
            [1910,1877,1885],
            [1891,1910,1885],
            [1877,1910,1908],
            [1895,1877,1908],
            [1934,1895,1908],
            [1910,1934,1908],
            [1738,1751,1764],
            [1779,1738,1764],
            [1799,1779,1764],
            [1751,1799,1764],
            [1724,1738,1749],
            [1757,1724,1749],
            [1779,1757,1749],
            [1738,1779,1749],
            [1717,1724,1736],
            [1745,1717,1736],
            [1757,1745,1736],
            [1724,1757,1736],
            [1712,1717,1730],
            [1744,1712,1730],
            [1745,1744,1730],
            [1717,1745,1730],
            [1779,1799,1807],
            [1815,1779,1807],
            [1838,1815,1807],
            [1799,1838,1807],
            [1757,1779,1783],
            [1787,1757,1783],
            [1815,1787,1783],
            [1779,1815,1783],
            [1787,1838,1844],
            [1831,1787,1844],
            [1895,1831,1844],
            [1838,1895,1844],
            [1745,1757,1766],
            [1771,1745,1766],
            [1787,1771,1766],
            [1757,1787,1766],
            [1744,1745,1755],
            [1763,1744,1755],
            [1771,1763,1755],
            [1745,1771,1755],
            [1771,1787,1802],
            [1813,1771,1802],
            [1831,1813,1802],
            [1787,1831,1802],
            [1763,1771,1789],
            [1806,1763,1789],
            [1813,1806,1789],
            [1771,1813,1789],
            [1814,1806,1820],
            [1836,1814,1820],
            [1826,1836,1820],
            [1806,1826,1820],
            [1832,1814,1834],
            [1872,1832,1834],
            [1836,1872,1834],
            [1814,1836,1834],
            [1898,1832,1888],
            [1915,1898,1888],
            [1872,1915,1888],
            [1832,1872,1888],
            [1836,1826,1847],
            [1857,1836,1847],
            [1850,1857,1847],
            [1826,1850,1847],
            [1872,1836,1863],
            [1882,1872,1863],
            [1857,1882,1863],
            [1836,1857,1863],
            [1915,1872,1900],
            [1919,1915,1900],
            [1882,1919,1900],
            [1872,1882,1900],
            [1935,1898,1928],
            [1954,1935,1928],
            [1915,1954,1928],
            [1898,1915,1928],
            [1949,1935,1951],
            [1969,1949,1951],
            [1954,1969,1951],
            [1935,1954,1951],
            [1952,1949,1962],
            [1974,1952,1962],
            [1969,1974,1962],
            [1949,1969,1962],
            [1954,1915,1941],
            [1958,1954,1941],
            [1919,1958,1941],
            [1915,1919,1941],
            [1969,1954,1965],
            [1971,1969,1965],
            [1958,1971,1965],
            [1954,1958,1965],
            [1974,1969,1973],
            [1975,1974,1973],
            [1971,1975,1973],
            [1969,1971,1973],
            [1857,1850,1855],
            [1867,1857,1855],
            [1853,1867,1855],
            [1850,1853,1855],
            [1882,1857,1876],
            [1884,1882,1876],
            [1867,1884,1876],
            [1857,1867,1876],
            [1919,1882,1904],
            [1917,1919,1904],
            [1884,1917,1904],
            [1882,1884,1904],
            [1867,1853,1852],
            [1849,1867,1852],
            [1837,1849,1852],
            [1853,1837,1852],
            [1884,1867,1869],
            [1865,1884,1869],
            [1849,1865,1869],
            [1867,1849,1869],
            [1917,1884,1894],
            [1897,1917,1894],
            [1865,1897,1894],
            [1884,1865,1894],
            [1958,1919,1937],
            [1947,1958,1937],
            [1917,1947,1937],
            [1919,1917,1937],
            [1971,1958,1960],
            [1956,1971,1960],
            [1947,1956,1960],
            [1958,1947,1960],
            [1975,1971,1967],
            [1963,1975,1967],
            [1956,1963,1967],
            [1971,1956,1967],
            [1947,1917,1921],
            [1925,1947,1921],
            [1897,1925,1921],
            [1917,1897,1921],
            [1956,1947,1943],
            [1932,1956,1943],
            [1925,1932,1943],
            [1947,1925,1943],
            [1963,1956,1945],
            [1933,1963,1945],
            [1932,1933,1945],
            [1956,1932,1945],
            [1948,1952,1961],
            [1968,1948,1961],
            [1974,1968,1961],
            [1952,1974,1961],
            [1934,1948,1950],
            [1953,1934,1950],
            [1968,1953,1950],
            [1948,1968,1950],
            [1895,1934,1927],
            [1914,1895,1927],
            [1953,1914,1927],
            [1934,1953,1927],
            [1968,1974,1972],
            [1970,1968,1972],
            [1975,1970,1972],
            [1974,1975,1972],
            [1953,1968,1964],
            [1957,1953,1964],
            [1970,1957,1964],
            [1968,1970,1964],
            [1914,1953,1940],
            [1918,1914,1940],
            [1957,1918,1940],
            [1953,1957,1940],
            [1831,1895,1887],
            [1871,1831,1887],
            [1914,1871,1887],
            [1895,1914,1887],
            [1813,1831,1833],
            [1835,1813,1833],
            [1871,1835,1833],
            [1831,1871,1833],
            [1806,1813,1819],
            [1826,1806,1819],
            [1835,1826,1819],
            [1813,1835,1819],
            [1871,1914,1899],
            [1881,1871,1899],
            [1918,1881,1899],
            [1914,1918,1899],
            [1835,1871,1862],
            [1856,1835,1862],
            [1881,1856,1862],
            [1871,1881,1862],
            [1826,1835,1846],
            [1850,1826,1846],
            [1856,1850,1846],
            [1835,1856,1846],
            [1970,1975,1966],
            [1955,1970,1966],
            [1963,1955,1966],
            [1975,1963,1966],
            [1957,1970,1959],
            [1946,1957,1959],
            [1955,1946,1959],
            [1970,1955,1959],
            [1918,1957,1936],
            [1916,1918,1936],
            [1946,1916,1936],
            [1957,1946,1936],
            [1955,1963,1944],
            [1931,1955,1944],
            [1933,1931,1944],
            [1963,1933,1944],
            [1946,1955,1942],
            [1924,1946,1942],
            [1931,1924,1942],
            [1955,1931,1942],
            [1916,1946,1920],
            [1896,1916,1920],
            [1924,1896,1920],
            [1946,1924,1920],
            [1881,1918,1903],
            [1883,1881,1903],
            [1916,1883,1903],
            [1918,1916,1903],
            [1856,1881,1875],
            [1866,1856,1875],
            [1883,1866,1875],
            [1881,1883,1875],
            [1850,1856,1854],
            [1853,1850,1854],
            [1866,1853,1854],
            [1856,1866,1854],
            [1883,1916,1893],
            [1864,1883,1893],
            [1896,1864,1893],
            [1916,1896,1893],
            [1866,1883,1868],
            [1848,1866,1868],
            [1864,1848,1868],
            [1883,1864,1868],
            [1853,1866,1851],
            [1837,1853,1851],
            [1848,1837,1851],
            [1866,1848,1851],
            [1069,952,992],
            [1072,1069,992],
            [952,1072,992],
            [1069,1072,1094],
            [1118,1069,1094],
            [1134,1118,1094],
            [1072,1134,1094],
            [1030,952,984],
            [1069,1030,984],
            [952,1069,984],
            [1030,1069,1076],
            [1080,1030,1076],
            [1118,1080,1076],
            [1069,1118,1076],
            [1118,1134,1133],
            [1131,1118,1133],
            [1139,1131,1133],
            [1134,1139,1133],
            [1131,1139,1129],
            [1110,1131,1129],
            [1127,1110,1129],
            [1139,1127,1129],
            [1080,1118,1104],
            [1088,1080,1104],
            [1131,1088,1104],
            [1118,1131,1104],
            [1088,1131,1096],
            [1074,1088,1096],
            [1110,1074,1096],
            [1131,1110,1096],
            [980,952,964],
            [1030,980,964],
            [952,1030,964],
            [980,1030,1028],
            [1002,980,1028],
            [1080,1002,1028],
            [1030,1080,1028],
            [951,952,954],
            [980,951,954],
            [952,980,954],
            [951,980,962],
            [949,951,962],
            [1002,949,962],
            [980,1002,962],
            [1002,1080,1059],
            [1012,1002,1059],
            [1088,1012,1059],
            [1080,1088,1059],
            [1012,1088,1053],
            [998,1012,1053],
            [1074,998,1053],
            [1088,1074,1053],
            [949,1002,974],
            [947,949,974],
            [1012,947,974],
            [1002,1012,974],
            [947,1012,972],
            [945,947,972],
            [998,945,972],
            [1012,998,972],
            [1110,1127,1082],
            [1047,1110,1082],
            [1060,1047,1082],
            [1127,1060,1082],
            [1074,1110,1071],
            [1004,1074,1071],
            [1047,1004,1071],
            [1110,1047,1071],
            [1047,1060,1039],
            [1024,1047,1039],
            [1031,1024,1039],
            [1060,1031,1039],
            [1024,1031,1041],
            [1049,1024,1041],
            [1063,1049,1041],
            [1031,1063,1041],
            [1004,1047,1018],
            [994,1004,1018],
            [1024,994,1018],
            [1047,1024,1018],
            [994,1024,1020],
            [1010,994,1020],
            [1049,1010,1020],
            [1024,1049,1020],
            [998,1074,1014],
            [976,998,1014],
            [1004,976,1014],
            [1074,1004,1014],
            [945,998,960],
            [943,945,960],
            [976,943,960],
            [998,976,960],
            [976,1004,986],
            [970,976,986],
            [994,970,986],
            [1004,994,986],
            [970,994,990],
            [978,970,990],
            [1010,978,990],
            [994,1010,990],
            [943,976,956],
            [941,943,956],
            [970,941,956],
            [976,970,956],
            [941,970,958],
            [939,941,958],
            [978,939,958],
            [970,978,958],
            [875,952,901],
            [951,875,901],
            [952,951,901],
            [875,951,893],
            [853,875,893],
            [949,853,893],
            [951,949,893],
            [825,952,891],
            [875,825,891],
            [952,875,891],
            [825,875,827],
            [775,825,827],
            [853,775,827],
            [875,853,827],
            [853,949,881],
            [843,853,881],
            [947,843,881],
            [949,947,881],
            [843,947,883],
            [857,843,883],
            [945,857,883],
            [947,945,883],
            [775,853,796],
            [767,775,796],
            [843,767,796],
            [853,843,796],
            [767,843,802],
            [781,767,802],
            [857,781,802],
            [843,857,802],
            [786,952,871],
            [825,786,871],
            [952,825,871],
            [786,825,779],
            [737,786,779],
            [775,737,779],
            [825,775,779],
            [782,952,863],
            [786,782,863],
            [952,786,863],
            [782,786,761],
            [720,782,761],
            [737,720,761],
            [786,737,761],
            [737,775,751],
            [724,737,751],
            [767,724,751],
            [775,767,751],
            [724,767,759],
            [745,724,759],
            [781,745,759],
            [767,781,759],
            [720,737,722],
            [715,720,722],
            [724,715,722],
            [737,724,722],
            [715,724,726],
            [727,715,726],
            [745,727,726],
            [724,745,726],
            [857,945,895],
            [879,857,895],
            [943,879,895],
            [945,943,895],
            [781,857,841],
            [851,781,841],
            [879,851,841],
            [857,879,841],
            [879,943,899],
            [885,879,899],
            [941,885,899],
            [943,941,899],
            [885,941,897],
            [877,885,897],
            [939,877,897],
            [941,939,897],
            [851,879,869],
            [861,851,869],
            [885,861,869],
            [879,885,869],
            [861,885,865],
            [845,861,865],
            [877,845,865],
            [885,877,865],
            [745,781,784],
            [808,745,784],
            [851,808,784],
            [781,851,784],
            [727,745,773],
            [794,727,773],
            [808,794,773],
            [745,808,773],
            [808,851,837],
            [831,808,837],
            [861,831,837],
            [851,861,837],
            [831,861,835],
            [806,831,835],
            [845,806,835],
            [861,845,835],
            [794,808,816],
            [823,794,816],
            [831,823,816],
            [808,831,816],
            [823,831,814],
            [791,823,814],
            [806,791,814],
            [831,806,814],
            [785,952,862],
            [782,785,862],
            [952,782,862],
            [785,782,760],
            [736,785,760],
            [720,736,760],
            [782,720,760],
            [824,952,870],
            [785,824,870],
            [952,785,870],
            [824,785,778],
            [774,824,778],
            [736,774,778],
            [785,736,778],
            [736,720,721],
            [723,736,721],
            [715,723,721],
            [720,715,721],
            [723,715,725],
            [744,723,725],
            [727,744,725],
            [715,727,725],
            [774,736,750],
            [766,774,750],
            [723,766,750],
            [736,723,750],
            [766,723,758],
            [780,766,758],
            [744,780,758],
            [723,744,758],
            [874,952,890],
            [824,874,890],
            [952,824,890],
            [874,824,826],
            [852,874,826],
            [774,852,826],
            [824,774,826],
            [950,952,900],
            [874,950,900],
            [952,874,900],
            [950,874,892],
            [948,950,892],
            [852,948,892],
            [874,852,892],
            [852,774,795],
            [842,852,795],
            [766,842,795],
            [774,766,795],
            [842,766,801],
            [856,842,801],
            [780,856,801],
            [766,780,801],
            [948,852,880],
            [946,948,880],
            [842,946,880],
            [852,842,880],
            [946,842,882],
            [944,946,882],
            [856,944,882],
            [842,856,882],
            [744,727,772],
            [807,744,772],
            [794,807,772],
            [727,794,772],
            [780,744,783],
            [850,780,783],
            [807,850,783],
            [744,807,783],
            [807,794,815],
            [830,807,815],
            [823,830,815],
            [794,823,815],
            [830,823,813],
            [805,830,813],
            [791,805,813],
            [823,791,813],
            [850,807,836],
            [860,850,836],
            [830,860,836],
            [807,830,836],
            [860,830,834],
            [844,860,834],
            [805,844,834],
            [830,805,834],
            [856,780,840],
            [878,856,840],
            [850,878,840],
            [780,850,840],
            [944,856,894],
            [942,944,894],
            [878,942,894],
            [856,878,894],
            [878,850,868],
            [884,878,868],
            [860,884,868],
            [850,860,868],
            [884,860,864],
            [876,884,864],
            [844,876,864],
            [860,844,864],
            [942,878,898],
            [940,942,898],
            [884,940,898],
            [878,884,898],
            [940,884,896],
            [938,940,896],
            [876,938,896],
            [884,876,896],
            [979,952,953],
            [950,979,953],
            [952,950,953],
            [979,950,961],
            [1001,979,961],
            [948,1001,961],
            [950,948,961],
            [1029,952,963],
            [979,1029,963],
            [952,979,963],
            [1029,979,1027],
            [1079,1029,1027],
            [1001,1079,1027],
            [979,1001,1027],
            [1001,948,973],
            [1011,1001,973],
            [946,1011,973],
            [948,946,973],
            [1011,946,971],
            [997,1011,971],
            [944,997,971],
            [946,944,971],
            [1079,1001,1058],
            [1087,1079,1058],
            [1011,1087,1058],
            [1001,1011,1058],
            [1087,1011,1052],
            [1073,1087,1052],
            [997,1073,1052],
            [1011,997,1052],
            [1068,952,983],
            [1029,1068,983],
            [952,1029,983],
            [1068,1029,1075],
            [1117,1068,1075],
            [1079,1117,1075],
            [1029,1079,1075],
            [1072,952,991],
            [1068,1072,991],
            [952,1068,991],
            [1072,1068,1093],
            [1134,1072,1093],
            [1117,1134,1093],
            [1068,1117,1093],
            [1117,1079,1103],
            [1130,1117,1103],
            [1087,1130,1103],
            [1079,1087,1103],
            [1130,1087,1095],
            [1109,1130,1095],
            [1073,1109,1095],
            [1087,1073,1095],
            [1134,1117,1132],
            [1139,1134,1132],
            [1130,1139,1132],
            [1117,1130,1132],
            [1139,1130,1128],
            [1127,1139,1128],
            [1109,1127,1128],
            [1130,1109,1128],
            [997,944,959],
            [975,997,959],
            [942,975,959],
            [944,942,959],
            [1073,997,1013],
            [1003,1073,1013],
            [975,1003,1013],
            [997,975,1013],
            [975,942,955],
            [969,975,955],
            [940,969,955],
            [942,940,955],
            [969,940,957],
            [977,969,957],
            [938,977,957],
            [940,938,957],
            [1003,975,985],
            [993,1003,985],
            [969,993,985],
            [975,969,985],
            [993,969,989],
            [1009,993,989],
            [977,1009,989],
            [969,977,989],
            [1109,1073,1070],
            [1046,1109,1070],
            [1003,1046,1070],
            [1073,1003,1070],
            [1127,1109,1081],
            [1060,1127,1081],
            [1046,1060,1081],
            [1109,1046,1081],
            [1046,1003,1017],
            [1023,1046,1017],
            [993,1023,1017],
            [1003,993,1017],
            [1023,993,1019],
            [1048,1023,1019],
            [1009,1048,1019],
            [993,1009,1019],
            [1060,1046,1038],
            [1031,1060,1038],
            [1023,1031,1038],
            [1046,1023,1038],
            [1031,1023,1040],
            [1063,1031,1040],
            [1048,1063,1040],
            [1023,1048,1040],
            [1049,1063,1120],
            [1161,1049,1120],
            [1170,1161,1120],
            [1063,1170,1120],
            [1010,1049,1092],
            [1126,1010,1092],
            [1161,1126,1092],
            [1049,1161,1092],
            [1165,1170,1224],
            [1272,1165,1224],
            [1279,1272,1224],
            [1170,1279,1224],
            [1161,1165,1216],
            [1250,1161,1216],
            [1272,1250,1216],
            [1165,1272,1216],
            [1141,1161,1196],
            [1234,1141,1196],
            [1250,1234,1196],
            [1161,1250,1196],
            [1126,1141,1178],
            [1206,1126,1178],
            [1234,1206,1178],
            [1141,1234,1178],
            [978,1010,1045],
            [1043,978,1045],
            [1126,1043,1045],
            [1010,1126,1045],
            [939,978,966],
            [937,939,966],
            [1043,937,966],
            [978,1043,966],
            [1084,1126,1153],
            [1174,1084,1153],
            [1206,1174,1153],
            [1126,1206,1153],
            [1043,1084,1112],
            [1124,1043,1112],
            [1174,1124,1112],
            [1084,1174,1112],
            [982,1043,1055],
            [1033,982,1055],
            [1124,1033,1055],
            [1043,1124,1055],
            [937,982,968],
            [935,937,968],
            [1033,935,968],
            [982,1033,968],
            [1272,1279,1321],
            [1369,1272,1321],
            [1376,1369,1321],
            [1279,1376,1321],
            [1250,1272,1309],
            [1347,1250,1309],
            [1369,1347,1309],
            [1272,1369,1309],
            [1234,1250,1285],
            [1315,1234,1285],
            [1347,1315,1285],
            [1250,1347,1285],
            [1206,1234,1252],
            [1278,1206,1252],
            [1315,1278,1252],
            [1234,1315,1252],
            [1369,1376,1388],
            [1402,1369,1388],
            [1415,1402,1388],
            [1376,1415,1388],
            [1347,1369,1375],
            [1378,1347,1375],
            [1402,1378,1375],
            [1369,1402,1375],
            [1402,1415,1419],
            [1423,1402,1419],
            [1434,1423,1419],
            [1415,1434,1419],
            [1378,1402,1396],
            [1390,1378,1396],
            [1423,1390,1396],
            [1402,1423,1396],
            [1315,1347,1339],
            [1335,1315,1339],
            [1378,1335,1339],
            [1347,1378,1339],
            [1278,1315,1305],
            [1295,1278,1305],
            [1335,1295,1305],
            [1315,1335,1305],
            [1335,1378,1365],
            [1353,1335,1365],
            [1390,1353,1365],
            [1378,1390,1365],
            [1295,1335,1325],
            [1301,1295,1325],
            [1353,1301,1325],
            [1335,1353,1325],
            [1174,1206,1222],
            [1226,1174,1222],
            [1278,1226,1222],
            [1206,1278,1222],
            [1124,1174,1176],
            [1169,1124,1176],
            [1226,1169,1176],
            [1174,1226,1176],
            [1033,1124,1108],
            [1078,1033,1108],
            [1169,1078,1108],
            [1124,1169,1108],
            [935,1033,988],
            [931,935,988],
            [1078,931,988],
            [1033,1078,988],
            [1226,1278,1256],
            [1240,1226,1256],
            [1295,1240,1256],
            [1278,1295,1256],
            [1169,1226,1202],
            [1180,1169,1202],
            [1240,1180,1202],
            [1226,1240,1202],
            [1240,1295,1274],
            [1244,1240,1274],
            [1301,1244,1274],
            [1295,1301,1274],
            [1180,1240,1218],
            [1186,1180,1218],
            [1244,1186,1218],
            [1240,1244,1218],
            [1078,1169,1138],
            [1086,1078,1138],
            [1180,1086,1138],
            [1169,1180,1138],
            [931,1078,996],
            [925,931,996],
            [1086,925,996],
            [1078,1086,996],
            [1086,1180,1145],
            [1090,1086,1145],
            [1186,1090,1145],
            [1180,1186,1145],
            [925,1086,1000],
            [921,925,1000],
            [1090,921,1000],
            [1086,1090,1000],
            [877,939,889],
            [812,877,889],
            [937,812,889],
            [939,937,889],
            [845,877,810],
            [729,845,810],
            [812,729,810],
            [877,812,810],
            [873,937,887],
            [822,873,887],
            [935,822,887],
            [937,935,887],
            [812,873,800],
            [731,812,800],
            [822,731,800],
            [873,822,800],
            [771,812,743],
            [681,771,743],
            [731,681,743],
            [812,731,743],
            [729,771,702],
            [649,729,702],
            [681,649,702],
            [771,681,702],
            [806,845,763],
            [694,806,763],
            [729,694,763],
            [845,729,763],
            [791,806,735],
            [684,791,735],
            [694,684,735],
            [806,694,735],
            [714,729,677],
            [621,714,677],
            [649,621,677],
            [729,649,677],
            [694,714,659],
            [605,694,659],
            [621,605,659],
            [714,621,659],
            [690,694,639],
            [583,690,639],
            [605,583,639],
            [694,605,639],
            [684,690,631],
            [575,684,631],
            [583,575,631],
            [690,583,631],
            [822,935,867],
            [777,822,867],
            [931,777,867],
            [935,931,867],
            [731,822,747],
            [686,731,747],
            [777,686,747],
            [822,777,747],
            [681,731,679],
            [629,681,679],
            [686,629,679],
            [731,686,679],
            [649,681,633],
            [577,649,633],
            [629,577,633],
            [681,629,633],
            [777,931,859],
            [769,777,859],
            [925,769,859],
            [931,925,859],
            [686,777,717],
            [675,686,717],
            [769,675,717],
            [777,769,717],
            [769,925,855],
            [765,769,855],
            [921,765,855],
            [925,921,855],
            [675,769,710],
            [669,675,710],
            [765,669,710],
            [769,765,710],
            [629,686,653],
            [615,629,653],
            [675,615,653],
            [686,675,653],
            [577,629,599],
            [560,577,599],
            [615,560,599],
            [629,615,599],
            [615,675,637],
            [611,615,637],
            [669,611,637],
            [675,669,637],
            [560,615,581],
            [554,560,581],
            [611,554,581],
            [615,611,581],
            [621,649,603],
            [540,621,603],
            [577,540,603],
            [649,577,603],
            [605,621,570],
            [508,605,570],
            [540,508,570],
            [621,540,570],
            [583,605,546],
            [486,583,546],
            [508,486,546],
            [605,508,546],
            [575,583,534],
            [478,575,534],
            [486,478,534],
            [583,486,534],
            [540,577,550],
            [520,540,550],
            [560,520,550],
            [577,560,550],
            [508,540,516],
            [477,508,516],
            [520,477,516],
            [540,520,516],
            [520,560,530],
            [502,520,530],
            [554,502,530],
            [560,554,530],
            [477,520,490],
            [465,477,490],
            [502,465,490],
            [520,502,490],
            [486,508,480],
            [453,486,480],
            [477,453,480],
            [508,477,480],
            [478,486,467],
            [439,478,467],
            [453,439,467],
            [486,453,467],
            [453,477,459],
            [432,453,459],
            [465,432,459],
            [477,465,459],
            [439,453,436],
            [420,439,436],
            [432,420,436],
            [453,432,436],
            [805,791,734],
            [693,805,734],
            [684,693,734],
            [791,684,734],
            [844,805,762],
            [728,844,762],
            [693,728,762],
            [805,693,762],
            [689,684,630],
            [582,689,630],
            [575,582,630],
            [684,575,630],
            [693,689,638],
            [604,693,638],
            [582,604,638],
            [689,582,638],
            [713,693,658],
            [620,713,658],
            [604,620,658],
            [693,604,658],
            [728,713,676],
            [648,728,676],
            [620,648,676],
            [713,620,676],
            [876,844,809],
            [811,876,809],
            [728,811,809],
            [844,728,809],
            [938,876,888],
            [936,938,888],
            [811,936,888],
            [876,811,888],
            [770,728,701],
            [680,770,701],
            [648,680,701],
            [728,648,701],
            [811,770,742],
            [730,811,742],
            [680,730,742],
            [770,680,742],
            [872,811,799],
            [821,872,799],
            [730,821,799],
            [811,730,799],
            [936,872,886],
            [934,936,886],
            [821,934,886],
            [872,821,886],
            [582,575,533],
            [485,582,533],
            [478,485,533],
            [575,478,533],
            [604,582,545],
            [507,604,545],
            [485,507,545],
            [582,485,545],
            [620,604,569],
            [539,620,569],
            [507,539,569],
            [604,507,569],
            [648,620,602],
            [576,648,602],
            [539,576,602],
            [620,539,602],
            [485,478,466],
            [452,485,466],
            [439,452,466],
            [478,439,466],
            [507,485,479],
            [476,507,479],
            [452,476,479],
            [485,452,479],
            [452,439,435],
            [431,452,435],
            [420,431,435],
            [439,420,435],
            [476,452,458],
            [464,476,458],
            [431,464,458],
            [452,431,458],
            [539,507,515],
            [519,539,515],
            [476,519,515],
            [507,476,515],
            [576,539,549],
            [559,576,549],
            [519,559,549],
            [539,519,549],
            [519,476,489],
            [501,519,489],
            [464,501,489],
            [476,464,489],
            [559,519,529],
            [553,559,529],
            [501,553,529],
            [519,501,529],
            [680,648,632],
            [628,680,632],
            [576,628,632],
            [648,576,632],
            [730,680,678],
            [685,730,678],
            [628,685,678],
            [680,628,678],
            [821,730,746],
            [776,821,746],
            [685,776,746],
            [730,685,746],
            [934,821,866],
            [930,934,866],
            [776,930,866],
            [821,776,866],
            [628,576,598],
            [614,628,598],
            [559,614,598],
            [576,559,598],
            [685,628,652],
            [674,685,652],
            [614,674,652],
            [628,614,652],
            [614,559,580],
            [610,614,580],
            [553,610,580],
            [559,553,580],
            [674,614,636],
            [668,674,636],
            [610,668,636],
            [614,610,636],
            [776,685,716],
            [768,776,716],
            [674,768,716],
            [685,674,716],
            [930,776,858],
            [924,930,858],
            [768,924,858],
            [776,768,858],
            [768,674,709],
            [764,768,709],
            [668,764,709],
            [674,668,709],
            [924,768,854],
            [920,924,854],
            [764,920,854],
            [768,764,854],
            [977,938,965],
            [1042,977,965],
            [936,1042,965],
            [938,936,965],
            [1009,977,1044],
            [1125,1009,1044],
            [1042,1125,1044],
            [977,1042,1044],
            [981,936,967],
            [1032,981,967],
            [934,1032,967],
            [936,934,967],
            [1042,981,1054],
            [1123,1042,1054],
            [1032,1123,1054],
            [981,1032,1054],
            [1083,1042,1111],
            [1173,1083,1111],
            [1123,1173,1111],
            [1042,1123,1111],
            [1125,1083,1152],
            [1205,1125,1152],
            [1173,1205,1152],
            [1083,1173,1152],
            [1048,1009,1091],
            [1160,1048,1091],
            [1125,1160,1091],
            [1009,1125,1091],
            [1063,1048,1119],
            [1170,1063,1119],
            [1160,1170,1119],
            [1048,1160,1119],
            [1140,1125,1177],
            [1233,1140,1177],
            [1205,1233,1177],
            [1125,1205,1177],
            [1160,1140,1195],
            [1249,1160,1195],
            [1233,1249,1195],
            [1140,1233,1195],
            [1164,1160,1215],
            [1271,1164,1215],
            [1249,1271,1215],
            [1160,1249,1215],
            [1170,1164,1223],
            [1279,1170,1223],
            [1271,1279,1223],
            [1164,1271,1223],
            [1032,934,987],
            [1077,1032,987],
            [930,1077,987],
            [934,930,987],
            [1123,1032,1107],
            [1168,1123,1107],
            [1077,1168,1107],
            [1032,1077,1107],
            [1173,1123,1175],
            [1225,1173,1175],
            [1168,1225,1175],
            [1123,1168,1175],
            [1205,1173,1221],
            [1277,1205,1221],
            [1225,1277,1221],
            [1173,1225,1221],
            [1077,930,995],
            [1085,1077,995],
            [924,1085,995],
            [930,924,995],
            [1168,1077,1137],
            [1179,1168,1137],
            [1085,1179,1137],
            [1077,1085,1137],
            [1085,924,999],
            [1089,1085,999],
            [920,1089,999],
            [924,920,999],
            [1179,1085,1144],
            [1185,1179,1144],
            [1089,1185,1144],
            [1085,1089,1144],
            [1225,1168,1201],
            [1239,1225,1201],
            [1179,1239,1201],
            [1168,1179,1201],
            [1277,1225,1255],
            [1294,1277,1255],
            [1239,1294,1255],
            [1225,1239,1255],
            [1239,1179,1217],
            [1243,1239,1217],
            [1185,1243,1217],
            [1179,1185,1217],
            [1294,1239,1273],
            [1300,1294,1273],
            [1243,1300,1273],
            [1239,1243,1273],
            [1233,1205,1251],
            [1314,1233,1251],
            [1277,1314,1251],
            [1205,1277,1251],
            [1249,1233,1284],
            [1346,1249,1284],
            [1314,1346,1284],
            [1233,1314,1284],
            [1271,1249,1308],
            [1368,1271,1308],
            [1346,1368,1308],
            [1249,1346,1308],
            [1279,1271,1320],
            [1376,1279,1320],
            [1368,1376,1320],
            [1271,1368,1320],
            [1314,1277,1304],
            [1334,1314,1304],
            [1294,1334,1304],
            [1277,1294,1304],
            [1346,1314,1338],
            [1377,1346,1338],
            [1334,1377,1338],
            [1314,1334,1338],
            [1334,1294,1324],
            [1352,1334,1324],
            [1300,1352,1324],
            [1294,1300,1324],
            [1377,1334,1364],
            [1389,1377,1364],
            [1352,1389,1364],
            [1334,1352,1364],
            [1368,1346,1374],
            [1401,1368,1374],
            [1377,1401,1374],
            [1346,1377,1374],
            [1376,1368,1387],
            [1415,1376,1387],
            [1401,1415,1387],
            [1368,1401,1387],
            [1401,1377,1395],
            [1422,1401,1395],
            [1389,1422,1395],
            [1377,1389,1395],
            [1415,1401,1418],
            [1434,1415,1418],
            [1422,1434,1418],
            [1401,1422,1418]
        ];

        // @private
        var calculateNormals = function(positions, indices) {
            var nvecs = new Array(positions.length);

            for (var i = 0; i < indices.length; i++) {
                var j0 = indices[i][0];
                var j1 = indices[i][1];
                var j2 = indices[i][2];

                var v1 = positions[j0];
                var v2 = positions[j1];
                var v3 = positions[j2];

                var va = SceneJS._math_subVec4(v2, v1);
                var vb = SceneJS._math_subVec4(v3, v1);

                var n = SceneJS._math_normalizeVec4(SceneJS._math_cross3Vec4(va, vb));

                if (!nvecs[j0]) nvecs[j0] = [];
                if (!nvecs[j1]) nvecs[j1] = [];
                if (!nvecs[j2]) nvecs[j2] = [];

                nvecs[j0].push(n);
                nvecs[j1].push(n);
                nvecs[j2].push(n);
            }

            var normals = new Array(positions.length);

            // now go through and average out everything
            for (var i = 0; i < nvecs.length; i++) {
                var count = nvecs[i].length;
                var x = 0;
                var y = 0;
                var z = 0;
                for (var j = 0; j < count; j++) {
                    x += nvecs[i][j][0];
                    y += nvecs[i][j][1];
                    z += nvecs[i][j][2];
                }
                normals[i] = [x / count, y / count, z / count];
            }
            return normals;
        };

        // @private
        var flatten = function (ar, numPerElement) {
            var result = [];
            for (var i = 0; i < ar.length; i++) {
                if (numPerElement && ar[i].length != numPerElement)
                    throw new SceneJS.errors.InvalidNodeConfigException("Bad geometry array element");
                for (var j = 0; j < ar[i].length; j++)
                    result.push(ar[i][j]);
            }
            return result;
        };
        return {
            primitive:"triangles",
            positions: flatten(positions, 3),
            indices:flatten(indices, 3),
            normals:flatten(calculateNormals(positions, indices), 3)
        };
    };
};

SceneJS._inherit(SceneJS.objects.Teapot, SceneJS.Geometry);

/** Returns a new SceneJS.objects.Teapot instance
 * @param {Object} [cfg] Static configuration object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.objects.Teapot}
 * @since Version 0.7.4
 */
SceneJS.objects.teapot = function() {
    return new SceneJS.objects.Teapot();
};
SceneJS._namespace("SceneJS.objects");

/**
 * @class A scene node that defines cube geometry.
 * <p>The geometry is complete with normals for shading and one layer of UV coordinates for
 * texture-mapping. A Cube may be configured with an optional half-size for each axis. Where
 * not specified, the half-size on each axis will be 1 by default. It can also be configured as solid (default),
 * to construct it from triangles with normals for shading and one layer of UV coordinates for texture-mapping
 * one made of triangles. When not solid, it will be a wireframe drawn as line segments.</p>
 * <p><b>Example Usage</b></p><p>Definition of solid cube that is 6 units long on the X axis and 2 units long on the
 * Y and Z axis:</b></p><pre><code>
 * var c = new SceneJS.objects.Cube({
 *          xSize : 3,
 *          solid: true // Optional - when true (default) cube is solid, otherwise it is wireframe
 *     })
 * </pre></code>
 * @extends SceneJS.Geometry
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.objects.Cube
 * @param {Object} [cfg] Static configuration object
 * @param {float} [cfg.xSize=1.0] Half-width on X-axis
 * @param {float} [cfg.ySize=1.0] Half-width on Y-axis
 * @param {float} [cfg.zSize=1.0] Half-width on Z-axis
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.objects.Cube = function() {
    SceneJS.Geometry.apply(this, arguments);
    this._nodeType = "cube";
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.objects.Cube, SceneJS.Geometry);

// @private
SceneJS.objects.Cube.prototype._init = function(params) {
    var x = params.xSize || 1;
    var y = params.ySize || 1;
    var z = params.zSize || 1;
    var solid = (params.solid != undefined) ? params.solid : true;

    /* Type ID ensures that we reuse any scube that has already been created with
     * these parameters instead of wasting memory
     */
    this._type = "cube_" + x + "_" + y + "_" + z + (solid ? "_solid" : "wire");

    /* Callback that does the creation in case we can't find matching cube to reuse
     */
    this._create = function() {
        var positions = [
            x, y, z,
            -x, y, z,
            -x,-y, z,
            x,-y, z,
            // v0-v1-v2-v3 front
            x, y, z,
            x,-y, z,
            x,-y,-z,
            x, y,-z,
            // v0-v3-v4-v5 right
            x, y, z,
            x, y,-z,
            -x, y,-z,
            -x, y, z,
            // v0-v5-v6-v1 top
            -x, y, z,
            -x, y,-z,
            -x,-y,-z,
            -x,-y, z,
            // v1-v6-v7-v2 left
            -x,-y,-z,
            x,-y,-z,
            x,-y, z,
            -x,-y, z,
            // v7-v4-v3-v2 bottom
            x,-y,-z,
            -x,-y,-z,
            -x, y,-z,
            x, y,-z
        ];   // v4-v7-v6-v5 back

        var normals = [
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            // v0-v1-v2-v3 front
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            // v0-v3-v4-v5 right
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            // v0-v5-v6-v1 top
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            // v1-v6-v7-v2 left
            0,1, 0,
            0,1, 0,
            0,1, 0,
            0,1, 0,
            // v7-v4-v3-v2 bottom
            0, 0,1,
            0, 0,1,
            0, 0,1,
            0, 0,1
        ];    // v4-v7-v6-v5 back

        var uv = [
            x, y,
            0, y,
            0, 0,
            x, 0,
            // v0-v1-v2-v3 front
            0, y,
            0, 0,
            x, 0,
            x, y,
            // v0-v3-v4-v5 right
            x, 0,
            x, y,
            0, y,
            0, 0,
            // v0-v5-v6-v1 top
            x, y,
            0, y,
            0, 0,
            x, 0,
            // v1-v6-v7-v2 left
            0, 0,
            x, 0,
            x, y,
            0, y,
            // v7-v4-v3-v2 bottom
            0, 0,
            x, 0,
            x, y,
            0, y
        ];   // v4-v7-v6-v5 back

        var indices = [
            0, 1, 2,
            0, 2, 3,
            // front
            4, 5, 6,
            4, 6, 7,
            // right
            8, 9,10,
            8,10,11,
            // top
            12,13,14,
            12,14,15,
            // left
            16,17,18,
            16,18,19,
            // bottom
            20,21,22,
            20,22,23
        ] ;  // back

        return {
            primitive : solid ? "triangles" : "lines",
            positions : positions,
            normals: normals,
            uv : uv,
            indices : indices,
            colors:[]
        };
    };
};

/** Returns a new SceneJS.objects.Cube instance
 * @param {Object} [cfg] Static configuration object
 * @param {float} [cfg.xSize=1.0] Half-width on X-axis
 * @param {float} [cfg.ySize=1.0] Half-width on Y-axis
 * @param {float} [cfg.zSize=1.0] Half-width on Z-axis
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @since Version 0.7.0
 * @returns {SceneJS.objects.Cube}
 */
SceneJS.objects.cube = function() {
    var n = new SceneJS.objects.Cube();
    SceneJS.objects.Cube.prototype.constructor.apply(n, arguments);
    return n;
};
SceneJS._namespace("SceneJS.objects");


/**
 * @class A scene node that defines sphere geometry.
 * <p>The geometry is complete with normals for shading and one layer of UV coordinates for
 * texture-mapping.</p>
 * <p>The radius is 1.0 -  use the SceneJS.Scale node to set the size of a Sphere.</p>
 * <p><b>Example Usage</b></p><p>Definition of sphere with a radius of 6 units:</b></p><pre><code>
 * var c = new SceneJS.objects.Sphere({
 *          slices: 30,     // Optional number of longitudinal slices (30 is default)
 *          rings: 30      // Optional number of latitudinal slices (30 is default)
 *     })
 * </pre></code>
* @extends SceneJS.Geometry
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.objects.Sphere
 * @param {Object} [cfg] Static configuration object
 * @param {float} [cfg.slices=30] Number of longitudinal slices
 * @param {float} [cfg.rings=30] Number of longitudinal slices
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.objects.Sphere = function() {
    SceneJS.Geometry.apply(this, arguments);
    this._nodeType = "sphere";
};

SceneJS._inherit(SceneJS.objects.Sphere, SceneJS.Geometry);

// @private
SceneJS.objects.Sphere.prototype._init = function(params) {
    var slices = params.slices || 30;
    var rings = params.rings || 30;

    /* Type ID ensures that we reuse any sphere that has already been created with
     * these parameters instead of wasting memory
     */
    this._type = "sphere_" + rings + "_" + slices;

    /* Callback that does the creation in case we can't find matching sphere to reuse     
     */
    this._create = function() {
        var radius = 1;
        var positions = [];
        var normals = [];
        var uv = [];
        for (var sliceNum = 0; sliceNum <= slices; sliceNum++) {
            var theta = sliceNum * Math.PI / slices;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var ringNum = 0; ringNum <= rings; ringNum++) {
                var phi = ringNum * 2 * Math.PI / rings;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (ringNum / rings);
                var v = sliceNum / slices;

                normals.push(-x);
                normals.push(-y);
                normals.push(-z);
                uv.push(u);
                uv.push(v);
                positions.push(radius * x);
                positions.push(radius * y);
                positions.push(radius * z);
            }
        }

        var indices = [];
        for (var sliceNum = 0; sliceNum < slices; sliceNum++) {
            for (var ringNum = 0; ringNum < rings; ringNum++) {
                var first = (sliceNum * (rings + 1)) + ringNum;
                var second = first + rings + 1;
                indices.push(first);
                indices.push(second);
                indices.push(first + 1);

                indices.push(second);
                indices.push(second + 1);
                indices.push(first + 1);
            }
        }

        return {
            primitive : "triangles",
            positions : positions,
            normals: normals,
            uv : uv,
            indices : indices
        };
    };
};


/** Returns a new SceneJS.objects.Sphere instance
 * @param {Object} [cfg] Static configuration object
 * @param {float} [cfg.slices=30] Number of longitudinal slices
 * @param {float} [cfg.rings=30] Number of longitudinal slices
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.objects.Sphere}
 * @since Version 0.7.0
 */
SceneJS.objects.sphere = function() {
    var n = new SceneJS.objects.Sphere();
    SceneJS.objects.Sphere.prototype.constructor.apply(n, arguments);
    return n;
};
/** Backend module that creates vector geometry repreentations of text
 *  @private
 */
SceneJS._vectorTextModule = new (function() {

    var letters = {
        ' ': { width: 16, points: [] },
        '!': { width: 10, points: [
            [5,21],
            [5,7],
            [-1,-1],
            [5,2],
            [4,1],
            [5,0],
            [6,1],
            [5,2]
        ] },
        '"': { width: 16, points: [
            [4,21],
            [4,14],
            [-1,-1],
            [12,21],
            [12,14]
        ] },
        '#': { width: 21, points: [
            [11,25],
            [4,-7],
            [-1,-1],
            [17,25],
            [10,-7],
            [-1,-1],
            [4,12],
            [18,12],
            [-1,-1],
            [3,6],
            [17,6]
        ] },
        '$': { width: 20, points: [
            [8,25],
            [8,-4],
            [-1,-1],
            [12,25],
            [12,-4],
            [-1,-1],
            [17,18],
            [15,20],
            [12,21],
            [8,21],
            [5,20],
            [3,18],
            [3,16],
            [4,14],
            [5,13],
            [7,12],
            [13,10],
            [15,9],
            [16,8],
            [17,6],
            [17,3],
            [15,1],
            [12,0],
            [8,0],
            [5,1],
            [3,3]
        ] },
        '%': { width: 24, points: [
            [21,21],
            [3,0],
            [-1,-1],
            [8,21],
            [10,19],
            [10,17],
            [9,15],
            [7,14],
            [5,14],
            [3,16],
            [3,18],
            [4,20],
            [6,21],
            [8,21],
            [10,20],
            [13,19],
            [16,19],
            [19,20],
            [21,21],
            [-1,-1],
            [17,7],
            [15,6],
            [14,4],
            [14,2],
            [16,0],
            [18,0],
            [20,1],
            [21,3],
            [21,5],
            [19,7],
            [17,7]
        ] },
        '&': { width: 26, points: [
            [23,12],
            [23,13],
            [22,14],
            [21,14],
            [20,13],
            [19,11],
            [17,6],
            [15,3],
            [13,1],
            [11,0],
            [7,0],
            [5,1],
            [4,2],
            [3,4],
            [3,6],
            [4,8],
            [5,9],
            [12,13],
            [13,14],
            [14,16],
            [14,18],
            [13,20],
            [11,21],
            [9,20],
            [8,18],
            [8,16],
            [9,13],
            [11,10],
            [16,3],
            [18,1],
            [20,0],
            [22,0],
            [23,1],
            [23,2]
        ] },
        '\'': { width: 10, points: [
            [5,19],
            [4,20],
            [5,21],
            [6,20],
            [6,18],
            [5,16],
            [4,15]
        ] },
        '(': { width: 14, points: [
            [11,25],
            [9,23],
            [7,20],
            [5,16],
            [4,11],
            [4,7],
            [5,2],
            [7,-2],
            [9,-5],
            [11,-7]
        ] },
        ')': { width: 14, points: [
            [3,25],
            [5,23],
            [7,20],
            [9,16],
            [10,11],
            [10,7],
            [9,2],
            [7,-2],
            [5,-5],
            [3,-7]
        ] },
        '*': { width: 16, points: [
            [8,21],
            [8,9],
            [-1,-1],
            [3,18],
            [13,12],
            [-1,-1],
            [13,18],
            [3,12]
        ] },
        '+': { width: 26, points: [
            [13,18],
            [13,0],
            [-1,-1],
            [4,9],
            [22,9]
        ] },
        ',': { width: 10, points: [
            [6,1],
            [5,0],
            [4,1],
            [5,2],
            [6,1],
            [6,-1],
            [5,-3],
            [4,-4]
        ] },
        '-': { width: 26, points: [
            [4,9],
            [22,9]
        ] },
        '.': { width: 10, points: [
            [5,2],
            [4,1],
            [5,0],
            [6,1],
            [5,2]
        ] },
        '/': { width: 22, points: [
            [20,25],
            [2,-7]
        ] },
        '0': { width: 20, points: [
            [9,21],
            [6,20],
            [4,17],
            [3,12],
            [3,9],
            [4,4],
            [6,1],
            [9,0],
            [11,0],
            [14,1],
            [16,4],
            [17,9],
            [17,12],
            [16,17],
            [14,20],
            [11,21],
            [9,21]
        ] },
        '1': { width: 20, points: [
            [6,17],
            [8,18],
            [11,21],
            [11,0]
        ] },
        '2': { width: 20, points: [
            [4,16],
            [4,17],
            [5,19],
            [6,20],
            [8,21],
            [12,21],
            [14,20],
            [15,19],
            [16,17],
            [16,15],
            [15,13],
            [13,10],
            [3,0],
            [17,0]
        ] },
        '3': { width: 20, points: [
            [5,21],
            [16,21],
            [10,13],
            [13,13],
            [15,12],
            [16,11],
            [17,8],
            [17,6],
            [16,3],
            [14,1],
            [11,0],
            [8,0],
            [5,1],
            [4,2],
            [3,4]
        ] },
        '4': { width: 20, points: [
            [13,21],
            [3,7],
            [18,7],
            [-1,-1],
            [13,21],
            [13,0]
        ] },
        '5': { width: 20, points: [
            [15,21],
            [5,21],
            [4,12],
            [5,13],
            [8,14],
            [11,14],
            [14,13],
            [16,11],
            [17,8],
            [17,6],
            [16,3],
            [14,1],
            [11,0],
            [8,0],
            [5,1],
            [4,2],
            [3,4]
        ] },
        '6': { width: 20, points: [
            [16,18],
            [15,20],
            [12,21],
            [10,21],
            [7,20],
            [5,17],
            [4,12],
            [4,7],
            [5,3],
            [7,1],
            [10,0],
            [11,0],
            [14,1],
            [16,3],
            [17,6],
            [17,7],
            [16,10],
            [14,12],
            [11,13],
            [10,13],
            [7,12],
            [5,10],
            [4,7]
        ] },
        '7': { width: 20, points: [
            [17,21],
            [7,0],
            [-1,-1],
            [3,21],
            [17,21]
        ] },
        '8': { width: 20, points: [
            [8,21],
            [5,20],
            [4,18],
            [4,16],
            [5,14],
            [7,13],
            [11,12],
            [14,11],
            [16,9],
            [17,7],
            [17,4],
            [16,2],
            [15,1],
            [12,0],
            [8,0],
            [5,1],
            [4,2],
            [3,4],
            [3,7],
            [4,9],
            [6,11],
            [9,12],
            [13,13],
            [15,14],
            [16,16],
            [16,18],
            [15,20],
            [12,21],
            [8,21]
        ] },
        '9': { width: 20, points: [
            [16,14],
            [15,11],
            [13,9],
            [10,8],
            [9,8],
            [6,9],
            [4,11],
            [3,14],
            [3,15],
            [4,18],
            [6,20],
            [9,21],
            [10,21],
            [13,20],
            [15,18],
            [16,14],
            [16,9],
            [15,4],
            [13,1],
            [10,0],
            [8,0],
            [5,1],
            [4,3]
        ] },
        ':': { width: 10, points: [
            [5,14],
            [4,13],
            [5,12],
            [6,13],
            [5,14],
            [-1,-1],
            [5,2],
            [4,1],
            [5,0],
            [6,1],
            [5,2]
        ] },
        ',': { width: 10, points: [
            [5,14],
            [4,13],
            [5,12],
            [6,13],
            [5,14],
            [-1,-1],
            [6,1],
            [5,0],
            [4,1],
            [5,2],
            [6,1],
            [6,-1],
            [5,-3],
            [4,-4]
        ] },
        '<': { width: 24, points: [
            [20,18],
            [4,9],
            [20,0]
        ] },
        '=': { width: 26, points: [
            [4,12],
            [22,12],
            [-1,-1],
            [4,6],
            [22,6]
        ] },
        '>': { width: 24, points: [
            [4,18],
            [20,9],
            [4,0]
        ] },
        '?': { width: 18, points: [
            [3,16],
            [3,17],
            [4,19],
            [5,20],
            [7,21],
            [11,21],
            [13,20],
            [14,19],
            [15,17],
            [15,15],
            [14,13],
            [13,12],
            [9,10],
            [9,7],
            [-1,-1],
            [9,2],
            [8,1],
            [9,0],
            [10,1],
            [9,2]
        ] },
        '@': { width: 27, points: [
            [18,13],
            [17,15],
            [15,16],
            [12,16],
            [10,15],
            [9,14],
            [8,11],
            [8,8],
            [9,6],
            [11,5],
            [14,5],
            [16,6],
            [17,8],
            [-1,-1],
            [12,16],
            [10,14],
            [9,11],
            [9,8],
            [10,6],
            [11,5],
            [-1,-1],
            [18,16],
            [17,8],
            [17,6],
            [19,5],
            [21,5],
            [23,7],
            [24,10],
            [24,12],
            [23,15],
            [22,17],
            [20,19],
            [18,20],
            [15,21],
            [12,21],
            [9,20],
            [7,19],
            [5,17],
            [4,15],
            [3,12],
            [3,9],
            [4,6],
            [5,4],
            [7,2],
            [9,1],
            [12,0],
            [15,0],
            [18,1],
            [20,2],
            [21,3],
            [-1,-1],
            [19,16],
            [18,8],
            [18,6],
            [19,5]
        ] },
        'A': { width: 18, points: [
            [9,21],
            [1,0],
            [-1,-1],
            [9,21],
            [17,0],
            [-1,-1],
            [4,7],
            [14,7]
        ] },
        'B': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [13,21],
            [16,20],
            [17,19],
            [18,17],
            [18,15],
            [17,13],
            [16,12],
            [13,11],
            [-1,-1],
            [4,11],
            [13,11],
            [16,10],
            [17,9],
            [18,7],
            [18,4],
            [17,2],
            [16,1],
            [13,0],
            [4,0]
        ] },
        'C': { width: 21, points: [
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5]
        ] },
        'D': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [11,21],
            [14,20],
            [16,18],
            [17,16],
            [18,13],
            [18,8],
            [17,5],
            [16,3],
            [14,1],
            [11,0],
            [4,0]
        ] },
        'E': { width: 19, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [17,21],
            [-1,-1],
            [4,11],
            [12,11],
            [-1,-1],
            [4,0],
            [17,0]
        ] },
        'F': { width: 18, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [17,21],
            [-1,-1],
            [4,11],
            [12,11]
        ] },
        'G': { width: 21, points: [
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5],
            [18,8],
            [-1,-1],
            [13,8],
            [18,8]
        ] },
        'H': { width: 22, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [18,21],
            [18,0],
            [-1,-1],
            [4,11],
            [18,11]
        ] },
        'I': { width: 8, points: [
            [4,21],
            [4,0]
        ] },
        'J': { width: 16, points: [
            [12,21],
            [12,5],
            [11,2],
            [10,1],
            [8,0],
            [6,0],
            [4,1],
            [3,2],
            [2,5],
            [2,7]
        ] },
        'K': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [18,21],
            [4,7],
            [-1,-1],
            [9,12],
            [18,0]
        ] },
        'L': { width: 17, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,0],
            [16,0]
        ] },
        'M': { width: 24, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [12,0],
            [-1,-1],
            [20,21],
            [12,0],
            [-1,-1],
            [20,21],
            [20,0]
        ] },
        'N': { width: 22, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [18,0],
            [-1,-1],
            [18,21],
            [18,0]
        ] },
        'O': { width: 22, points: [
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5],
            [19,8],
            [19,13],
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21]
        ] },
        'P': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [13,21],
            [16,20],
            [17,19],
            [18,17],
            [18,14],
            [17,12],
            [16,11],
            [13,10],
            [4,10]
        ] },
        'Q': { width: 22, points: [
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5],
            [19,8],
            [19,13],
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21],
            [-1,-1],
            [12,4],
            [18,-2]
        ] },
        'R': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [13,21],
            [16,20],
            [17,19],
            [18,17],
            [18,15],
            [17,13],
            [16,12],
            [13,11],
            [4,11],
            [-1,-1],
            [11,11],
            [18,0]
        ] },
        'S': { width: 20, points: [
            [17,18],
            [15,20],
            [12,21],
            [8,21],
            [5,20],
            [3,18],
            [3,16],
            [4,14],
            [5,13],
            [7,12],
            [13,10],
            [15,9],
            [16,8],
            [17,6],
            [17,3],
            [15,1],
            [12,0],
            [8,0],
            [5,1],
            [3,3]
        ] },
        'T': { width: 16, points: [
            [8,21],
            [8,0],
            [-1,-1],
            [1,21],
            [15,21]
        ] },
        'U': { width: 22, points: [
            [4,21],
            [4,6],
            [5,3],
            [7,1],
            [10,0],
            [12,0],
            [15,1],
            [17,3],
            [18,6],
            [18,21]
        ] },
        'V': { width: 18, points: [
            [1,21],
            [9,0],
            [-1,-1],
            [17,21],
            [9,0]
        ] },
        'W': { width: 24, points: [
            [2,21],
            [7,0],
            [-1,-1],
            [12,21],
            [7,0],
            [-1,-1],
            [12,21],
            [17,0],
            [-1,-1],
            [22,21],
            [17,0]
        ] },
        'X': { width: 20, points: [
            [3,21],
            [17,0],
            [-1,-1],
            [17,21],
            [3,0]
        ] },
        'Y': { width: 18, points: [
            [1,21],
            [9,11],
            [9,0],
            [-1,-1],
            [17,21],
            [9,11]
        ] },
        'Z': { width: 20, points: [
            [17,21],
            [3,0],
            [-1,-1],
            [3,21],
            [17,21],
            [-1,-1],
            [3,0],
            [17,0]
        ] },
        '[': { width: 14, points: [
            [4,25],
            [4,-7],
            [-1,-1],
            [5,25],
            [5,-7],
            [-1,-1],
            [4,25],
            [11,25],
            [-1,-1],
            [4,-7],
            [11,-7]
        ] },
        '\\': { width: 14, points: [
            [0,21],
            [14,-3]
        ] },
        ']': { width: 14, points: [
            [9,25],
            [9,-7],
            [-1,-1],
            [10,25],
            [10,-7],
            [-1,-1],
            [3,25],
            [10,25],
            [-1,-1],
            [3,-7],
            [10,-7]
        ] },
        '^': { width: 16, points: [
            [6,15],
            [8,18],
            [10,15],
            [-1,-1],
            [3,12],
            [8,17],
            [13,12],
            [-1,-1],
            [8,17],
            [8,0]
        ] },
        '_': { width: 16, points: [
            [0,-2],
            [16,-2]
        ] },
        '`': { width: 10, points: [
            [6,21],
            [5,20],
            [4,18],
            [4,16],
            [5,15],
            [6,16],
            [5,17]
        ] },
        'a': { width: 19, points: [
            [15,14],
            [15,0],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'b': { width: 19, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,11],
            [6,13],
            [8,14],
            [11,14],
            [13,13],
            [15,11],
            [16,8],
            [16,6],
            [15,3],
            [13,1],
            [11,0],
            [8,0],
            [6,1],
            [4,3]
        ] },
        'c': { width: 18, points: [
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'd': { width: 19, points: [
            [15,21],
            [15,0],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'e': { width: 18, points: [
            [3,8],
            [15,8],
            [15,10],
            [14,12],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'f': { width: 12, points: [
            [10,21],
            [8,21],
            [6,20],
            [5,17],
            [5,0],
            [-1,-1],
            [2,14],
            [9,14]
        ] },
        'g': { width: 19, points: [
            [15,14],
            [15,-2],
            [14,-5],
            [13,-6],
            [11,-7],
            [8,-7],
            [6,-6],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'h': { width: 19, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,10],
            [7,13],
            [9,14],
            [12,14],
            [14,13],
            [15,10],
            [15,0]
        ] },
        'i': { width: 8, points: [
            [3,21],
            [4,20],
            [5,21],
            [4,22],
            [3,21],
            [-1,-1],
            [4,14],
            [4,0]
        ] },
        'j': { width: 10, points: [
            [5,21],
            [6,20],
            [7,21],
            [6,22],
            [5,21],
            [-1,-1],
            [6,14],
            [6,-3],
            [5,-6],
            [3,-7],
            [1,-7]
        ] },
        'k': { width: 17, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [14,14],
            [4,4],
            [-1,-1],
            [8,8],
            [15,0]
        ] },
        'l': { width: 8, points: [
            [4,21],
            [4,0]
        ] },
        'm': { width: 30, points: [
            [4,14],
            [4,0],
            [-1,-1],
            [4,10],
            [7,13],
            [9,14],
            [12,14],
            [14,13],
            [15,10],
            [15,0],
            [-1,-1],
            [15,10],
            [18,13],
            [20,14],
            [23,14],
            [25,13],
            [26,10],
            [26,0]
        ] },
        'n': { width: 19, points: [
            [4,14],
            [4,0],
            [-1,-1],
            [4,10],
            [7,13],
            [9,14],
            [12,14],
            [14,13],
            [15,10],
            [15,0]
        ] },
        'o': { width: 19, points: [
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3],
            [16,6],
            [16,8],
            [15,11],
            [13,13],
            [11,14],
            [8,14]
        ] },
        'p': { width: 19, points: [
            [4,14],
            [4,-7],
            [-1,-1],
            [4,11],
            [6,13],
            [8,14],
            [11,14],
            [13,13],
            [15,11],
            [16,8],
            [16,6],
            [15,3],
            [13,1],
            [11,0],
            [8,0],
            [6,1],
            [4,3]
        ] },
        'q': { width: 19, points: [
            [15,14],
            [15,-7],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'r': { width: 13, points: [
            [4,14],
            [4,0],
            [-1,-1],
            [4,8],
            [5,11],
            [7,13],
            [9,14],
            [12,14]
        ] },
        's': { width: 17, points: [
            [14,11],
            [13,13],
            [10,14],
            [7,14],
            [4,13],
            [3,11],
            [4,9],
            [6,8],
            [11,7],
            [13,6],
            [14,4],
            [14,3],
            [13,1],
            [10,0],
            [7,0],
            [4,1],
            [3,3]
        ] },
        't': { width: 12, points: [
            [5,21],
            [5,4],
            [6,1],
            [8,0],
            [10,0],
            [-1,-1],
            [2,14],
            [9,14]
        ] },
        'u': { width: 19, points: [
            [4,14],
            [4,4],
            [5,1],
            [7,0],
            [10,0],
            [12,1],
            [15,4],
            [-1,-1],
            [15,14],
            [15,0]
        ] },
        'v': { width: 16, points: [
            [2,14],
            [8,0],
            [-1,-1],
            [14,14],
            [8,0]
        ] },
        'w': { width: 22, points: [
            [3,14],
            [7,0],
            [-1,-1],
            [11,14],
            [7,0],
            [-1,-1],
            [11,14],
            [15,0],
            [-1,-1],
            [19,14],
            [15,0]
        ] },
        'x': { width: 17, points: [
            [3,14],
            [14,0],
            [-1,-1],
            [14,14],
            [3,0]
        ] },
        'y': { width: 16, points: [
            [2,14],
            [8,0],
            [-1,-1],
            [14,14],
            [8,0],
            [6,-4],
            [4,-6],
            [2,-7],
            [1,-7]
        ] },
        'z': { width: 17, points: [
            [14,14],
            [3,0],
            [-1,-1],
            [3,14],
            [14,14],
            [-1,-1],
            [3,0],
            [14,0]
        ] },
        '{': { width: 14, points: [
            [9,25],
            [7,24],
            [6,23],
            [5,21],
            [5,19],
            [6,17],
            [7,16],
            [8,14],
            [8,12],
            [6,10],
            [-1,-1],
            [7,24],
            [6,22],
            [6,20],
            [7,18],
            [8,17],
            [9,15],
            [9,13],
            [8,11],
            [4,9],
            [8,7],
            [9,5],
            [9,3],
            [8,1],
            [7,0],
            [6,-2],
            [6,-4],
            [7,-6],
            [-1,-1],
            [6,8],
            [8,6],
            [8,4],
            [7,2],
            [6,1],
            [5,-1],
            [5,-3],
            [6,-5],
            [7,-6],
            [9,-7]
        ] },
        '|': { width: 8, points: [
            [4,25],
            [4,-7]
        ] },
        '}': { width: 14, points: [
            [5,25],
            [7,24],
            [8,23],
            [9,21],
            [9,19],
            [8,17],
            [7,16],
            [6,14],
            [6,12],
            [8,10],
            [-1,-1],
            [7,24],
            [8,22],
            [8,20],
            [7,18],
            [6,17],
            [5,15],
            [5,13],
            [6,11],
            [10,9],
            [6,7],
            [5,5],
            [5,3],
            [6,1],
            [7,0],
            [8,-2],
            [8,-4],
            [7,-6],
            [-1,-1],
            [8,8],
            [6,6],
            [6,4],
            [7,2],
            [8,1],
            [9,-1],
            [9,-3],
            [8,-5],
            [7,-6],
            [5,-7]
        ] },
        '~': { width: 24, points: [
            [3,6],
            [3,8],
            [4,11],
            [6,12],
            [8,12],
            [10,11],
            [14,8],
            [16,7],
            [18,7],
            [20,8],
            [21,10],
            [-1,-1],
            [3,8],
            [4,10],
            [6,11],
            [8,11],
            [10,10],
            [14,7],
            [16,6],
            [18,6],
            [20,7],
            [21,10],
            [21,12]
        ] }
    };

    // @private
    function letter(ch) {
        return letters[ch];
    }

    // @private
    function ascent(font, size) {
        return size;
    }

    // @private
    function descent(font, size) {
        return 7.0 * size / 25.0;
    }

    // @private
    function measure(font, size, str)
    {
        var total = 0;
        var len = str.length;

        for (var i = 0; i < len; i++) {
            var c = letter(str.charAt(i));
            if (c) total += c.width * size / 25.0;
        }
        return total;
    }

    // @private
    this.getGeometry = function(size, xPos, yPos, text) {
        var geo = {
            positions : [],
            indices : []
        };

        var lines = text.split("\n");
        var countVerts = 0;
        var y = yPos;

        for (var iLine = 0; iLine < lines.length; iLine++) {
            var x = xPos;

            var str = lines[iLine];

            var len = str.length;
            var mag = size / 25.0;

            for (var i = 0; i < len; i++) {
                var c = letter(str.charAt(i));
                if (c == '\n') {
                    alert("newline");
                }
                if (!c) {
                    continue;
                }

                var penUp = 1;

                var p1 = -1;
                var p2 = -1;

                var needLine = false;
                for (var j = 0; j < c.points.length; j++) {
                    var a = c.points[j];

                    if (a[0] == -1 && a[1] == -1) {
                        penUp = 1;
                        needLine = false;
                        continue;
                    }

                    geo.positions.push(x + a[0] * mag);
                    geo.positions.push(y + a[1] * mag);
                    geo.positions.push(0);


                    if (p1 == -1) {
                        p1 = countVerts;
                    } else if (p2 == -1) {
                        p2 = countVerts;
                    } else {
                        p1 = p2;
                        p2 = countVerts;
                    }
                    countVerts++;

                    if (penUp) {
                        penUp = false;
                    } else {

                        geo.indices.push(p1);
                        geo.indices.push(p2);


                    }
                    needLine = true;
                }
                x += c.width * mag;

            }
            y -= 25 * mag;
        }
        return geo;
    };

})();
/**
 * @class A scene node that defines vector text.
 * <p>.</p>
 * <p><b>Example Usage</b></p><p>Definition of text:</b></p><pre><code>
 * var c = new SceneJS.Text({
 *          text : "in morning sunlight\nrising steam from the cats yawn\n a smell of salmon"
 *     })
 * </pre></code>
 * @extends SceneJS.Geometry
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.Text
 * @param {Object} [cfg] Static configuration object
 * @param {String} cfg.text The string of text
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Text = function() {
    SceneJS.Geometry.apply(this, arguments);
    this._nodeType = "text";
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Text, SceneJS.Geometry);

// @private
SceneJS.Text.prototype._init = function(params) {

    /* Callback that creates the text geometry
     */
    this._create = function() {
        var geo = SceneJS._vectorTextModule.getGeometry(1, 0, 0, params.text); // Unit size
        return {
            primitive : "lines",
            positions : geo.positions,
            normals: [],
            uv : [],
            indices : geo.indices,
            colors:[]
        };
    };
};

/** Returns a new SceneJS.Text instance
 * @param {Object} [cfg] Static configuration object
 * @param {String} cfg.text The string of text
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Text}
 *  @since Version 0.7.3
 */
SceneJS.text = function() {
    var n = new SceneJS.Text();
    SceneJS.Text.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that manages the current view transform matrices (view and normal).
 *
 * Services the scene view transform nodes, such as SceneJS.lookAt, providing them with methods to set and
 * get the current view transform matrices.
 *
 * Interacts with the shading backend through events; on a SHADER_RENDERING event it will respond with a
 * MODEL_TRANSFORM_EXPORTED to pass the view matrix and normal matrix as WebGLFloatArrays to the
 * shading backend.
 *
 * Normal matrix and WebGLFloatArrays are lazy-computed and cached on export to avoid repeatedly regenerating them.
 *
 * Avoids redundant export of the matrices with a dirty flag; they are only exported when that is set, which occurs
 * when transform is set by scene node, or on SCENE_RENDERING, SHADER_ACTIVATED and SHADER_DEACTIVATED events.
 *
 * Whenever a scene node sets the matrix, this backend publishes it with a VIEW_TRANSFORM_UPDATED to allow other
 * dependent backends (such as "view-frustum") to synchronise their resources.
 *
 *  @private
 */
SceneJS._viewTransformModule = new (function() {

    var transform;
    var dirty;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                transform = {
                    matrix : SceneJS._math_identityMat4(),
                    fixed: true
                };
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (dirty) {
                    if (!transform.matrixAsArray) {
                        transform.matrixAsArray = new WebGLFloatArray(transform.matrix);
                    }

                    if (!transform.normalMatrixAsArray) {
                        transform.normalMatrixAsArray = new WebGLFloatArray(
                                SceneJS._math_transposeMat4(
                                        SceneJS._math_inverseMat4(transform.matrix)));
                    }

                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.VIEW_TRANSFORM_EXPORTED,
                            transform);

                    dirty = false;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                dirty = true;
            });

    this.setTransform = function(t) {
        transform = t;
        dirty = true;
        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.VIEW_TRANSFORM_UPDATED,
                transform);
    };

    this.getTransform = function() {
        return transform;
    };

})();
/**
 * Backend that manages the current modelling transform matrices (modelling and normal).
 *
 * Services the scene modelling transform nodes, such as SceneJS.rotate, providing them with methods to set and
 * get the current modelling transform matrices.
 *
 * Interacts with the shading backend through events; on a SHADER_RENDERING event it will respond with a
 * MODEL_TRANSFORM_EXPORTED to pass the modelling matrix and inverse normal matrix as WebGLFloatArrays to the
 * shading backend.
 *
 * Normal matrix and WebGLFloatArrays are lazy-computed and cached on export to avoid repeatedly regenerating them.
 *
 * Avoids redundant export of the matrices with a dirty flag; they are only exported when that is set, which occurs
 * when transform is set by scene node, or on SCENE_RENDERING, SHADER_ACTIVATED and SHADER_DEACTIVATED events.
 *
 * Whenever a scene node sets the matrix, this backend publishes it with a MODEL_TRANSFORM_UPDATED to allow other
 * dependent backends to synchronise their resources.
 *
 *  @private
 */
SceneJS._modelTransformModule = new (function() {

    var transform;
    var dirty;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                transform = {
                    matrix : SceneJS._math_identityMat4(),
                    fixed: true,
                    identity : true
                };
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (dirty) {
                    if (!transform.matrixAsArray) {
                        transform.matrixAsArray = new WebGLFloatArray(transform.matrix);
                    }
                    if (!transform.normalMatrixAsArray) {
                        transform.normalMatrixAsArray = new WebGLFloatArray(
                                SceneJS._math_transposeMat4(
                                        SceneJS._math_inverseMat4(transform.matrix)));
                    }
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.MODEL_TRANSFORM_EXPORTED,
                            transform);
                    dirty = false;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                dirty = true;
            });

    this.setTransform = function(t) {
        transform = t;
        dirty = true;
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.MODEL_TRANSFORM_UPDATED, transform);
    };

    this.getTransform = function() {
        return transform;
    };
})();
/**
 * Backend that mediates the setting/getting of the current view and model transform matrices.
 *
 * This module works as a mediator between model/iew transform nodes (such as SceneJS.Rotate, SceneJS.Translate etc)
 * and SceneJS._viewTransformModule and SceneJS._modelTransformModule.
 *
 * When recieving a transform during scene traversal when the projection transform (ie. SceneJS.Camera node) has not
 * been rendered yet, it considers the transform space to be "view" and so it sets/gets transforms on the
 * SceneJS._viewTransformModule.
 *
 * Conversely, when the projection has been rendered, it considers the transform space be "modelling" and it will
 * set/get transforms on the SceneJS._modelTransformModule.
 *
 * This module may also be queried on whether it is operating in view or model transform spaces. When in view space,
 * nodes such as SceneJS.Rotate and SceneJS.Translate will apply their transforms inversely (ie. nagated translation
 * vectors and rotation angles) so as to correctly transform the SceneJS.Camera.
 *
 *  @private
 */
SceneJS._modelViewTransformModule = new (function() {

    var viewSpaceActive = true;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                viewSpaceActive = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.PROJECTION_TRANSFORM_UPDATED,
            function(t) {
                viewSpaceActive = t.isDefault;
            });

    this.isBuildingViewTransform = function() {
        return viewSpaceActive;
    };

    this.setTransform = function(t) {
        if (viewSpaceActive) {
            SceneJS._viewTransformModule.setTransform(t);
        } else {
            SceneJS._modelTransformModule.setTransform(t);
        }
    };

    this.getTransform = function() {
        if (viewSpaceActive) {
            return SceneJS._viewTransformModule.getTransform();
        } else {
            return SceneJS._modelTransformModule.getTransform();
        }
    };
})();
/**
 * @class A scene node that applies a model-space rotation transform to the nodes within its subgraph.
 * @extends SceneJS.Node
 * <p>The rotation is described as a vector about which the rotation occurs, along with the angle or rotation in degrees.</p>
 * <p><b>Example</b></p><p>A cube rotated 45 degrees about its Y axis.</b></p><pre><code>
 * var rotate = new SceneJS.Rotate({
 *       angle: 45.0,    // Angle in degrees
 *       x: 0.0,         // Rotation vector points along positive Y axis
 *       y: 1.0,
 *       z: 0.0
 *   },
 *
 *      new SceneJS.objects.Cube()
 * )
 * </pre></code>
 * @constructor
 * Create a new SceneJS.Rotate
 * @param {Object} config  Config object or function, followed by zero or more child nodes
 */
SceneJS.Rotate = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "rotate";
    this._mat = null;
    this._xform = null;
    this._angle = 0;
    this._x = 0;
    this._y = 0;
    this._z = 1;
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Rotate, SceneJS.Node);

/** Sets the rotation angle
 * @param {float} angle Rotation angle in degrees
 * @returns {SceneJS.Rotate} this
 */
SceneJS.Rotate.prototype.setAngle = function(angle) {
    this._angle = angle || 0;
    this._memoLevel = 0;
    return this;
};

/** Returns the rotation angle
 * @returns {float} The angle in degrees
 */
SceneJS.Rotate.prototype.getAngle = function() {
    return this._angle;
};

/**
 * Sets the rotation axis vector. The vector must not be of zero length.
 * @param {object} xyz The vector - eg. {x: 0, y: 1, z: 0}
 * @returns {SceneJS.Rotate} this
 */
SceneJS.Rotate.prototype.setXYZ = function(xyz) {
    var x = xyz.x || 0;
    var y = xyz.y || 0;
    var z = xyz.z || 0;
    this._x = x;
    this._y = y;
    this._z = z;
    this._memoLevel = 0;
    return this;
};

/** Returns the rotation axis vector.
 * @returns {object} The vector, eg. {x: 0, y: 1, z: 0}
 */
SceneJS.Rotate.prototype.getXYZ = function() {
    return {
        x: this._x,
        y: this._y,
        z: this._z
    };
};

/** Sets rotation axis vector's X component
 *
 * @param x
 * @returns {SceneJS.Rotate} this
 */
SceneJS.Rotate.prototype.setX = function(x) {
    this._x = x;
    this._memoLevel = 0;
    return this;
};

/** Returns the rotation axis vector's X component

 * @returns {float}
 */
SceneJS.Rotate.prototype.getX = function() {
    return this._x;
};

/** Sets the rotation axis vector's Y component
 *
 * @param y
 * @returns {SceneJS.Rotate} this
 */
SceneJS.Rotate.prototype.setY = function(y) {
    this._y = y;
    this._memoLevel = 0;
    return this;
};

/** Returns the rotation axis vector's Y component

 * @returns {float}
 */
SceneJS.Rotate.prototype.getY = function() {
    return this._y;
};

/** Sets the rotation axis vector's Z component
 *
 * @param z
 * @returns {SceneJS.Rotate} this
 */
SceneJS.Rotate.prototype.setZ = function(z) {
    this._z = z;
    this._memoLevel = 0;
    return this;
};

/** Returns the rotation axis vector's Z component

 * @returns {float}
 */
SceneJS.Rotate.prototype.getZ = function() {
    return this._z;
};

SceneJS.Rotate.prototype._init = function(params) {
    if (params.angle) {
        this.setAngle(params.angle);
    }
    this.setXYZ({x : params.x, y: params.y, z: params.z });
};

SceneJS.Rotate.prototype._render = function(traversalContext, data) {

    var origMemoLevel = this._memoLevel;

    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
        if (this._x + this._y + this._z > 0) {

            /* When building a view transform, apply the negated rotation angle
             * to correctly transform the SceneJS.Camera
             */
            var angle = SceneJS._modelViewTransformModule.isBuildingViewTransform()
                    ? -this._angle
                    : this._angle;
            this._mat = SceneJS._math_rotationMat4v(angle * Math.PI / 180.0, [this._x, this._y, this._z]);
        } else {
            this._mat = SceneJS._math_identityMat4();
        }
    }
    var superXForm = SceneJS._modelViewTransformModule.getTransform();
    if (origMemoLevel < 2 || (!superXForm.fixed)) {
        var instancing = SceneJS._instancingModule.instancing();
        var tempMat = SceneJS._math_mulMat4(superXForm.matrix, this._mat);

        this._xform = {
            localMatrix: this._mat,
            matrix: tempMat,
            fixed: origMemoLevel == 2
        };

        if (this._memoLevel == 1 && superXForm.fixed && !instancing) {   // Bump up memoization level if model-space fixed
            this._memoLevel = 2;
        }        
    }
    SceneJS._modelViewTransformModule.setTransform(this._xform);

    this._renderNodes(traversalContext, data);

    SceneJS._modelViewTransformModule.setTransform(superXForm);
};

/** Factory function that returns a new {@link SceneJS.Rotate} instance
 */
SceneJS.rotate = function() {
    var n = new SceneJS.Rotate();
    SceneJS.Rotate.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class A scene node that applies a model-space translate transform to the nodes within its subgraph.
 * @extends SceneJS.Node
 * <p><b>Example</b></p><p>A cube translated along the X axis.</b></p><pre><code>
 * var translate = new SceneJS.Translate({
 *       x: 5.0,
 *       y: 0.0,
 *       z: 0.0
 *   },
 *
 *      new SceneJS.objects.Cube()
 * )
 * </pre></code>
 * @constructor
 * Create a new SceneJS.Translate
 * @param {Object} config  Config object or function, followed by zero or more child nodes
 */
SceneJS.Translate = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "translate";
    this._mat = null;
    this._xform = null;
    this._x = 0;
    this._y = 0;
    this._z = 1;
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Translate, SceneJS.Node);

/**
 * Sets the translation vector
 * @param {object} xyz The vector - eg. {x: 0, y: 1, z: 0}
 * @returns {SceneJS.Translate} this
 */
SceneJS.Translate.prototype.setXYZ = function(xyz) {
    var x = xyz.x || 0;
    var y = xyz.y || 0;
    var z = xyz.z || 0;
    this._x = x;
    this._y = y;
    this._z = z;
    this._memoLevel = 0;
    return this;
};

/** Returns the translation vector
 * @returns {Object} the vector, eg. {x: 0, y: 1, z: 0}
 */
SceneJS.Translate.prototype.getXYZ = function() {
    return {
        x: this._x,
        y: this._y,
        z: this._z
    };
};

/** Sets the X component of the translation vector
 *
 * @param x
 * @returns {SceneJS.Translate} this
 */
SceneJS.Translate.prototype.setX = function(x) {
    this._x = x;
    this._memoLevel = 0;
    return this;
};

/** Returns the X component of the translation vector

 * @returns {float}
 */
SceneJS.Translate.prototype.getX = function() {
    return this._x;
};

/** Sets the Y component of the translation vector
 *
 * @param y
 * @returns {SceneJS.Translate} this
 */
SceneJS.Translate.prototype.setY = function(y) {
    this._y = y;
    this._memoLevel = 0;
    return this;
};

/** Returns the Y component of the translation vector

 * @returns {float}
 */
SceneJS.Translate.prototype.getY = function() {
    return this._y;
};

/** Sets the Z component of the translation vector
 *
 * @param z
 * @returns {SceneJS.Translate} this
 */
SceneJS.Translate.prototype.setZ = function(z) {
    this._z = z;
    this._memoLevel = 0;
    return this;
};

/** Gets the Z component of the translation vector

 * @returns {float}
 */
SceneJS.Translate.prototype.getZ = function() {
    return this._z;
};

SceneJS.Translate.prototype._init = function(params) {
    this.setXYZ({x : params.x, y: params.y, z: params.z });
};

SceneJS.Translate.prototype._render = function(traversalContext, data) {
    var origMemoLevel = this._memoLevel;

    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
        if (SceneJS._modelViewTransformModule.isBuildingViewTransform()) {

            /* When building a view transform, apply the negated translation vector
             * to correctly transform the SceneJS.Camera
             */
            this._mat = SceneJS._math_translationMat4v([-this._x, -this._y, -this._z]);
        } else {
            this._mat = SceneJS._math_translationMat4v([this._x, this._y, this._z]);
        }
    }
    var superXForm = SceneJS._modelViewTransformModule.getTransform();
    if (origMemoLevel < 2 || (!superXForm.fixed)) {
        var instancing = SceneJS._instancingModule.instancing();
      
        var tempMat = SceneJS._math_mulMat4(superXForm.matrix, this._mat);
        this._xform = {
            localMatrix: this._mat,
            matrix: tempMat,
            fixed: origMemoLevel == 2
        };

        if (this._memoLevel == 1 && superXForm.fixed && !instancing) {   // Bump up memoization level if model-space fixed
            this._memoLevel = 2;
        }
    }
    SceneJS._modelViewTransformModule.setTransform(this._xform);
    this._renderNodes(traversalContext, data);
    SceneJS._modelViewTransformModule.setTransform(superXForm);
};

/** Factory function that returns a new {@link SceneJS.Translate} instance
 */
SceneJS.translate = function() {
    var n = new SceneJS.Translate();
    SceneJS.Translate.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class A scene node that applies a model-space scale transform to the nodes within its subgraph.
 * @extends SceneJS.Node
 * <p><b>Example</b></p><p>A cube scaled to become a flat square tile.</b></p><pre><code>
 * var scale = new SceneJS.Scale({
 *       x: 5.0,
 *       y: 5.0,
 *       z: 0.5
 *   },
 *
 *      new SceneJS.objects.Cube()
 * )
 * </pre></code>
 * @constructor
 * Create a new SceneJS.Scale
 * @param {Object} config  Config object or function, followed by zero or more child nodes
 */
SceneJS.Scale = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "scale";
    this._mat = null;
    this._xform = null;
    this._x = 0;
    this._y = 0;
    this._z = 1;
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Scale, SceneJS.Node);

/**
 * Sets all scale factors.
 * @param {object} xyz The factors - eg. {x: 0, y: 1, z: 0}
 * @returns {SceneJS.Scale} this
 */
SceneJS.Scale.prototype.setXYZ = function(xyz) {
    this._x = (xyz.x != undefined) ? xyz.x : 0;
    this._y = (xyz.y != undefined) ? xyz.y : 0;
    this._z = (xyz.z != undefined) ? xyz.z : 0;
    this._memoLevel = 0;
    return this;
};

/** Returns the scale factors.
 * @returns {Object} the factors, eg. {x: 0, y: 1, z: 0}
 */
SceneJS.Scale.prototype.getXYZ = function() {
    return {
        x: this._x,
        y: this._y,
        z: this._z
    };
};

/** Sets the X scale factor
 *
 * @param x
 * @returns {SceneJS.Scale} this
 */
SceneJS.Scale.prototype.setX = function(x) {
    this._x = (x != undefined) ? x : 1.0;
    this._memoLevel = 0;
    return this;
};

/** Returns the X scale factor

 * @returns {float}
 */
SceneJS.Scale.prototype.getX = function() {
    return this._x;
};

/** Sets the Y scale factor
 *
 * @param y
 * @returns {SceneJS.Scale} this
 */
SceneJS.Scale.prototype.setY = function(y) {
    this._y = (y != undefined) ? y : 1.0;
    this._memoLevel = 0;
    return this;
};

/** Returns the Y scale factor

 * @returns {float}
 */
SceneJS.Scale.prototype.getY = function() {
    return this._y;
};

/** Sets the Z scale factor
 *
 * @param z
 * @returns {SceneJS.Scale} this
 */
SceneJS.Scale.prototype.setZ = function(z) {
    this._z = (z != undefined) ? z : 1.0;
    this._memoLevel = 0;
    return this;
};

/** Gets the Z scale factor

 * @returns {float}
 */
SceneJS.Scale.prototype.getZ = function() {
    return this._z;
};

SceneJS.Scale.prototype._init = function(params) {
    this.setXYZ({x : params.x, y: params.y, z: params.z });
};

SceneJS.Scale.prototype._render = function(traversalContext, data) {

    var origMemoLevel = this._memoLevel;

    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
        this._mat = SceneJS._math_scalingMat4v([this._x, this._y, this._z]);
    }
    var superXform = SceneJS._modelViewTransformModule.getTransform();
    if (origMemoLevel < 2 || (!superXform.fixed)) {
        var instancing = SceneJS._instancingModule.instancing();

        var tempMat = SceneJS._math_mulMat4(superXform.matrix, this._mat);
        this._xform = {
            localMatrix: this._mat,
            matrix: tempMat,
            fixed: origMemoLevel == 2
        };

        if (this._memoLevel == 1 && superXform.fixed && !instancing) {   // Bump up memoization level if model-space fixed
            this._memoLevel = 2;
        }
    }
    SceneJS._modelViewTransformModule.setTransform(this._xform);
    this._renderNodes(traversalContext, data);
    SceneJS._modelViewTransformModule.setTransform(superXform);
};

/** Factory function that returns a new {@link SceneJS.Scale} instance
 */
SceneJS.scale = function() {
    var n = new SceneJS.Scale();
    SceneJS.Scale.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class A scene node that defines a 4x4 matrix to transform the nodes within its subgraph.
 * @extends SceneJS.Node
 * <p><b>Example</b></p><p>A cube translated along the X, Y and Z axis.</b></p><pre><code>
 * var mat = new SceneJS.Matrix({
 *       elements : [
 *              1, 0, 0, 10,
 *              0, 1, 0, 5,
 *              0, 0, 1, 3,
 *              0, 0, 0, 1
 *          ]
 *   },
 *
 *      new SceneJS.objects.Cube()
 * )
 * </pre></code>
 * @constructor
 * Create a new SceneJS.Matrix
 * @param {Object} config  Config object or function, followed by zero or more child nodes
 */
SceneJS.Matrix = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "matrix";
    this._mat = SceneJS._math_identityMat4();
    this._xform = null;
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Matrix, SceneJS.Node);

/**
 * Sets the matrix elements
 * @param {Array} elements One-dimensional array of matrix elements
 * @returns {SceneJS.Matrix} this
 */
SceneJS.Matrix.prototype.setElements = function(elements) {
    if (!elements) {
        throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException("SceneJS.Matrix elements undefined"));
    }
    if (elements.length != 16) {
        throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException("SceneJS.Matrix elements should number 16"));
    }
    for (var i = 0; i < 16; i++) {
        this._mat[i] = elements[i];
    }
    this._memoLevel = 0;
    return this;
};

/** Returns the matrix elements
 * @returns {Object} One-dimensional array of matrix elements
 */
SceneJS.Matrix.prototype.getElements = function() {
    var elements = new Array(16);
    for (var i = 0; i < 16; i++) {
        elements[i] = this._mat[i];
    }
    return elements;
};

SceneJS.Matrix.prototype._init = function(params) {
    if (params.elements) {
        this.setElements(params.elements);
    }
};

SceneJS.Matrix.prototype._render = function(traversalContext, data) {
    var origMemoLevel = this._memoLevel;

    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
    }
    var superXform = SceneJS._modelViewTransformModule.getTransform();
    if (origMemoLevel < 2 || (!superXform.fixed)) {
        var instancing = SceneJS._instancingModule.instancing();

        /* When building a view transform, apply the inverse of the matrix
         * to correctly transform the SceneJS.Camera
         */
        var mat = SceneJS._modelViewTransformModule.isBuildingViewTransform()
                ? SceneJS._math_inverseMat4(this._mat)
                : this._mat;

        var tempMat = SceneJS._math_mulMat4(superXform.matrix, mat);

        this._xform = {
            localMatrix: this._mat,
            matrix: tempMat,
            fixed: origMemoLevel == 2
        };

        if (this._memoLevel == 1 && superXform.fixed && !instancing) {   // Bump up memoization level if model-space fixed
            this._memoLevel = 2;
        }
    }
    SceneJS._modelViewTransformModule.setTransform(this._xform);
    this._renderNodes(traversalContext, data);
    SceneJS._modelViewTransformModule.setTransform(superXform);
};

/** Factory function that returns a new {@link SceneJS.Matrix} instance
 */
SceneJS.matrix = function() {
    var n = new SceneJS.Matrix();
    SceneJS.Matrix.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class Scene node that provides a quaternion-encoded rotation.
 *
 * <p>This node provides a convenient way to define a 3D rotation that can be rotated continually on any axis without
 * gimbal lock or significant numeric instability.</p>
 * <p><b>Example 1</b></p><p>Below is a Quaternion created from an "axis-angle" representation given as an axis to
 * rotate about, along with an angle in degrees. The optional <em>rotations</em> parameter defines a sequence of
 * rotations to then rotate the quaternion by. Finally, we apply one more rotation to the Quaternion node instance
 * through its {@link #rotate} method. </p>
 * </p><pre><code>
 * var q = new SceneJS.Quaternion({
 *
 *         // "Base" rotation
 *
 *         x : 0.0, y : 0.0, z : 0.0, angle : 0.0,      // No rotation, sets identity quaternion
 *
 *         // Sequence of rotations to apply on top of the base rotation
 *
 *         rotations: [
 *                 { x : 0, y : 0, z : 1, angle : 45 }, // Rotate 45 degrees about Z the axis
 *                 { x : 1, y : 0, z : 0, angle : 20 }, // Rotate 20 degrees about X the axis
 *                 { x : 0, y : 1, z : 0, angle : 90 }, // Rotate 90 degrees about Y the axis
 *              ]
 *          },
 *
 *          // .. Child nodes ...
 *     });
 *
 * // rotate one more time, 15 degrees about the Z axis
 *
 * q.rotate({ x : 0, y : 0, z : 1, angle : 15 });
 * </pre></code>
 * <p>Quaternions are designed to be animated. Typically, we would dynamically provide rotation updates to them at
 * render time, either from an interpolator node or human interaction.</p>
 * <p><b>Example 2</b></p><p>Below is a Quaternion that is dynamically configured with a callback that applies
 * rotation updates that are injected into the scene each time it is rendered. Note that the callback does not define
 * the base rotation - if it did, then the Quaternion would reset before each new rotation is applied, rather than
 * accumulate the rotations as intended. Note that the rotations could be generated by mouse drags to simulate
 * a trackball.</p>
 * <pre><code>
 *  var exampleScene = new SceneJS.Scene(
 *
 *      // ... sibling nodes
 *
 *      new SceneJS.Quaternion(
 *            function(data) {
 *                      return {
 *                         rotations: data.get("rotations");
 *                      };
 *           },
 *
 *           // ... chld nodes ...
 *      )
 *
 *      //... sibling nodes
 * );
 *
 * exampleScene.render({ rotations: [ { x : 0, y : 0, z : 1, angle : 45 } ] });
 * exampleScene.render({ rotations: [ { x : 1, y : 0, z : 0, angle : 20 } ] });
 * exampleScene.render({ rotations: [ { x : 0, y : 1, z : 0, angle : 90 } ] });
 * </code></pre>
 * @extends SceneJS.Node
 * @constructor
 * Create a new SceneJS.Quaternion
 * @param {Object} [cfg] Static configuration object
 * @param {float} [cfg.x=0.0] Base rotation vector X axis
 * @param {float} [cfg.y=0.0] Base rotation vector Y axis
 * @param {float} [cfg.z=0.0] Base rotation vector Z axis
 * @param {float} [cfg.angle=0.0] Base rotation angle in degrees
 * @param {[{x:float, y:float, z:float, angle:float}]} [cfg.rotations=[]] Sequence of rotations to apply on top of the base rotation
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function that can return the same signature as the static config
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Quaternion = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "quaternion";
    this._mat = null;
    this._xform = null;
    this._q = SceneJS._math_identityQuaternion();
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Quaternion, SceneJS.Node);

///** Sets the quaternion properties. This method resets the quaternion to it's default
// * { x: 0, y: 0, z: 0, w: 1 } when you supply no argument.
// *
// * @param {Object} [q={ x: 0, y: 0, z: 0, w: 1  }] Quaternion properties
// * @param {float} [q.x=0.0] Quaternion x component
// * @param {float} [q.y=0.0] Quaternion y component
// * @param {float} [q.z=0.0] Quaternion z component
// * @param {float} [q.w=1.0] Quaternion w component
// * @returns {SceneJS.Quaternion} this
// */
//SceneJS.Quaternion.prototype.setQuaternion = function(q) {
//    q = q || {};
//    this._q = [ q.x || 0, q.y || 0, q.z || 0, (q.w == undefined || q.w == null) ? 1 : q.w];
//    this._memoLevel = 0;
//    return this;
//};
//
///** Returns the quaternion properties
// *
// * @returns {{ x: float, y: float, z: float, w: float }} Quaternion properties
// */
//SceneJS.Quaternion.prototype.getQuaternion = function() {
//    return {
//        x: this._q[0],
//        y: this._q[1],
//        z: this._q[2],
//        w: this._q[3]
//    };
//};
//
///** Multiplies the quaternion by another.
// *
// * @param {Object} [q={ x: 0, y: 0, z: 0, w: 1  }] Quaternion properties
// * @param {float} [q.x=0.0] Quaternion x component
// * @param {float} [q.y=0.0] Quaternion y component
// * @param {float} [q.z=0.0] Quaternion z component
// * @param {float} [q.w=1.0] Quaternion w component
// * @returns {SceneJS.Quaternion} this
// */
//SceneJS.Quaternion.prototype.multiply = function(q) {
//    this._q = SceneJS._math_mulQuaternions(SceneJS._math_angleAxisQuaternion(q.x || 0, q.y || 0, q.z || 0, q.angle || 0), this._q);
//    this._memoLevel = 0;
//    return this;
//};

/**
 * Sets the quaternion properties in terms of a rotation axis and an angle in degrees.
 * This method resets the quaternion to the identity quaternion when you supply no arguments.
 *
 * @param {Object} [q={ x: 0, y: 0, z: 0, angle: 1  }] Rotation vector and angle in degrees
 * @param {float} [q.x=0.0] Rotation vector X axis
 * @param {float} [q.y=0.0] Rotation vector Y axis
 * @param {float} [q.z=0.0] Rotation vector Z axis
 * @param {float} [q.angle=0.0] Rotation angle in degrees
 * @returns {SceneJS.Quaternion} this
 */
SceneJS.Quaternion.prototype.setRotation = function(q) {
    q = q || {};
    this._q = SceneJS._math_angleAxisQuaternion(q.x || 0, q.y || 0, q.z || 0, q.angle || 0);
    this._memoLevel = 0;
    return this;
};

/** Returns the quaternion properties in terms of a rotation axis and an angle in degrees.
 *
 * @returns {{ x: float, y: float, z: float, angle: float }} Quaternion properties as rotation axis and angle
 */
SceneJS.Quaternion.prototype.getRotation = function() {
    return SceneJS._math_angleAxisFromQuaternion(this._q);
};

/**
 * Applies a rotation to the quaternion. This effectively rotates the quaternion by another quaternion
 * that is defined in terms of a rotation axis and angle in degrees.
 *
 * @param {Object} [q={ x: 0, y: 0, z: 0, angle: 0 }] Rotation vector and angle in degrees
 * @param {float} [q.x=0.0] Rotation vector X axis
 * @param {float} [q.y=0.0] Rotation vector Y axis
 * @param {float} [q.z=0.0] Rotation vector Z axis
 * @param {float} [q.angle=0.0] Rotation angle in degrees
 * @returns {SceneJS.Quaternion} this
 */
SceneJS.Quaternion.prototype.rotate = function(q) {
    this._q = SceneJS._math_mulQuaternions(SceneJS._math_angleAxisQuaternion(q.x || 0, q.y || 0, q.z || 0, q.angle || 0), this._q);
    this._memoLevel = 0;
    return this;
};


/** Returns the 4x4 matrix
 *
 */
SceneJS.Quaternion.prototype.getMatrix = function() {
    return SceneJS._math_newMat4FromQuaternion(this._q)
};


/** Normalises the quaternion.
 *
 * @returns {SceneJS.Quaternion} this
 */
SceneJS.Quaternion.prototype.normalize = function() {
    this._q = SceneJS._math_normalizeQuaternion(this._q);
    this._memoLevel = 0;
    return this;
};

SceneJS.Quaternion.prototype._init = function(params) {
    if (params.x || params.y || params.x || params.angle || params.w) {
        this.setRotation(params);
    }
    if (params.rotations) {
        for (var i = 0; i < params.rotations.length; i++) {
            this.rotate(params.rotations[i]);
        }
    }
};

SceneJS.Quaternion.prototype._render = function(traversalContext, data) {
    var origMemoLevel = this._memoLevel;

    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
        this._mat = SceneJS._math_newMat4FromQuaternion(this._q);
    }
    var superXform = SceneJS._modelViewTransformModule.getTransform();
    if (origMemoLevel < 2 || (!superXform.fixed)) {
        var instancing = SceneJS._instancingModule.instancing();
        var tempMat = SceneJS._math_mulMat4(superXform.matrix, this._mat);

        this._xform = {
            localMatrix: this._mat,
            matrix: tempMat,
            fixed: origMemoLevel == 2
        };

        if (this._memoLevel == 1 && superXform.fixed && !instancing) {   // Bump up memoization level if model-space fixed
            this._memoLevel = 2;
        }
    }
    SceneJS._modelViewTransformModule.setTransform(this._xform);
    this._renderNodes(traversalContext, data);
    SceneJS._modelViewTransformModule.setTransform(superXform);
};

/**Factory function that returns a new {@link SceneJS.Quaternion} instance
 */
SceneJS.quaternion = function() {
    var n = new SceneJS.Quaternion();
    SceneJS.Quaternion.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class A scene node that defines a viewing transform by specifing location of the eye position, the point being looked
 * at, and the direction of "up".
 * @extends SceneJS.Node
 * <p><b>Usage Example:</b></p><p>Defining perspective, specifying parameters that happen to be the default values</b></p><pre><code>
 * var l = new SceneJS.LookAt({
 *     eye : { x: 0.0, y: 10.0, z: -15 },
 *    look : { y:1.0 },
 *    up : { y: 1.0 },
 *
 * // .. Child nodes ...
 *
 * </pre></code>
 *
 * @constructor
 * Create a new SceneJS.LookAt
 * @param {Object} cfg  Config object or function, followed by zero or more child nodes
 */
SceneJS.LookAt = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "lookat";
    this._mat = null;
    this._xform = null;

    this._eyeX = 0;
    this._eyeY = 0;
    this._eyeZ = 1;

    this._lookX = 0;
    this._lookY = 0;
    this._lookZ = 0;

    this._upX = 0;
    this._upY = 1;
    this._upZ = 0;

    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.LookAt, SceneJS.Node);

/** Sets the eye position.
 * Don't allow this position to be the same as the position being looked at.
 *
 * @param {Object} eye - Eg. { x: 0.0, y: 10.0, z: -15 }
 * @returns {SceneJS.LookAt} this
 */
SceneJS.LookAt.prototype.setEye = function(eye) {
    this._eyeX = eye.x || 0;
    this._eyeY = eye.y || 0;
    this._eyeZ = eye.z || 1;
    this._memoLevel = 0;
    return this;
};

/** Returns the eye position.
 *
 * @returns {Object} Eye position - Eg. { x: 0.0, y: 10.0, z: -15 }
 */
SceneJS.LookAt.prototype.getEye = function() {
    return {
        x: this._eyeX,
        y: this._eyeY,
        z: this._eyeZ
    };
};

/** Sets the point being looked at.
 * Don't allow this point to be the same as the eye position.
 *
 * @param {Object} look - Eg. { x: 0.0, y: 2.0, z: 0.0 }
 * @returns {SceneJS.LookAt} this
 */
SceneJS.LookAt.prototype.setLook = function(look) {
    this._lookX = look.x || 0;
    this._lookY = look.y || 0;
    this._lookZ = look.z || 0;
    this._memoLevel = 0;
    return this;
};

/** Returns the position being looked at.
 * @returns {Object} Point looked at - Eg. { x: 0.0, y: 2.0, z: 0.0 }
 */
SceneJS.LookAt.prototype.getLook = function() {
    return {
        x: this._lookX,
        y: this._lookY,
        z: this._lookZ
    };
};

/** Sets the "up" vector - the direction that is considered "upwards".
 *
 * @param {Object} up - Eg. { x: 0.0, y: 1.0, z: 0.0 }
 * @returns {SceneJS.LookAt} this
 */
SceneJS.LookAt.prototype.setUp = function(up) {
    var x = up.x || 0;
    var y = up.y || 0;
    var z = up.z || 0;
    if (x + y + z == 0) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException(
                        "SceneJS.lookAt up vector is zero length - at least one of its x,y and z components must be non-zero"));
    }
    this._upX = x;
    this._upY = y;
    this._upZ = z;
    this._memoLevel = 0;
    return this;
};


/** Returns the "up" vector - the direction that is considered "upwards".
 *
 * @returns {Object} Up vector - Eg. { x: 0.0, y: 1.0, z: 0.0 }
 */
SceneJS.LookAt.prototype.getUp = function() {
    return {
        x: this._upX,
        y: this._upY,
        z: this._upZ
    };
};

SceneJS.LookAt.prototype._init = function(params) {
    if (params.eye) {
        this.setEye(params.eye);
    }
    if (params.look) {
        this.setLook(params.look);
    }
    if (params.up) {
        this.setUp(params.up);
    }
};

SceneJS.LookAt.prototype._render = function(traversalContext, data) {
    var origMemoLevel = this._memoLevel;

    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
        this._mat = SceneJS._math_lookAtMat4c(
                this._eyeX, this._eyeY, this._eyeZ,
                this._lookX, this._lookY, this._lookZ,
                this._upX, this._upY, this._upZ);
    }
    var superXform = SceneJS._modelViewTransformModule.getTransform();
    if (origMemoLevel < 2 || (!superXform.fixed)) {

        var tempMat = SceneJS._math_mulMat4(superXform.matrix, this._mat);

        this._xform = {
            type: "lookat",
            matrix: tempMat,
            lookAt : {
                eye: { x: this._eyeX, y: this._eyeY, z: this._eyeZ },
                look: { x: this._lookX, y: this._lookY, z: this._lookZ },
                up:  { x: this._upX, y: this._upY, z: this._upZ }
            },
            fixed: origMemoLevel == 2
        };
        
        if (this._memoLevel == 1 && superXform.fixed && !SceneJS._instancingModule.instancing()) {   // Bump up memoization level if space fixed
            this._memoLevel = 2;
        }
    }
    SceneJS._modelViewTransformModule.setTransform(this._xform);
    this._renderNodes(traversalContext, data);
    SceneJS._modelViewTransformModule.setTransform(superXform);
};

/** Factory function that returns a new {@link SceneJS.LookAt} instance
 */
SceneJS.lookAt = function() {
    var n = new SceneJS.LookAt();
    SceneJS.LookAt.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class A Scene node that defines a region within a {@link SceneJS.LookAt} in which the translations specified by that node have no effect.
 * @extends SceneJS.Node
 *
 * <p> As the parameters of the {@link SceneJS.LookAt} are modified, the content in the subgraph
 * of this node will rotate about the eye position, but will not translate as the eye position moves. You could therefore
 * define a skybox within the subgraph of this node, that will always stay in the distance.</p>
 *
 * <p><b>Example:</b></p><p>A box that the eye position never appears to move outside of</b></p><pre><code>
 * var l = new SceneJS.LookAt({
 *     eye  : { x: 0.0, y: 10.0, z: -15 },
 *     look : { y:1.0 },
 *     up   : { y: 1.0 },
 *
 *      new SceneJS.Stationary(
 *          new SceneJS.Scale({ x: 100.0, y: 100.0, z: 100.0 },
 *              new SceneJS.objects.Cube()
 *          )
 *      )
 *  )
 *
 * </pre></code>
 *
 *  @constructor
 * Create a new SceneJS.Stationary
 * @param {args} args Zero or more child nodes
 */
SceneJS.Stationary = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "stationary";
    this._xform = null;
};

SceneJS._inherit(SceneJS.Stationary, SceneJS.Node);

SceneJS.Stationary.prototype._render = function(traversalContext, data) {

    var origMemoLevel = this._memoLevel;

    var superXform = SceneJS._viewTransformModule.getTransform();
    var lookAt = superXform.lookAt;
    if (lookAt) {
        if (this._memoLevel == 0 || (!superXform.fixed)) {

            this._xform = {
                matrix: SceneJS._math_mulMat4(
                        superXform.matrix,
                        SceneJS._math_translationMat4c(
                                lookAt.eye.x,
                                lookAt.eye.y,
                                lookAt.eye.z)),
                lookAt: lookAt,
                fixed: origMemoLevel == 1
            };

            if (superXform.fixed && !SceneJS._instancingModule.instancing()) {
                this._memoLevel = 1;
            }
        }
        SceneJS._viewTransformModule.setTransform(this._xform);
        this._renderNodes(traversalContext, data);
        SceneJS._viewTransformModule.setTransform(superXform);
    } else {
        this._renderNodes(traversalContext, data);
    }
};


/** Factory function that returns a new {@link SceneJS.Stationary} instance
 */
SceneJS.stationary = function() {
    var n = new SceneJS.Stationary();
    SceneJS.Stationary.prototype.constructor.apply(n, arguments);
    return n;
};

/**
 * @class A scene node that inverts the transformations (IE. the model/view matrix) defined by the nodes within its subgraph.
 * @extends SceneJS.Node
 * <p><b>Example</b></p><p>Inverting the transformation defined by a {@link SceneJS.Matrix) child node:</b></p><pre><code>
 * var inverse = new SceneJS.Inverse(
 *     new SceneJS.Matrix({
 *           elements : [
 *                  1, 0, 0, 10,
 *                  0, 1, 0, 5,
 *                  0, 0, 1, 3,
 *                  0, 0, 0, 1
 *              ]
 *        })
 *   })
 * </pre></code>
 * @constructor
 * Create a new SceneJS.Inverse
 * @param {Object} config  Config object or function, followed by zero or more child nodes
 */
SceneJS.Inverse = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "inverse";
    this._mat = SceneJS._math_identityMat4();
    this._xform = null;
};

SceneJS._inherit(SceneJS.Inverse, SceneJS.Node);

SceneJS.Inverse.prototype._render = function(traversalContext, data) {
    var origMemoLevel = this._memoLevel;

    if (this._memoLevel == 0) {
        this._memoLevel = 1; // For consistency with other transform nodes
    }
    var superXform = SceneJS._modelViewTransformModule.getTransform();
    if (origMemoLevel < 2 || (!superXform.fixed)) {
        var instancing = SceneJS._instancingModule.instancing();
        var tempMat = SceneJS._math_inverseMat4(superXform.matrix, this._mat);

        this._xform = {
            localMatrix: this._mat,
            matrix: tempMat,
            fixed: origMemoLevel == 2
        };

        if (this._memoLevel == 1 && superXform.fixed && !instancing) {   // Bump up memoization level if model-space fixed
            this._memoLevel = 2;
        }
    }
    SceneJS._modelViewTransformModule.setTransform(this._xform);
    this._renderNodes(traversalContext, data);
    SceneJS._modelViewTransformModule.setTransform(superXform);
};

/** Factory function that returns a new {@link SceneJS.Inverse} instance
 */
SceneJS.inverse = function() {
    var n = new SceneJS.Inverse();
    SceneJS.Inverse.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that manages the current projection transform matrix.
 *
 * Services the scene projection transform nodes, such as SceneJS.frustum, providing them with methods to set and
 * get the current projection matrix.
 *
 * Interacts with the shading backend through events; on a SHADER_RENDERING event it will respond with a
 * PROJECTION_TRANSFORM_EXPORTED to pass the projection matrix as a WebGLFloatArray to the shading backend.
 *
 * The WebGLFloatArray is lazy-computed and cached on export to avoid repeatedly regenerating it.
 *
 * Avoids redundant export of the matrix with a dirty flag; the matrix is only exported when the flag is set, which
 * occurs when the matrix is set by scene node, or on SCENE_RENDERING, SHADER_ACTIVATED and SHADER_DEACTIVATED events.
 *
 * Whenever a scene node sets the matrix, this backend publishes it with a PROJECTION_TRANSFORM_UPDATED to allow other
 * dependent backends (such as "view-frustum") to synchronise their resources.
 *
 *  @private
 */
SceneJS._projectionModule = new (function() {

    var transform;
    var dirty;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                transform = {
                    matrix : SceneJS._math_identityMat4(),
                    isDefault : true,
                    fixed: true
                };
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (dirty) {
                    if (!transform.matrixAsArray) {
                        transform.matrixAsArray = new WebGLFloatArray(transform.matrix);
                    }
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.PROJECTION_TRANSFORM_EXPORTED,
                            transform);
                    dirty = false;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                dirty = true;
            });

    this.setTransform = function(t) {
        transform = t;
        dirty = true;
        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.PROJECTION_TRANSFORM_UPDATED,
                transform);
    };

    this.getTransform = function() {
        return transform;
    };
})();
/**
 * @class A scene node that defines a view of the nodes within its subgraph.
 *
 * <h2>Position and Orientation</h2>
 * <p>A Camera is oriented such that the local +X is to the right, the lens looks down the local -Z axis, and the top
 * points up the +Y axis. Its orientation and location may be transformed by defining it within transform nodes. The example
 * below defines a perspective Camera that is positioned using using a {@link SceneJS.LookAt}:</p><pre><code>
 * var exampleScene = new SceneJS.Scene({ ... },
 *
 *    // Viewing transform specifies eye position, looking
 *    // at the origin by default
 *
 *    SceneJS.lookAt({
 *           eye : { x: 0.0, y: 10.0, z: -10 },
 *           look : { y:1.0 },
 *           up : { y: 1.0 }
 *        },
 *
 *        new SceneJS.Camera({
 *              optics: {
 *                 type   : "perspective",
 *                 fovy   : 60.0,           // Horizontal field of view in degrees
 *                 aspect : 1.0,            // Aspect ratio of the field of view
 *                 near   : 0.10,           // Distance of the near clipping plane
 *                 far    : 10000.0         // Distance of the far clipping plane
 *              }
 *           },
 *
 *           // ... child nodes
 *        )
 *     )
 * )
 * </pre></code>
 *
 * <h2>Optics</h2>
 * <p>As you saw in the above example, a Camera has an <em>optics</em> property that defines the way that it projects light to
 * form the view. Supported types are described below.</p>
 *
 * <p><b>Perspective </b></p><p>Perspective projection embodies the appearance of objects relative to their
 * distance from the view point. It implicitly defines a frustum that embodies the view volume. The example below sets
 * the default properties for a projection:</p><pre><code>
 * var p = new SceneJS.Camera({
 *       optics: {
 *           type   : "perspective",
 *           fovy   : 60.0,           // Horizontal field of view in degrees
 *           aspect : 1.0,            // Aspect ratio of the field of view
 *           near   : 0.10,           // Distance of the near clipping plane
 *           far    : 10000.0         // Distance of the far clipping plane
 *       },
 *
 *       // ... child nodes
 * )
 * </pre></code>
 *
 * <p><b>Frustum</b></p><p>Frustum projection is effectively the same as perspective, providing you with the ability
 * to explicitly set the view frustum, which can be useful if you want it to be asymmetrical. The example below sets
 * the default properties for a frustum:</p><pre><code>
 * var p = new SceneJS.Camera({
 *       optics: {
 *           type   : "frustum",
 *           left   : -0.02,
 *           bottom : -0.02,
 *           near   :  0.1,
 *           right  :  0.02,
 *           top    :  0.02,
 *           far    :  1000.0
 *       },
 *
 *       // ... child nodes
 * )
 * </pre></code>
 *
 * <p><b>Ortho</b></p><p>Orthographic, or parallel, projections consist of those that involve no perspective correction.
 * There is no adjustment for distance from the camera made in these projections, meaning objects on the screen
 * will appear the same size no matter how close or far away they are. The example below specifies the default view
 * volume for orthographic projection:</p><pre><code>
 * var p = new SceneJS.Camera({
 *       optics: {
 *           type   : "ortho",
 *           left : -1.0,
 *           right : 1.0,
 *           bottom : -1.0,
 *           top : 1.0,
 *           near : 0.1,
 *           far : 1000.0
 *    },
 *
 *    // ... child nodes
 * )
 * </pre></code>
 *
 * @extends SceneJS.Node
 * @constructor
 * Create a new SceneJS.Camera
 * @param {Object} cfg  Config object or function, followed by zero or more child nodes
 */
SceneJS.Camera = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "camera";
    this._optics = {
        type: "perspective",
        fovy : 60.0,
        aspect : 1.0,
        near : 0.10,
        far : 5000.0
    };
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Camera, SceneJS.Node);

/**
 * Sets projection properties on the camera.
 *
 * @param {Object} optics Projection properties
 * @returns {SceneJS.Camera} this
 */
SceneJS.Camera.prototype.setOptics = function(optics) {
    if (optics.type == "ortho") {
        this._optics = {
            type: optics.type,
            left : optics.left || -1.0,
            bottom : optics.bottom || -1.0,
            near : optics.near || 0.1,
            right : optics.right || 1.00,
            top : optics.top || 1.0,
            far : optics.far || 5000.0
        };
    } else if (optics.type == "frustum") {
        this._optics = {
            type: optics.type,
            left : optics.left || -1.0,
            bottom : optics.bottom || -1.0,
            near : optics.near || 0.1,
            right : optics.right || 1.00,
            top : optics.top || 1.0,
            far : optics.far || 5000.0
        };
    } else  if (optics.type == "perspective") {
        this._optics = {
            type: optics.type,
            fovy : optics.fovy || 60.0,
            aspect: optics.aspect || 1.0,
            near : optics.near || 0.1,
            far : optics.far || 5000.0
        };
    } else if (!optics.type) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException(
                        "SceneJS.Camera configuration invalid: optics type not specified - " +
                        "supported types are 'perspective', 'frustum' and 'ortho'"));
    } else {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException(
                        "SceneJS.Camera configuration invalid: optics type not supported - " +
                        "supported types are 'perspective', 'frustum' and 'ortho'"));
    }
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the camera's projection properties
 * @returns {Object} Projection properties
 */
SceneJS.Camera.prototype.getOptics = function() {
    var optics = {};
    for (var key in this._optics) {
        if (this._optics.hasOwnProperty(key)) {
            optics[key] = this._optics[key];
        }
    }
    return optics;
};

// Override
SceneJS.Camera.prototype._render = function(traversalContext, data) {
    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }

        if (this._optics.type == "ortho") {
            this._transform = {
                type: this._optics.type,
                optics : {
                    left: this._optics.left,
                    right: this._optics.right,
                    bottom: this._optics.bottom,
                    top: this._optics.top,
                    near: this._optics.near,
                    far : this._optics.far
                },
                matrix:SceneJS._math_orthoMat4c(
                        this._optics.left,
                        this._optics.right,
                        this._optics.bottom,
                        this._optics.top,
                        this._optics.near,
                        this._optics.far)
            };
        } else if (this._optics.type == "frustum") {
            this._transform = {
                type: this._optics.type,
                optics : {
                    left: this._optics.left,
                    right: this._optics.right,
                    bottom: this._optics.bottom,
                    top: this._optics.top,
                    near: this._optics.near,
                    far : this._optics.far
                },
                matrix:SceneJS._math_frustumMatrix4(
                        this._optics.left,
                        this._optics.right,
                        this._optics.bottom,
                        this._optics.top,
                        this._optics.near,
                        this._optics.far)
            };
        } else if (this._optics.type == "perspective") {
            this._transform = {
                type: this._optics.type,
                optics : {
                    fovy: this._optics.fovy,
                    aspect: this._optics.aspect,
                    near: this._optics.near,
                    far: this._optics.far
                },
                matrix:SceneJS._math_perspectiveMatrix4(
                        this._optics.fovy * Math.PI / 180.0,
                        this._optics.aspect,
                        this._optics.near,
                        this._optics.far)
            };
        }
    }
    var prevTransform = SceneJS._projectionModule.getTransform();
    SceneJS._projectionModule.setTransform(this._transform);
    this._renderNodes(traversalContext, data);
    SceneJS._projectionModule.setTransform(prevTransform);
};

// @private
SceneJS.Camera.prototype._init = function(params) {
    if (params.optics) {
        this.setOptics(params.optics);
    }
};

/** Factory function that returns a new {@link SceneJS.Camera} instance
 * @param {Arguments} args Variable arguments that are passed to the {@link SceneJS.Camera} constructor
 * @returns {SceneJS.Camera}
 */
SceneJS.camera = function() {
    var n = new SceneJS.Camera();
    SceneJS.Camera.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that manages scene lighting.
 *
 * Holds the sources on a stack and provides the SceneJS.light node with methods to push and pop them.
 *
 * Tracks the view and modelling transform matrices through incoming VIEW_TRANSFORM_UPDATED and
 * MODEL_TRANSFORM_UPDATED events. As each light are pushed, its position and/or direction is multipled by the
 * matrices. The stack will therefore contain sources that are instanced in view space by different modelling
 * transforms, with positions and directions that may be animated,
 *
 * Interacts with the shading backend through events; on a SHADER_RENDERING event it will respond with a
 * LIGHTS_EXPORTED to pass the entire light stack to the shading backend.
 *
 * Avoids redundant export of the sources with a dirty flag; they are only exported when that is set, which occurs
 * when the stack is pushed or popped by the lights node, or on SCENE_RENDERING, SHADER_ACTIVATED and
 * SHADER_DEACTIVATED events.
 *
 * Whenever a scene node pushes or pops the stack, this backend publishes it with a LIGHTS_UPDATED to allow other
 * dependent backends to synchronise their resources.
 *
 *  @private
 */
SceneJS._lightingModule = new (function() {

    var viewMat;
    var modelMat;
    var lightStack = [];
    var dirty;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                modelMat = viewMat = SceneJS._math_identityMat4();
                lightStack = [];
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.VIEW_TRANSFORM_UPDATED,
            function(params) {
                viewMat = params.matrix;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.MODEL_TRANSFORM_UPDATED,
            function(params) {
                modelMat = params.matrix;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (dirty) {
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.LIGHTS_EXPORTED,
                            lightStack);
                    dirty = false;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                dirty = true;
            });

    /**
     * @private
     */
    function instanceSources(sources) {
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            if (source._type == "point") {
                source._viewPos =  SceneJS._math_transformPoint3(viewMat, SceneJS._math_transformPoint3(modelMat, source._pos));
            } else if (source._type == "dir") {
                source._viewDir = SceneJS._math_transformVector3(viewMat, SceneJS._math_transformVector3(modelMat, source._dir));
            }
        }
    };

    // @private
    this.pushLightSources = function(sources) {
        instanceSources(sources);
        for (var i = 0; i < sources.length; i++) {
            lightStack.push(sources[i]);
        }
        dirty = true;
        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.LIGHTS_UPDATED,
                lightStack);
    };

    // @private
    this.popLightSources = function(numSources) {
        for (var i = 0; i < numSources; i++) {
            lightStack.pop();
        }
        dirty = true;
        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.LIGHTS_UPDATED,
                lightStack);
    };
})();

/** @class SceneJS.LightSource

 A light source for containment within a @link SceneJS.Lights} node.

 @constructor
 Create a new SceneJS.LightSource
 @param {Object} cfg The config object
 */
SceneJS.LightSource = function(cfg) {
    this._type = "point";
    this._color = [1.0, 1.0, 1.0];
    this._diffuse = true;
    this._specular = true;
    this._pos = [0.0, 0.0, 0.0];
    this._viewPos = [0.0, 0.0, 0.0]; // Transformed view-space pos - accessed by lights module and shading module
    this._dir = [0.0, 0.0, -1.0];
    this._constantAttenuation = 1.0;
    this._linearAttenuation = 0.0;
    this._quadraticAttenuation = 0.0;

    if (cfg) {
        this._init(cfg);
    }
};

/** Sets the light source type
 * @param {String} type Light source type - "dir" or "point"
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setType = function(type) {
    if (type != "dir" && type != "point") {
        throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException(
                "SceneJS.LightSource unsupported type - should be 'dir' or 'point' or 'ambient'"));
    }
    this._type = type;
    return this;
};

/** Gets the light source type
 * @return {String} Light source type - "dir" or "point"
 */
SceneJS.LightSource.prototype.getType = function() {
    return this._type;
};

/** Sets the light source color
 *
 * @param color {Object} - Eg. {r: 1.0, g: 1.0, b: 1.0 }
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setColor = function(color) {
    this._color = [
        color.r != undefined ? color.r : 1.0,
        color.g != undefined ? color.g : 1.0,
        color.b != undefined ? color.b : 1.0
    ];
    return this;
};

/** Gets the light source color
 * @return {Object} Eg. {r: 1.0, g: 1.0, b: 1.0 }
 */
SceneJS.LightSource.prototype.getColor = function() {
    return {
        r: this._color[0],
        g: this._color[1],
        b: this._color[2] };
};

/** Sets whether the light source contributes to diffuse lighting or not
 *
 * @param diffuse {boolean}
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setDiffuse = function (diffuse) {
    this._diffuse = diffuse;
    return this;
};

/** Gets whether the light source contributes to diffuse lighting or not
 *
 * @return {boolean}
 */
SceneJS.LightSource.prototype.getDiffuse = function() {
    return this._diffuse;
};

/** Sets whether the light source contributes to specular lighting or not
 *
 * @param specular {boolean}
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setSpecular = function (specular) {
    this._specular = specular;
    return this;
};

/** Gets whether the light source contributes to specular lighting or not
 *
 * @return {boolean}
 */
SceneJS.LightSource.prototype.getSpecular = function() {
    return this._specular;
};

/** Sets the light source object-space position.
 * This is only used when the source is of type "point".
 *
 * @param pos {Object} - Eg. {x: 5.0, y: 5.0, z: 5.0 }
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setPos = function(pos) {
    this._pos = [ pos.x || 0.0, pos.y || 0.0, pos.z || 0.0 ];
    return this;
};

/** Gets the light source object-space position
 *
 * @return {Object} - Eg. {x: 5.0, y: 5.0, z: 5.0 }
 */
SceneJS.LightSource.prototype.getPos = function() {
    return { x: this._pos[0], y: this._pos[1], z: this._pos[2] };
};

/** Sets the light source object-space direction vector.
 * This is only used when the source is of type "dir".
 * Components will fall back on defaults of { x: 0, y: 0, z: -1 } where not supplied;
 * <pre><code>
 * myLightSource.setDir({  });       // Sets direction of { x : 0.0, y: 0.0, z: -1.0 }
 * myLightSource.setDir({ y: 2.0 }); // Sets direction of { x : 0.0, y: 2.0, z: -1.0 }
 * </pre></code>
 *
 * @param dir {Object} - Eg. {x: 5.0, y: 5.0, z: 5.0 }
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setDir = function(dir) {
    this._dir = [ dir.x || 0.0, dir.y || 0.0, (dir.z == undefined || dir.z == null) ? -1 : dir.z ];
    return this;
};

/** Gets the light source object-space direction vector
 *
 * @return {Object} - Eg. {x: 5.0, y: 5.0, z: 5.0 }
 */
SceneJS.LightSource.prototype.getDir = function() {
    return { x: this._dir[0], y: this._dir[1], z: this._dir[2] };
};

/** Sets the light source constant attenuation factor.
 * This is only used wen the source is of type "point".
 *
 * @param constantAttenuation {double}
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setConstantAttenuation = function (constantAttenuation) {
    this._constantAttenuation = constantAttenuation;
    return this;
};

/** Gets the light source constant attenuation factor
 *
 * @return {double}
 */
SceneJS.LightSource.prototype.getConstantAttenuation = function() {
    return this._constantAttenuation;
};

/** Sets the light source linear attenuation factor.
 * This is only used wen the source is of type "point".
 *
 * @param linearAttenuation {double}
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setLinearAttenuation = function (linearAttenuation) {
    this._linearAttenuation = linearAttenuation;
    return this;
};

/** Gets the light source linear attenuation factor
 *
 * @return {double}
 */
SceneJS.LightSource.prototype.getLinearAttenuation = function() {
    return this._linearAttenuation;
};

/** Sets the light source quadratic attenuation factor.
 * This is only used wen the source is of type "point".
 *
 * @param quadraticAttenuation {double}
 * @return {SceneJS.LightSource} this
 */
SceneJS.LightSource.prototype.setQuadraticAttenuation = function (quadraticAttenuation) {
    this._quadraticAttenuation = quadraticAttenuation;
    return this;
};

/** Gets the light source quadratic attenuation factor
 *
 * @return {double}
 */
SceneJS.LightSource.prototype.getQuadraticAttenuation = function() {
    return this._quadraticAttenuation;
};


// @private
SceneJS.LightSource.prototype._init = function(cfg) {
    if (cfg) {
        if (cfg.type) {
            this.setType(cfg.type);
        }
        if (cfg.color) {
            this.setColor(cfg.color);
        }
        if (cfg.diffuse != undefined) {
            this._diffuse = cfg.diffuse;
        }
        if (cfg.specular != undefined) {
            this._specular = cfg.specular;
        }
        if (cfg.pos) {
            this.setPos(cfg.pos);
        }
        if (cfg.dir) {
            this.setDir(cfg.dir);
        }
        if (cfg.constantAttenuation) {
            this.setConstantAttenuation(cfg.constantAttenuation);
        }
        if (cfg.linearAttenuation) {
            this.setLinearAttenuation(cfg.linearAttenuation);
        }
        if (cfg.quadraticAttenuation) {
            this.setQuadraticAttenuation(cfg.quadraticAttenuation);
        }
    }
};


/** Function wrapper to support functional scene definition
 */
SceneJS.lightSource = function() {
    var n = new SceneJS.LightSource();
    SceneJS.LightSource.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class A scene node that defines a set of light sources for its subgraph.
 * <p>Multiple instances of this  node may appear at
 * any location in a scene graph, to define multiple sources of light, the number of which is only limited
 * by video memory.</p>
 * <p>note that SceneJS does not create any default light sources for you, so if you have non-emissive
 * {@link SceneJS.Material}s with no lights you may not see anything in your scene until you add a light.</p>
 * <p>Currently, two kinds of light are supported: point and directional. Point lights have a location, like a lightbulb,
 * while directional only have a vector that describes their direction, where they have no actual location since they
 * are an infinite distance away.</p>
 * <p>Therefore, each of these two light types have slightly different properties, as shown in the usage example below.</p>

 * <p><b>Example Usage</b></p><p>This example defines a cube that is illuminated by two light sources, point and directional.
 * The cube has a {@link SceneJS.Material} that define how it reflects the light.</b></p><pre><code>
 *  var l = new SceneJS.Lights({
 *      sources: [
 *          {
 *              type: "point",
 *              pos: { x: 100.0, y: 30.0, z: -100.0 }, // Position
 *              color: { r: 0.0, g: 1.0, b: 1.0 },
 *              diffuse: true,   // Contribute to diffuse lighting
 *              specular: true,  // Contribute to specular lighting
 *
 *              // Since this light source has a position, it therefore has
 *              // a distance over which its intensity can attenuate.
 *              // Consult any OpenGL book for how to use these factors.
 *
 *              constantAttenuation: 1.0,
 *              quadraticAttenuation: 0.0,
 *              linearAttenuation: 0.0
 *          },
 *          {
 *              type: "dir",
 *              color: { r: 1.0, g: 1.0, b: 0.0 },
 *              diffuse: true,
 *              specular: true,
 *              dir: { x: 1.0, y: 2.0, z: 0.0 } // Direction - default is { x: 0, y: 0, z: -1 }
 *          }
 *      ]
 *  },
 *
 *      new SceneJS.material({
 *              baseColor:      { r: 0.9, g: 0.2, b: 0.2 },
 *              specularColor:  { r: 0.9, g: 0.9, b: 0.2 },
 *              emit:           0.0,
 *              specular:       0.9,
 *              shine:          6.0
 *          },
 *
 *          new SceneJS.objects.cube()))
 *</pre></code>
 *
 *<p><b>Example 2:</b></p><p>Creates same content as Example 1.</b></p><pre><code>
 *  var lights = new SceneJS.Lights();
 *
 *  var pointSource = new SceneJS.LightSource({
 *      type: "point",
 *      pos: { x: 100.0, y: 30.0, z: -100.0 },
 *      color: { r: 0.0, g: 1.0, b: 1.0 },
 *      diffuse: true,
 *      specular: true,
 *      constantAttenuation: 1.0,
 *      quadraticAttenuation: 0.0,
 *      linearAttenuation: 0.0
 *  });
 *
 *  var dirSource = new SceneJS.LightSource({
 *      type: "dir",
 *      color: { r: 1.0, g: 1.0, b: 0.0 },
 *      diffuse: true,
 *      specular: true,
 *      dir: { x: 1.0, y: 2.0, z: 0.0 }
 *  });
 *
 *  lights.addSource(pointSource);
 *
 *  lights.addSource(dirSource);
 *
 *  var material = new SceneJS.Material({
 *          baseColor:      { r: 0.9, g: 0.2, b: 0.2 },
 *          specularColor:  { r: 0.9, g: 0.9, b: 0.2 },
 *          emit:           0.0,
 *          specular:       0.9,
 *          shine:          6.0
 *      });
 *
 *  lights.addChild(material);
 *
 *  material.addChild(new SceneJS.objects.Cube())
 *
 *  // Move the light back a bit just to show off a setter method
 *
 *  pointSource.setPos({ z: -150.0 });
 *
 * </pre></code>
 * @extends SceneJS.Node
 * @constructor
 * Create a new SceneJS.Lights
 * @param {Object} [cfg] Static configuration object (see class overview comments)
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Lights = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "lights";
    this._sources = [];
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Lights, SceneJS.Node);

/**
 Adds a light source.
 @param {SceneJS.LightSource} source
 @returns {SceneJS.Lights} this
 */
SceneJS.Lights.prototype.addSource = function(source) {
    this._sources.push(source);
    return this;
};

/**
 Get sources
 @return {Array} Array of  SceneJS.LightSource objects
 */
SceneJS.Lights.prototype.getSources = function() {
    var list = [];
    for (var i = 0; i < this._sources.length; i++) {
        list.push(this._sources[i]);
    }
    return list;
};

/** Set sources
 @param {Array} Array of  SceneJS.LightSource objects
 @returns {SceneJS.Lights} this
 */
SceneJS.Lights.prototype.setSources = function(sources) {
    this._sources = [];
    for (var i = 0; i < sources.length; i++) {
        this._sources.push(sources[i]);
    }
    return this;
};

/** Get number of sources
 @return {int}
 */
SceneJS.Lights.prototype.getNumSources = function() {
    return this._sources.length;
};

/** Get light source at given index
 * @return {SceneJS.lightSource} Light source
 */
SceneJS.Lights.prototype.getSourceAt = function(index) {
    return this._sources[index];
};

/**
 Removes and returns the light source at the given index. Returns null if no such source.
 @param {int} index Light source index
 @returns {SceneJS.LightSource}
 */
SceneJS.Lights.prototype.removeSourceAt = function(index) {
    var r = this._sources.splice(index, 1);
    if (r.length > 0) {
        return r[0];
    } else {
        return null;
    }
};

// @private
SceneJS.Lights.prototype._init = function(params) {
    if (params.sources) {
        this._sources = [];
        for (var i = 0; i < params.sources.length; i++) {
            this._sources.push(new SceneJS.LightSource(params.sources[i])); // TODO: allow either config or object
        }
    }
};

// @private
SceneJS.Lights.prototype._render = function(traversalContext, data) {
    if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
        this._renderNodes(traversalContext, data);
    } else {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        }
        SceneJS._lightingModule.pushLightSources(this._sources);
        this._renderNodes(traversalContext, data);
       // SceneJS._lightingModule.popLightSources(this._sources.length);
    }
};

/** Factory function that returns a new {@link SceneJS.Lights} instance
 * @param {Object} [cfg] Static configuration object (see class overview comments)
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Lights}
 */
SceneJS.lights = function() {
    var n = new SceneJS.Lights();
    SceneJS.Lights.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that manages the current material properties.
 *
 * Services the SceneJS.material scene node, providing it with methods to set and get the current material.
 *
 * Interacts with the shading backend through events; on a SHADER_RENDERING event it will respond with a
 * MATERIAL_EXPORTED to pass the material properties to the shading backend.
 *
 * Avoids redundant export of the material properties with a dirty flag; they are only exported when that is set, which
 * occurs when material is set by the SceneJS.material node, or on SCENE_RENDERING, SHADER_ACTIVATED and
 * SHADER_DEACTIVATED events.
 *
 * Sets the properties to defaults on SCENE_RENDERING.
 *
 * Whenever a SceneJS.material sets the material properties, this backend publishes it with a MATERIAL_UPDATED to allow
 * other dependent backends to synchronise their resources. One such backend is the shader backend, which taylors the
 * active shader according to the material properties.
 *
 *  @private
 */
SceneJS._materialModule = new (function() {

    var material;
    var dirty;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                material = {
                    baseColor : [ 0.5, 0.5, 0.5 ],
                    specularColor: [ 0.9,  0.9,  0.9 ],
                    specular : 200,
                    shine : 1,
                    reflect : 0,
                    alpha : 1.0,
                    emit : 0.7
                };
                dirty = true;
            });


    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (dirty) {
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.MATERIAL_EXPORTED,
                            material);
                    dirty = false;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                dirty = true;
            });

    // @private
    this.setMaterial = function(m) {
        material = m;
        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.MATERIAL_UPDATED,
                material);
        dirty = true;
    };

    // @private
    this.getMaterial = function() {
        return material;
    };
})();
/**
 * @class A scene node that defines how light is reflected by the geometry within its subgraph.
 * <p> These may be defined anywhere within a scene graph and may be nested. When nested, the properties on an inner material
 * node will override those on outer material nodes for the inner node's subgraph. These nodes are to be defined either
 * above or below {@link SceneJS.Lights} nodes, which provide light for geometry to reflect.</p>
 * <p><b>Default Material</b></p>
 * <p>When you have not specified any SceneJS.Material nodes in your scene, then SceneJS will apply these default
 * material properties in order to make your geometry visible until you do:</p>
 * <table>
 * <tr><td>baseColor</td><td>{ r: 1.0, g: 1.0, b: 1.0 }</td></tr>
 * <tr><td>specularColor</td><td>{ r: 1.0, g: 1.0, b: 1.0 }</td></tr>
 * <tr><td>specular</td><td>0</td></tr>
 * <tr><td>shine</td><td>0</td></tr>
 * <tr><td>reflect</td><td>0</td></tr>
 * <tr><td>alpha</td><td>1.0</td></tr>
 * <tr><td>emit</td><td>1.0</td></tr>
 * </table>
 * <p><b>Usage Example</b></p><p>A cube illuminated by a directional light source and wrapped
 * with material properties that define how it reflects the light.</b></p><pre><code>
 * var l = new SceneJS.Lights({
 *          sources: [
 *              {
 *                  type: "dir",
 *                  color: { r: 1.0, g: 1.0, b: 0.0 },
 *                  diffuse: true,
 *                  specular: true,
 *                  dir: { x: 1.0, y: 2.0, z: 0.0 } // Direction of light from coordinate space origin
 *              }
 *          ]
 *      },
 *
 *      new SceneJS.Material({
 *              baseColor:      { r: 0.9, g: 0.2, b: 0.2 },
 *              specularColor:  { r: 0.9, g: 0.9, b: 0.2 },
 *              emit:           0.0,
 *              specular:       0.9,
 *              shine:          6.0
 *          },
 *
 *          new SceneJS.objects.Cube()
 *     )
 * )
 * </pre></code>
 * @extends SceneJS.Node
 * @constructor
 * Create a new SceneJS.Material
 * @param {Object} config The config object or function, followed by zero or more child nodes
 *
 */
SceneJS.Material = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "material";
    this._material = {
        baseColor : [ 0.0, 0.0, 0.0 ],
        specularColor: [ 0.0,  0.0,  0.0 ],
        specular : 0,
        shine : 0,
        reflect : 0,
        alpha : 1.0,
        emit : 0.0
    };
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Material, SceneJS.Node);

/**
 * Sets the material base color
 * @function {SceneJS.Material} setBaseColor
 * @param {Object} color Eg. { r: 1.0, g: 1.0, b: 0.0 }
 * @returns {SceneJS.Material} this
 */
SceneJS.Material.prototype.setBaseColor = function(color) {
    this._material.baseColor = [
        color.r != undefined && color.r != null ? color.r : 0.0,
        color.g != undefined && color.g != null ? color.g : 0.0,
        color.b != undefined && color.b != null ? color.b : 0.0
    ];
    return this;
};

/**
 Returns the base color
 @function {Object} getBaseColor
 @returns {Object} color Eg. { r: 1.0, g: 1.0, b: 0.0 }
 */
SceneJS.Material.prototype.getBaseColor = function() {
    return {
        r: this._material.baseColor[0],
        g: this._material.baseColor[1],
        b: this._material.baseColor[2]
    };
};

/**
 * Sets the material specular
 * @function {SceneJS.Material} setSpecularColor
 * @param {Object} color Eg. { r: 1.0, g: 1.0, b: 0.0 }
 * @returns {SceneJS.Material} this
 */
SceneJS.Material.prototype.setSpecularColor = function(color) {
    this._material.specularColor = [
        color.r != undefined && color.r != null ? color.r : 0.5,
        color.g != undefined && color.g != null ? color.g : 0.5,
        color.b != undefined && color.b != null ? color.b : 0.5
    ];
    return this;
};

/**
 Returns the specular color
 @function {Object} getSpecularColor
 @returns {Object} color Eg. { r: 1.0, g: 1.0, b: 0.0 }
 */
SceneJS.Material.prototype.getSpecularColor = function() {
    return {
        r: this._material.specularColor[0],
        g: this._material.specularColor[1],
        b: this._material.specularColor[2]
    };
};

/**
 * Sets the specular reflection factor
 * @function {SceneJS.Material} setSpecular
 * @param {float} specular
 * @returns {SceneJS.Material} this
 */
SceneJS.Material.prototype.setSpecular = function(specular) {
    this._material.specular = specular || 0;
    return this;
};

/**
 Returns the specular reflection factor
 @function {float} getSpecular
 @returns {float}
 */
SceneJS.Material.prototype.getSpecular = function() {
    return this._material.specular;
};

/**
 * Sets the shininess factor
 * @function {SceneJS.Material} setShine
 * @param {float} shine
 * @returns {SceneJS.Material} this
 */
SceneJS.Material.prototype.setShine = function(shine) {
    this._material.shine = shine || 0;
    return this;
};

/**
 Returns the shininess factor
 @function {float} getShine
 @returns {float}
 */
SceneJS.Material.prototype.getShine = function() {
    return this._material.shine;
};

/**
 * Sets the reflectivity factor
 * @function {SceneJS.Material} setReflect
 * @param {float} reflect
 * @returns {SceneJS.Material} this
 */
SceneJS.Material.prototype.setReflect = function(reflect) {
    this._material.reflect = reflect || 0;
    return this;
};

/**
 Returns the reflectivity factor
 @function {float} getReflect
 @returns {float}
 */
SceneJS.Material.prototype.getReflect = function() {
    return this._material.reflect;
};

/**
 * Sets the emission factor
 * @function {SceneJS.Material} setEmit
 * @param {float} emit
 * @returns {SceneJS.Material} this
 */
SceneJS.Material.prototype.setEmit = function(emit) {
    this._material.emit = emit || 0;
    return this;
};

/**
 Returns the emission factor
 @function {float} getEmit
 @returns {float}
 */
SceneJS.Material.prototype.getEmit = function() {
    return this._material.emit;
};

/**
 * Sets the amount of alpha
 * @function {SceneJS.Material} setAlpha
 * @param {float} alpha
 * @returns {SceneJS.Material} this
 */
SceneJS.Material.prototype.setAlpha = function(alpha) {
    this._material.alpha = alpha == undefined ? 1.0 : alpha;
    return this;
};

/**
 Returns the amount of alpha
 @function {float} getAlpha
 @returns {float}
 */
SceneJS.Material.prototype.getAlpha = function() {
    return this._material.alpha;
};

// @private
SceneJS.Material.prototype._init = function(params) {
    if (params.baseColor) {
        this.setBaseColor(params.baseColor);
    }
    if (params.specularColor) {
        this.setSpecularColor(params.specularColor);
    }
    if (params.specular) {
        this.setSpecular(params.specular);
    }
    if (params.shine) {
        this.setShine(params.shine);
    }
    if (params.reflect) {
        this.setReflect(params.reflect);
    }
    if (params.emit) {
        this.setEmit(params.emit);
    }
    if (params.alpha) {
        this.setAlpha(params.alpha);
    }
};

// @private
SceneJS.Material.prototype._render = function(traversalContext, data) {
    if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
        this._renderNodes(traversalContext, data);
    } else {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        }

        var saveMaterial = SceneJS._materialModule.getMaterial();
        SceneJS._materialModule.setMaterial(this._material);
        this._renderNodes(traversalContext, data);
        SceneJS._materialModule.setMaterial(saveMaterial);
    }
};

/** Factory function that returns a new {@link SceneJS.Material} instance
 * @param {Arguments} args Variable arguments that are passed to the SceneJS.Material constructor
 * @returns {SceneJS.Material}
 */
SceneJS.material = function() {
    var n = new SceneJS.Material();
    SceneJS.Material.prototype.constructor.apply(n, arguments);
    return n;
};

/**
 * @class A scene node that animates interpolates a scalar value by interpolating within a sequence of key values.
 * <p>This nodes reads an <i>alpha</i> value from the current data scope and writes the output to a child data scope
 * for nodes in its subgraph to configure themselves with.</p>
 * <p><b>Example Usage</b></p><p>This example defines a {@link SceneJS.objects.Cube} with rotation that is animated by
 * a SceneJS.Interpolator, which is in turn driven by an alpha value supplied by a higher {@link SceneJS.WithData}.
 * If we thought of <em>alpha</em> as elapsed seconds, then this cube will rotate 360 degrees over one second, then
 * rotate 180 in the reverse direction over the next 0.5 seconds. In this example however, the alpha is actually fixed,
 * where the cube is stuck at 180 degrees - you would need to vary the "alpha" property on the WithData node to actually
 * animate it.</p><pre><code>
 * var wd = new SceneJS.WithData({ "alpha" : 0.5 }, // Interpolates the rotation to 180 degrees
 *
 *      new SceneJS.Interpolator({
 *              type:"linear",   // or 'cosine', 'cubic' or 'constant'
 *              input:"alpha",
 *              output:"angle",
 *              keys: [0.0, 1.0, 1.5],
 *              values: [0.0, 360.0, 180.0]
 *          },
 *
 *          new SceneJS.Rotate(function(data) {
 *                 return { angle : data.get("angle"), y: 1.0 };
 *              },
 *
 *                  new SceneJS.objects.Cube()
 *              )
 *          )
 *      )
 *
 *  // Bump the rotation along a notch:
 *
 *  wd.setProperty("alpha", 0.6);
 *
 *  </pre></code>
 *
 * @extends SceneJS.Node
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.Interpolator
 * @param {Object} [cfg] Static configuration object
 * @param {String} [cfg.type="linear"] Interpolation type - "linear", "cosine", "cubic" or "constant"
 * @param {String} cfg.input Name of property on {@link SceneJS.Data} scope that will supply the interpolation <em>alpha</em> value
 * @param {String} cfg.output Name of property to create on child {@link SceneJS.Data} scope that provide the output value
 * @param {double[]} [cfg.keys=[]] Alpha key values
 * @param {double[]} [cfg.values=[]] Output key values
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Interpolator = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "interpolator";
    this._input = null;
    this._output = null;
    this._outputValue = null;
    this._keys = null;
    this._values = null;
    this._key1 = 0;
    this._key2 = 0;
    this._type = null;
};

SceneJS._inherit(SceneJS.Interpolator, SceneJS.Node);

/* Interpolator attempts to track the pair of keys that enclose the current alpha value -
 * these are the node's current states with regard to that:
 */

// @private
SceneJS.Interpolator.prototype._NOT_FOUND = 0;        // Alpha outside of key sequence

// @private
SceneJS.Interpolator.prototype._BEFORE_FIRST = 1;     // Alpha before first key

// @private
SceneJS.Interpolator.prototype._AFTER_LAST = 2;       // Alpha after last key

// @private
SceneJS.Interpolator.prototype._FOUND = 3;            // Found keys before and after alpha

// @private
SceneJS.Interpolator.prototype._linearInterpolate = function(k) {
    var u = this._keys[this._key2] - this._keys[this._key1];
    var v = k - this._keys[this._key1];
    var w = this._values[this._key2] - this._values[this._key1];
    return this._values[this._key1] + ((v / u) * w);
};

// @private
SceneJS.Interpolator.prototype._constantInterpolate = function(k) {
    if (Math.abs((k - this._keys[this._key1])) < Math.abs((k - this._keys[this._key2]))) {
        return this._keys[this._key1];
    } else {
        return this._keys[this._key2];
    }
};

// @private
SceneJS.Interpolator.prototype._cosineInterpolate = function(k) {
    var mu2 = (1 - Math.cos(k * Math.PI) / 2.0);
    return (this._keys[this._key1] * (1 - mu2) + this._keys[this._key2] * mu2);
};

// @private
SceneJS.Interpolator.prototype._cubicInterpolate = function(k) {
    if (this._key1 == 0 || this._key2 == (this._keys.length - 1)) {

        /* Between first or last pair of keyframes - need four keyframes for cubic, so fall back on cosine
         */
        return this._cosineInterpolate(k);
    }
    var y0 = this._keys[this._key1 - 1];
    var y1 = this._keys[this._key1];
    var y2 = this._keys[this._key2];
    var y3 = this._keys[this._key2 + 1];
    var mu2 = k * k;
    var a0 = y3 - y2 - y0 + y1;
    var a1 = y0 - y1 - a0;
    var a2 = y2 - y0;
    var a3 = y1;
    return (a0 * k * mu2 + a1 * mu2 + a2 * k + a3);
};

// @private
SceneJS.Interpolator.prototype._slerp = function(k) {
    var u = this._keys[this._key2] - this._keys[this._key1];
    var v = k - this._keys[this._key1];  
    return SceneJS._math_slerp((v / u), this._values[this._key1], this._values[this._key2]);
};

// @private
SceneJS.Interpolator.prototype._findEnclosingFrame = function(key) {
    if (this._keys.length == 0) {
        return this._NOT_FOUND;
    }
    if (key < this._keys[0]) {
        return this._BEFORE_FIRST;
    }
    if (key > this._keys[this._keys.length - 1]) {
        return this._AFTER_LAST;
    }
    while (this._keys[this._key1] > key) {
        this._key1--;
        this._key2--;
    }
    while (this._keys[this._key2] < key) {
        this._key1++;
        this._key2++;
    }
    return this._FOUND;
};

// @private
SceneJS.Interpolator.prototype._interpolate = function(k) {
    switch (this._type) {
        case 'linear':
            return this._linearInterpolate(k);
        case 'cosine':
            return this._cosineInterpolate(k);
        case 'cubic':
            return this._cubicInterpolate(k);
        case 'constant':
            return this._constantInterpolate(k);
        case 'slerp':
            return this._slerp(k);
        default:
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.InternalException("SceneJS.Interpolator internal error - interpolation type not switched: '"
                            + this._type + "'"));
    }
};

// @private
SceneJS.Interpolator.prototype._update = function(key) {
    switch (this._findEnclosingFrame(key)) {
        case this._NOT_FOUND:
            break;
        case this._BEFORE_FIRST:
            break; // time delay before interpolation begins
        case this._AFTER_LAST:
            this._outputValue = this._values[this._values.length - 1];
            break;
        case this._FOUND:
            this._outputValue = this._interpolate((key));
            break;
        default:
            break;
    }
};

// @private
SceneJS.Interpolator.prototype._init = function(params) {

    /* Name of input property in data scope
     */
    if (!params.input) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.NodeConfigExpectedException(
                        "SceneJS.Interpolator config property expected: input"));
    }
    this._input = params.input;

    /* Name of output property on child data scope
     */
    if (!params.output) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.NodeConfigExpectedException(
                        "SceneJS.Interpolator config property expected: output"));
    }
    this._output = params.output;
    this._outputValue = null;

    /* Keys and values
     */
    if (params.keys) {
        if (!params.values) {
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.InvalidNodeConfigException(
                            "SceneJS.Interpolator configuration incomplete: " +
                            "keys supplied but no values - must supply a value for each key"));
        }
    } else if (params.values) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException(
                        "SceneJS.Interpolator configuration incomplete: " +
                        "values supplied but no keys - must supply a key for each value"));
    }
    for (var i = 1; i < params.keys.length; i++) {
        if (params.keys[i - 1] >= params.keys[i]) {
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.InvalidNodeConfigException(
                            "SceneJS.Interpolator configuration invalid: " +
                            "two invalid keys found ("
                                    + i - 1 + " and " + i + ") - key list should contain distinct values in ascending order"));
        }
    }
    this._keys = params.keys;
    this._values = params.values;
    this._key1 = 0;
    this._key2 = 1;

    /* Interpolation type
     */
    params.type = params.type || 'linear';
    switch (params.type) {
        case 'linear':
            break;
        case 'constant':
            break;
        case 'cosine':
            break;
        case 'cubic':
            if (params.keys.length < 4) {
                throw SceneJS._errorModule.fatalError(
                        new SceneJS.errors.InvalidNodeConfigException(
                                "SceneJS.Interpolator configuration invalid: minimum of four keyframes " +
                                "required for cubic - only "
                                        + params.keys.length
                                        + " are specified"));
            }
            break;
        case 'slerp':
            break;
        default:
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.InvalidNodeConfigException(
                            "SceneJS.Interpolator configuration invalid:  type not supported - " +
                            "only 'linear', 'cosine', 'cubic', 'constant' and 'slerp' are supported"));
        /*


         case 'hermite':
         break;
         */
    }
    this._type = params.type;
};

// @private
SceneJS.Interpolator.prototype._render = function(traversalContext, data) {
    if (!this.type) {
        this._init(this._getParams(data));
    }
    var key = data.get(this._input);
    if (key == undefined || key == null) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.DataExpectedException(
                        "SceneJS.Interpolator failed to find input on data: '" + params.input + "'"));
    }
    this._update(key);
    var obj = {};
    obj[this._output] = this._outputValue;
    this._renderNodes(traversalContext, new SceneJS.Data(data, false, obj));
};


/**  Factory function that returns a new {@link SceneJS.Interpolator} instance
 * @param {Object} [cfg] Static configuration object
 * @param {String} [cfg.type="linear"] Interpolation type - "linear", "cosine", "cubic" or "constant"
 * @param {String} cfg.input Name of property on {@link SceneJS.Data} scope that will supply the interpolation <em>alpha</em> value
 * @param {String} cfg.output Name of property to create on child {@link SceneJS.Data} scope that provide the output value
 * @param {double[]} [cfg.keys=[]] Alpha key values
 * @param {double[]} [cfg.values=[]] Output key values
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @returns {SceneJS.objects.Interpolator}
 * @since Version 0.7.0
 */
SceneJS.interpolator = function() {
    var n = new SceneJS.Interpolator();
    SceneJS.Interpolator.prototype.constructor.apply(n, arguments);
    return n;
};





/**
 * @class A scene node that creates data in a scope for its subgraph.
 * @extends SceneJS.Node
 * <p>This node provides a simple yet flexible mechanism for passing data down into a scene graph at runtime, analogous to
 * creation of a closure's data scope in JavaScript .</p>
 * <p>The data scope is implemented by a {@link SceneJS.Data} instance. On each render a {@link SceneJS.Scene} creates a global
 * SceneJS.Data populated with any properties that were given to the SceneJS.Scene's render method. That Data forms a
 * chain on which SceneJS.WithData nodes will push and pop as they are visited and departed from during scene traversal.</p>
 * <p>When some node, or node config callback, looks for a property on its local SceneJS.Data, it will hunt up the chain
 * to get the first occurance of that property it finds.</p>
 * <p><b>Example:</b></p><p>Creating data for a child {@link SceneJS.Scale} node, which has a callback to configure itself from
 * the data:</b></p><pre><code>
 * var wd = new SceneJS.WithData({
 *         sizeX: 5,
 *         sizeY: 10,
 *         sizeZ: 2
 *      },
 *      new SceneJS.Translate({ x: 100 },
 *
 *          new SceneJS.Scale(function(data) {        // Function in this case, instead of a config object
 *                   return {
 *                       x: data.get("sizeX"),
 *                       y: data.get("sizeY"),
 *                       z: data.get("sizeZ")
 *                   }
 *          },
 *
 *              new SceneJS.objects.Cube()
 *          )
 *      )
 *  )
 *
 * </code></pre>
 * @constructor
 * Create a new SceneJS.WithData
 * @param {Object} [cfg] Static configuration object containing whatever is to be set on the child data scope
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function returning whatever is to be set on
 * the child data scope
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.WithData = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "with-data";
    this._data = {};
    this._childData = {};
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.WithData, SceneJS.Node);

/**
 Sets a property
 @param {String} key Name of property
 @param {Object} value Value of property
 @returns {SceneJS.WithData} this
 */
SceneJS.WithData.prototype.setProperty = function(key, value) {
    this._data[key] = value;
    this._memoLevel = 0;
    return this;
};

/**
 * Returns the value of a property
 *
 * @param {String} key Name of property
 * @returns {Object} Value of property
 */
SceneJS.WithData.prototype.getProperty = function(key) {
    return this._data[key];
};


/** Clears all properties
 *@returns {SceneJS.WithData} this
 */
SceneJS.WithData.prototype.clearProperties = function() {
    this._data = {};
    this._memoLevel = 0;
    return this;
};

SceneJS.WithData.prototype._init = function(params) {
    for (var key in params) {
        this._data[key] = params[key];
    }
};

SceneJS.WithData.prototype._render = function(traversalContext, data) {
    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
    }
    if (this._memoLevel < 2) {
        if (this._memoLevel == 1 && data.isFixed() && !SceneJS._instancingModule.instancing()) {
            this._memoLevel = 2;
        }
    }
    this._renderNodes(traversalContext, new SceneJS.Data(data, this._fixedParams, this._data));
};

/**
 * Factory function that returns a new {@link SceneJS.WithData} instance
 * @param {Object} [cfg] Static configuration object containing whatever is to be set on the child data scope
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function returning whatever is to be set on
 * the child data scope
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.WithData}
 * @since Version 0.7.4
 */
SceneJS.withData = function() {
    var n = new SceneJS.WithData();
    SceneJS.WithData.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * @class Invokes addXXX, removeXXX and setXXX methods on the nodes in its subgraph during traversal to set, delete or add
 * elements on them.</p>.
 * <p>The configuration for a {@link SceneJS.WithConfigs} is a hierarchical map of values for methods on
 * nodes in the subgraph. As shown in the examples below, its hierarchy maps to that of the subgraph. The keys beginning
 * with "#" map to the SIDs of nodes. In the first example, we have property keys that map to setter methods on
 * those nodes. In the second example we have a property key prefixed with "+", which maps it to a method beginning
 * with "add" (addNode). In the third example, we have a property key prefixed with "-", which maps it to a method
 * beginning with "remove" (removeNode).</p>
 *
 * <p>The functionality of {@link SceneJS.WithConfigs} is also provided in the {@link SceneJS.Socket} node, which allows
 * a server to push a configuration map onto a scene subgraph through a WebSocket.</p>
 *
 * <p>Note that configs are applied to nodes just before they are rendered, so as long as your config map
 * resolves correctly, the nodes don't have to have initial configurations wherever you have specified them for "setXXX"
 * methods in the config map.</p>
 *
 * <h2>Example 1: Setting properties on subnodes</h2>
 * <p><b>Example 1:</b></p><p>Configuring properties on {@link SceneJS.Translation} and {@link SceneJS.Scale} nodes in the subgraph:</b></p><pre><code>
 * var wc = new SceneJS.WithConfigs({
 *
 *         // Optionally you can specify that the configs map is to be forgotten as soon as it is used,
 *         // where the WithConfigs node only applies it the first time it is rendered, before clearing it.
 *         // In this case, our WithConfigs applies it every time:
 *
 *         once : false,
 *
 *         // Optionally have the WithConfigs throw a SceneJS.errors.WithConfigsNodeNotFoundException if any target node
 *         // is not found at exactly the hierarchy position specified in our configs map.
 *         //
 *         // Default is false, which would allow unmatched nodes to be simply skipped as traversal
 *         // descends into the subgraph.
 *         //
 *         strictNodes : true,       // Default is false
 *
 *         // Have the WithConfigs throw a SceneJS.errors.WithConfigsPropertyNotFoundException if any target property
 *         // is not found on its target node.
 *         //
 *         // Default is true.
 *         //
 *         strictProperties : true,  // Default is true
 *
 *         configs: {
 *             "#myTranslate" : {    // Selects the SceneJS.Scale
 *                  x: 5,            // Invokes the setX, setY and setZ methods of the SceneJS.Translate
 *                  y: 10,
 *                  z: 2,
 *
 *                  "#myScale" : {   // Selects the SceneJS.Scale
 *                      x: 2.0,      // Invokes the setX and setY methods of the SceneJS.Scale
 *                      z: 1.5
 *                   }
 *             }
 *          }
 *      },
 *
 *      new SceneJS.Translate({
 *                     sid: "myTranslate",
 *                     x: 100,
 *                     y: 20,
 *                     z: 15
 *                  },
 *
 *          new SceneJS.Scale({
 *                        sid: "myScale",
 *                        x : 1.0
 *                     },
 *
 *                new SceneJS.objects.Cube()
 *          )
 *      )
 *  )
 * </code></pre>
 *
 * <h2>Adding elements to subnodes</h2>
 * <p><b>Example:</b></p><p>In this example we're using a WithConfigs node to attach a subgraph to a target node
 * within it's own subgraph. Abstractly, a teapot is being attached to a chair at a table in a cafe. Note
 * the "+node" key in the map for the "chair2" node, which maps to the "addNode" method on that node.</b></p><pre><code>
 * var wc = SceneJS.withConfigs({
 *         strictNodes : true,       // Target node must exist - default is false
 *         strictProperties : true,  // Function addNode must exist on target node - default is true
 *         configs: {
 *             "#cafe": {
 *                  "#table5" : {
 *                      "#chair2" : {
 *
 *                          // Content we're attaching. "+node" directs the WithConfig
 *                          // to call the "addNode" method on the Node at the attachment
 *                          // point to attach the object
 *                          //
 *                          "+node" :
 *                               SceneJS.rotate({ // The object to attach - imagine
 *                                         angle: 0,    // this teapot is a person!
 *                                         y : 1.0
 *                                    },
 *                                    SceneJS.objects.teapot())
 *                               }
 *                          }
 *                      }
 *                  }
 *             },
 *             SceneJS.node({ sid: "cafe" },
 *                  SceneJS.translate({ x: -1, y: 0, z: -1},
 *                      SceneJS.node({ sid: "table5" },
 *                          SceneJS.translate({ x: 1, y: 0, z: 1},
 *
 *                             // Attachment point
 *
 *                             SceneJS.node({ sid: "chair2" }))))))
 * </code></pre>
 *
 * <h2>Removing elements from subnodes</h2>
 * <p><b>Example:</b></p><p>In this example we're using a WithConfigs node to delete a subgraph from a target node.
 * Abstractly, a chair is being removed from a table in a cafe. Note the "-node" key in the map for the "chair2" node,
 * which maps to the "removeNode" method on that node, and the value, which is the SID of the node to remove.</b></p><pre><code>
 * var wc = SceneJS.withConfigs({
 *         strictNodes : true,        // Target node must exist - default is false
 *         strictProperties : true,   // Function addNode must exist on target node - default is true
 *         configs: {
 *             "#cafe": {
 *                  "#table5" : {
 *
 *                      // Content we're removing. "-node" directs the WithConfig
 *                      // to call the "removeNode" method on the "table5" target Node
 *                      //
 *                      "-node" : "#chair2"
 *                  }
 *             },
 *             SceneJS.node({ sid: "cafe" },
 *                  SceneJS.translate({ x: -1, y: 0, z: -1},
 *
 *                      // Target node
 *
 *                      SceneJS.node({ sid: "table5" },
 *                          SceneJS.translate({ x: 1, y: 0, z: 1},
 *
 *                             // Removing this subnode:
 *
 *                             SceneJS.node({ sid: "chair2" }))))))
 * </code></pre>
 * @extends SceneJS.Node
 * @since Version 0.7.6
 * @constructor
 * Create a new SceneJS.WithConfigs
 * @param {Object} [cfg] Static configuration object containing hierarchical map of values for sub-nodes
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function returning the hierarchical map
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.WithConfigs = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "with-configs";
    this._configs = {};
    this._once = false;
    this._configsModes = {
        strictProperties : true,
        strictNodes : false
    };
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.WithConfigs, SceneJS.Node);

/**
 Sets the configs map
 @param {Object} configs The configs map
 @returns {SceneJS.WithConfigs} this
 */
SceneJS.WithConfigs.prototype.setConfigs = function(configs, once) {
    this._configs = configs;
    if (once != undefined) {
        this._once = once;
    }
    this._memoLevel = 0;
    return this;
};

/**
 * Returns the configs map
 *
 * @returns {Object} The configs map
 */
SceneJS.WithConfigs.prototype.getConfigs = function() {
    return this._configs;
};

/**
 Sets whether the configs map is forgotten as soon as the node has rendered, ie. to apply only once.
 @param {boolean} once - Will forget when this is true
 @returns {SceneJS.WithConfigs} this
 */
SceneJS.WithConfigs.prototype.setOnce = function(once) {
    this._once = once;
    if (once != undefined) {
        this._once = once;
    }
    this._memoLevel = 0;
    return this;
};

/**
 * Sets whether the configs map is forgotten as soon as the node has rendered, ie. to apply only once.
 *
 * @returns {boolean} True if to forget, else false
 */
SceneJS.WithConfigs.prototype.getOnce = function() {
    return this._once;
};

/**
 * Specifies whether or not a {@link SceneJS.errors.WithConfigsPropertyNotFoundException} is to be raised when
 * a property reference on the WithConfigs config map cannot be resolved to any method on a target node.
 * @param {Boolean} value When true, enables exception
 */
SceneJS.WithConfigs.prototype.setStrictProperties = function(value) {
    this._configsModes.strictProperties = value;
};

/**
 * Returns whether or not a {@link SceneJS.errors.WithConfigsPropertyNotFoundException} will be raised when
 * a property reference on the WithConfigs config map cannot be resolved to any method on a target node.
 * @returns {Boolean} When true, exception is enabled
 */
SceneJS.WithConfigs.prototype.getStrictProperties = function() {
    return this._configsModes.strictProperties;
};

/**
 * Specifies whether or not a {@link SceneJS.errors.WithConfigsNodeNotFoundException} exception is to be raised when
 * a node reference in the WithConfigs config map cannot be resolved to its target node in the subgraph.
 * @param {Boolean} value When true, enables exception
 */
SceneJS.WithConfigs.prototype.setStrictNodes = function(value) {
    this._configsModes.strictNodes = value;
};

/**
 * Returns whether or not a {@link SceneJS.errors.WithConfigsNodeNotFoundException} exception will be raised when
 * a node reference on the WithConfigs config map cannot be resolved to its target node in the subgraph.
 * @returns {Boolean} When true, exception is enabled
 */
SceneJS.WithConfigs.prototype.getStrictNodes = function() {
    return this._configsModes.strictNodes;
};

SceneJS.WithConfigs.prototype._init = function(params) {
    this._configs = params.configs || {};
    this._once = params.once != undefined ? params.once : false;
};

SceneJS.WithConfigs.prototype._render = function(traversalContext, data) {
    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
            this._configs = this._preprocessConfigs(this._configs);
        } else {
            this._memoLevel = 1;
            this._configs = this._preprocessConfigs(this._configs);
        }
    }
    //    if (this._memoLevel < 2) {
    //        if (this._memoLevel == 1 && data.isFixed() && !SceneJS._instancingModule.instancing()) {
    //            this._memoLevel = 2;
    //        }
    //    }
    traversalContext = {
        appendix : traversalContext.appendix,
        insideRightFringe: this._children.length > 1,
        configs : this._configs,
        configsModes : this._configsModes
    };
    // this._renderNodes(traversalContext, new SceneJS.Data(data, this._fixedParams, this._data));
    this._renderNodes(traversalContext, data);

    if (this._once) {
        this._configs = {};
    }
};


/* Preprocess config map for faster application when rendering nodes
 */
SceneJS.WithConfigs.prototype._preprocessConfigs = function(configs) {
    var configAction;
    var funcName;
    var newConfigs = {};
    for (var key in configs) {
        if (configs.hasOwnProperty(key)) {
            key = key.replace(/^\s*/, "").replace(/\s*$/, "");    // trim
            if (key.length > 0) {
                configAction = key.substr(0, 1);
                if (configAction != "#") {  // Property reference
                    if (configAction == "+") {
                        funcName = "add" + key.substr(1, 1).toUpperCase() + key.substr(2);
                    } else if (configAction == "-") {
                        funcName = "remove" + key.substr(1, 1).toUpperCase() + key.substr(2);
                    } else {
                        funcName = "set" + key.substr(0, 1).toUpperCase() + key.substr(1);
                    }
                    newConfigs[funcName] = {
                        isFunc : true,
                        value : configs[key]
                    };

                } else {
                    if (configs[key] instanceof Function) {
                        newConfigs[key.substr(1)] = configs[key];
                    } else {
                        newConfigs[key.substr(1)] = this._preprocessConfigs(configs[key]);
                    }
                }
            }
        }
    }
    return newConfigs;
};


/**
 * Factory function that returns a new {@link SceneJS.WithConfigs} instance
 * @param {Object} [cfg] Static config map object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function returning the config map
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.WithConfigs}
 * @since Version 0.7.6
 */
SceneJS.withConfigs = function() {
    var n = new SceneJS.WithConfigs();
    SceneJS.WithConfigs.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 *  @class A scene node that performs procedural scene generation by causing its child nodes to be rendered multiple times
 * in a loop within a scene traversal, while varying the data available to them in each loop.
 *
 *  <p>Each time a SceneJS.Generator loops over its children it creates a child data scope for them from the result of its
 *  configuration callback function, then repeats the process as long as the function returns something.</p>
 *
 *  <p>This node type must be configured dynamically therefore, in the SceneJS style, with a configuration function.</p>
 *
 *  <p>This node type is useful for procedurally generating scene subtrees. Its most common application would be
 *  to dynamically instance elements of primitive geometry to build complex objects.</p>
 *
 *  <p>Note that generator nodes can have a negative impact on performance, where they will often prevent subnodes from
 *  employing memoization strategies that fast scene graphs often depend upon. Use them carefully when high performance
 *  is desired in large scenes. The impact will depend on the type of subnode that receives the generated data.
 *  For example, inability to memoize will cascade downwards through  modelling transform node hierarchies since they
 *  will have to re-multiply matrices by dynamic parent modelling transforms etc.</p>
 *
 * <p><b>Example Usage</b></p><p>Below is a SceneJS.Generator that loops over its subgraph to create a ring of cubes, 45 degrees apart.</b></p><pre><code>
 * var g = new SceneJS.Generator(
 *        (function() {                        // Higher order function tracks the angle in closure
 *            var angle = 0;
 *            return function() {              // Generator function
 *                angle += 45.0;
 *                if (angle <= 360.0) {
 *                    return { angle: angle }; // Angle still less than 360, return config object
 *                } else {  // Reset the generator
 *                    angle = 0;               // Angle at max, reset and return nothing,
 *                }                            // causing loop to finish for this frame
 *            };
 *        })(),
 *
 *        new SceneJS.Rotate(function(data) {
 *            return { angle : data.get("angle"), y: 1.0 };
 *        },
 *                new SceneJS.Translate(function(data) {
 *                    return { x: 10.0 };
 *                },
 *
 *                new SceneJS.objects.cube()
 *            )
 *         )
 *   );
 * </pre></code>
 * @extends SceneJS.Node
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.Generator
 * @param {Object} [cfg] Static configuration object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Generator = function(cfg) {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "generator";
};

SceneJS._inherit(SceneJS.Generator, SceneJS.Node);

// @private
SceneJS.Generator.prototype._render = function(traversalContext, data) {
    if (this._fixedParams) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException
                        ("SceneJS.Generator may only be configured with a function"));
    }
    var params = this._getParams(data);
    while (params) {
        this._renderNodes(traversalContext, new SceneJS.Data(data, false, params));
        params = this._getParams(data);
    }
};

/** Factory function that returns a new {@link SceneJS.Generator} instance
 * @param {Object} [cfg] Static configuration object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Generator}
 *  @since Version 0.7.2
 */
SceneJS.generator = function() {
    var n = new SceneJS.Generator();
    SceneJS.Generator.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that maintains a model-space viewing frustum computed from the current viewport and projection
 * and view transform matrices.
 *
 * Services queries on it from scene nodes (ie. intersections etc.).
 *
 * Tracks the viewport and matrices through incoming VIEWPORT_UPDATED, PROJECTION_TRANSFORM_UPDATED and
 * VIEW_TRANSFORM_UPDATED events.
 *
 * Lazy-computes the frustum on demand, caching it until any of the viewport or matrices is updated.
 *
 * Provides an interface through which scene nodes can test axis-aligned bounding boxes against the frustum,
 * eg. to query their intersection or projected size.
 *  @private
 *
 */
SceneJS._frustumModule = new (function() {

    var viewport;
    var projMat;
    var viewMat;
    var frustum;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                projMat = viewMat = SceneJS._math_identityMat4();
                viewport = [0,0,1,1];
                frustum = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.VIEWPORT_UPDATED,
            function(v) {
                viewport = [v.x, v.y, v.width, v.height];
                frustum = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.PROJECTION_TRANSFORM_UPDATED,
            function(params) {
                projMat = params.matrix;
                frustum = null;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.VIEW_TRANSFORM_UPDATED,
            function(params) {               
                viewMat = params.matrix;
                frustum = null;
            });

    /**
     * @private
     */
    var getFrustum = function() {
        if (!frustum) {
            frustum = new SceneJS._math_Frustum(viewMat, projMat, viewport);
        }
        return frustum;
    };

    /**
     * Tests the given axis-aligned box for intersection with the frustum
     * @private
     * @param box
     */
    this.testAxisBoxIntersection = function(box) {
        return getFrustum().textAxisBoxIntersection(box);
    };

    /**
     * Returns the projected size of the given axis-aligned box with respect to the frustum
     * @private
     * @param box
     */
    this.getProjectedSize = function(box) {
        return getFrustum().getProjectedSize(box);
    };
})();
/**
 * Backend that maintains a model-space sphere centered about the current eye position, computed from the
 * current view transform matrix.
 *
 * Services queries on it from scene nodes (ie. intersections etc.).
 *
 * Tracks the matrix through incoming VIEW_TRANSFORM_UPDATED events.
 *
 * Lazy-computes the sphere on demand, caching it until the matrix is updated.
 *
 * Provides an interface through which scene nodes can test axis-aligned bounding boxes for intersection
 * with the sphere.
 *
 * @private
 */
SceneJS._localityModule = new (function() {

    var eye;
    var radii;
    var radii2;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                eye = { x: 0, y: 0, z: 0 };
                radii = {
                    inner : 100000,
                    outer : 200000
                };
                radii2 = {
                    inner : radii.inner * radii.inner,
                    outer : radii.outer * radii.outer
                };
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.VIEW_TRANSFORM_UPDATED,
            function(transform) {
                if (transform.lookAt) {
                    var e = transform.lookAt.eye;
                    eye = [e.x, e.y, e.z];
                } else {
                    eye = [0,0,0];
                }
            });

    /**
     * @private
     */
    function intersects(radius2, box) { // Simple Arvo method - TODO: Larsson-Arkenine-Moller-Lengyel method
        var dmin = 0;
        var e;
        for (var i = 0; i < 3; i++) {
            if (eye[i] < box.min[i]) {
                e = eye[i] - box.min[i];
                dmin += (e * e);
            } else {
                if (eye[i] > box.max[i]) {
                    e = eye[i] - box.max[i];
                    dmin += (e * e);
                }
            }
        }
        return (dmin <= radius2);
    }

    /** Sets radii of inner and outer locality spheres
     * @private
     */
    this.setRadii = function(r) {
        radii = {
            outer : r.inner,
            inner : r.outer
        };
        radii2 = {
            inner : r.inner * r.inner,
            outer : r.outer * r.outer
        };
    };

    /** Returns current inner and ouer sphere radii
     * @private
     */
    this.getRadii = function() {
        return radii;
    };

    /** Tests the given axis-aligned bounding box for intersection with the outer locality sphere
     *
     * @param box
     * @private
     */
    this.testAxisBoxIntersectOuterRadius = function(box) {
        return intersects(radii2.outer, box);
    };

    /** Tests the given axis-aligned bounding box for intersection with the inner locality sphere
     *
     * @param box
     * @private
     */
    this.testAxisBoxIntersectInnerRadius = function(box) {
        return intersects(radii2.inner, box);
    };
})();
/**
 * @class A scene node that specifies the spatial boundaries of scene graph subtrees to support visibility and
 * level-of-detail culling.
 *
 * <p>The subgraphs of these are only traversed when the boundary intersect the current view frustum. When this node
 * is within the subgraph of a {@link SceneJS.Locality} node, it the boundary must also intersect the inner radius of the Locality.
 * the outer radius of the Locality is used internally by SceneJS to support content staging strategies.</p>
 *
 * <p>When configured with a projected size threshold for each child, they can also function as level-of-detail (LOD) selectors.</p>
 * 
 *  <p><b>Example 1.</b></p><p>This BoundingBox is configured to work as a level-of-detail selector. The 'levels'
 * property specifies thresholds for the boundary's projected size, each corresponding to one of the node's children,
 * such that the child corresponding to the threshold imediately below the boundary's current projected size is only one
 * currently traversable.</p><p>This boundingBox will select exactly one of its child nodes to render for its current projected size, where the
 * levels parameter specifies for each child the size threshold above which the child becomes selected. No child is
 * selected (nothing is drawn) when the projected size is below the lowest level.</p>
 * <pre><code>
 * var bb = new SceneJS.BoundingBox({
 *          xmin: -2,
 *          ymin: -2,
 *          zmin: -2,
 *          xmax:  2,
 *          ymax:  2,
 *          zmax:  2,
 *
 *           // Levels are optional - acts as regular
 *          // frustum-culling bounding box when not specified
 *
 *          levels: [
 *             10,
 *             200,
 *             400,
 *             600
 *         ]
 *     },
 *
 *     // When size > 10px, draw a cube
 *
 *     new SceneJS.objects.Cube(),
 *
 *     // When size > 200px,  draw a low-detail sphere
 *
 *     new SceneJS.objects.Sphere({
 *         radius: 1,
 *         slices:10,
 *         rings:10
 *     }),
 *
 *     // When size > 400px, draw a medium-detail sphere
 *
 *     new SceneJS.objects.Sphere({
 *         radius: 1,
 *         slices:20,
 *         rings:20
 *     }),
 *
 *     // When size > 600px, draw a high-detail sphere
 *
 *     new SceneJS.objects.Sphere({
 *         radius: 1,
 *         slices:120,
 *         rings:120
 *     })
 * )
 * </code></pre>
 * @extends SceneJS.Node
 * @since Version 0.7.4
 * @constructor
 * Creates a new SceneJS.BoundingBox
 * @param {Object} [cfg] Static configuration object
 * @param {double} [cfg.xmin = -1.0] Minimum X-axis extent
 * @param {double} [cfg.ymin = -1.0] Minimum Y-axis extent
 * @param {double} [cfg.zmin = -1.0] Minimum Z-axis extent
 * @param {double} [cfg.xmax = 1.0] Maximum X-axis extent
 * @param {double} [cfg.ymax = 1.0] Maximum Y-axis extent
 * @param {double} [cfg.zmax = 1.0] Maximum Z-axis extent
 * @param {double[]} [cfg.levels] Projected size thresholds for level-of-detail culling
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.BoundingBox = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "bounding-box";
    this._xmin = 0;
    this._ymin = 0;
    this._zmin = 0;
    this._xmax = 0;
    this._ymax = 0;
    this._zmax = 0;
    this._levels = null;
    this._states = [];
    this._objectsCoords = null;  // Six object-space vertices for memo level 1
    this._viewBox = null;         // Axis-aligned view-space box for memo level 2
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.BoundingBox, SceneJS.Node);

/**
 * Sets the minimum X extent
 * @function {SceneJS.BoundingBox} setXMin
 * @param {double} xmin Minimum X extent
 * @returns {SceneJS.BoundingBox} this
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.setXMin = function(xmin) {
    this._xmin = xmin;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the minimum X extent
 * @function {double} getXMin
 * @returns {double} Minimum X extent
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.getXMin = function() {
    return this._xmin;
};

/**
 * Sets the minimum Y extent
 *
 * @function  {SceneJS.BoundingBox} setYMin
 * @param {double} ymin Minimum Y extent
 * @returns {SceneJS.BoundingBox} this
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.setYMin = function(ymin) {
    this._ymin = ymin;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the minimum Y extent
 * @function {double} getYMin
 * @returns {double} Minimum Y extent
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.getYMin = function() {
    return this._ymin;
};

/**
 * Sets the minimum Z extent
 *
 * @function {SceneJS.BoundingBox} setZMin
 * @param {double} zmin Minimum Z extent
 * @returns {SceneJS.BoundingBox} this
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.setZMin = function(zmin) {
    this._zmin = zmin;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the minimum Z extent
 * @function {double} getZMin
 * @returns {double} Minimum Z extent
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.getZMin = function() {
    return this._zmin;
};

/**
 * Sets the maximum X extent
 *
 * @function  {SceneJS.BoundingBox} setXMax
 * @param {double} xmax Maximum X extent
 * @returns {SceneJS.BoundingBox} this
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.setXMax = function(xmax) {
    this._xmax = xmax;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the maximum X extent
 * @function  {SceneJS.BoundingBox} setXMax
 * @returns {double} Maximum X extent
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.getXMax = function() {
    return this._xmax;
};

/**
 * Sets the maximum Y extent
 *
 * @function {SceneJS.BoundingBox} setYMax
 * @param {double} ymax Maximum Y extent
 * @returns {SceneJS.BoundingBox} this
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.setYMax = function(ymax) {
    this._ymax = ymax;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the maximum Y extent
 * @function {double} getYMax
 * @return {double} Maximum Y extent
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.getYMax = function() {
    return this._ymax;
};

/**
 * Sets the maximum Z extent
 *
 * @function {SceneJS.BoundingBox} setZMax
 * @param {double} zmax Maximum Z extent
 * @returns {SceneJS.BoundingBox} this
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.setZMax = function(zmax) {
    this._zmax = zmax;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the maximum Z extent
 * @function {double} getZMax
 * @returns {double} Maximum Z extent
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.getZMax = function() {
    return this._zmax;
};

/**
 * Sets all extents
 * @function {SceneJS.BoundingBox} setBoundary
 * @param {Object} [boundary] Boundary extents
 * @param {double} [boundary.xmin = -1.0] Minimum X-axis extent
 * @param {double} [boundary.ymin = -1.0] Minimum Y-axis extent
 * @param {double} [boundary.zmin = -1.0] Minimum Z-axis extent
 * @param {double} [boundary.xmax = 1.0] Maximum X-axis extent
 * @param {double} [boundary.ymax = 1.0] Maximum Y-axis extent
 * @param {double} [boundary.zmax = 1.0] Maximum Z-axis extent
 * @returns {SceneJS.BoundingBox} this
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.setBoundary = function(boundary) {
    this._xmin = boundary.xmin || 0;
    this._ymin = boundary.ymin || 0;
    this._zmin = boundary.zmin || 0;
    this._xmax = boundary.xmax || 0;
    this._ymax = boundary.ymax || 0;
    this._zmax = boundary.zmax || 0;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets all extents
 * @function {Object} getBoundary
 * @returns {Object}  The boundary extents - {xmin: float, ymin: float, zmin: float, xmax: float, ymax: float, zmax: float}
 * @since Version 0.7.4
 */
SceneJS.BoundingBox.prototype.getBoundary = function() {
    return {
        xmin: this._xmin,
        ymin: this._ymin,
        zmin: this._zmin,
        xmax: this._xmax,
        ymax: this._ymax,
        zmax: this._zmax
    };
};

// @private
SceneJS.BoundingBox.prototype._init = function(params) {
    this._xmin = params.xmin || 0;
    this._ymin = params.ymin || 0;
    this._zmin = params.zmin || 0;
    this._xmax = params.xmax || 0;
    this._ymax = params.ymax || 0;
    this._zmax = params.zmax || 0;
    if (params.levels) {
        if (params.levels.length != this._children.length) {
          throw SceneJS._errorModule.fatalError(new SceneJS.errors.NodeConfigExpectedException
                    ("SceneJS.boundingBox levels property should have a value for each child node"));
        }

        for (var i = 1; i < params.levels.length; i++) {
            if (params.levels[i - 1] >= params.levels[i]) {
                throw SceneJS._errorModule.fatalError(new SceneJS.errors.NodeConfigExpectedException
                        ("SceneJS.boundingBox levels property should be an ascending list of unique values"));
            }
        }
        this._levels = params.levels;
    }
};

// @private
SceneJS.BoundingBox.prototype._render = function(traversalContext, data) {
    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
        var modelTransform = SceneJS._modelTransformModule.getTransform();
        if (!modelTransform.identity) {

            /* Model transform exists
             */
            this._objectCoords = [
                [this._xmin, this._ymin, this._zmin],
                [this._xmax, this._ymin, this._zmin],
                [this._xmax, this._ymax, this._zmin],
                [this._xmin, this._ymax, this._zmin],
                [this._xmin, this._ymin, this._zmax],
                [this._xmax, this._ymin, this._zmax],
                [this._xmax, this._ymax, this._zmax],
                [this._xmin, this._ymax, this._zmax]
            ];
        } else {

            /* No model transform
             */
            this._viewBox = {
                min: [this._xmin, this._ymin, this._zmin],
                max: [this._xmax, this._ymax, this._zmax]
            };
            this._memoLevel = 2;
        }
    }

    if (this._memoLevel < 2) {
        var modelTransform = SceneJS._modelTransformModule.getTransform();
        this._viewBox = new SceneJS._math_Box3().fromPoints(
                SceneJS._math_transformPoints3(
                        modelTransform.matrix,
                        this._objectCoords)
                );
        if (modelTransform.fixed && this._memoLevel == 1 && (!SceneJS._instancingModule.instancing())) {
            this._objectCoords = null;
            this._memoLevel = 2;
        }
    }
    if (SceneJS._localityModule.testAxisBoxIntersectOuterRadius(this._viewBox)) {
        if (SceneJS._localityModule.testAxisBoxIntersectInnerRadius(this._viewBox)) {
            var result = SceneJS._frustumModule.testAxisBoxIntersection(this._viewBox);
            switch (result) {
                case SceneJS._math_INTERSECT_FRUSTUM:  // TODO: GL clipping hints
                case SceneJS._math_INSIDE_FRUSTUM:
                    if (this._levels) { // Level-of-detail mode
                        var size = SceneJS._frustumModule.getProjectedSize(this._viewBox);
                        for (var i = this._levels.length - 1; i >= 0; i--) {
                            if (this._levels[i] <= size) {
                                var state = this._states[i];
                                this._renderNode(i, traversalContext, data);
                                return;
                            }
                        }
                    } else {
                        this._renderNodes(traversalContext, data);
                    }
                    break;

                case SceneJS._math_OUTSIDE_FRUSTUM:
                    break;
            }
        } else {

            /* Allow content staging for subgraph
             */

            // TODO:

            this._renderNodes(traversalContext, data);
        }
    }
};

/** Factory function that returns a new {@link SceneJS.BoundingBox} instance
 * @param {Object} [cfg] Static configuration object
 * @param {double} [cfg.xmin = -1.0] Minimum X-axis extent
 * @param {double} [cfg.ymin = -1.0] Minimum Y-axis extent
 * @param {double} [cfg.zmin = -1.0] Minimum Z-axis extent
 * @param {double} [cfg.xmax = 1.0] Maximum X-axis extent
 * @param {double} [cfg.ymax = 1.0] Maximum Y-axis extent
 * @param {double} [cfg.zmax = 1.0] Maximum Z-axis extent
 * @param {float[]} [cfg.levels] Projected size thresholds for level-of-detail culling
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.BoundingBox}
 * @since Version 0.7.3
 */
SceneJS.boundingBox = function() {
    var n = new SceneJS.BoundingBox();
    SceneJS.BoundingBox.prototype.constructor.apply(n, arguments);
    return n;
};


/**
 *@class A scene node that defines inner and outer spheres of locality centered about the viewpoint.
 *<p>The subgraphs of contained {@link SceneJS.BoundingBox} nodes will only be rendered when their boundaries intersect
 *the inner radius.</p><p>The outer radius is used internally by SceneJS to support content staging strategies.</p>
 *<p>You can have as many of these as neccessary throughout your scene.</p>
 * <p>When you don't specify a Locality node, SceneJS has default inner and outer radii of 100000
 * and 200000, respectively.</p>
 *<p><b>Example:</b></p><p>Defining a locality</b></p><pre><code>
 *  var locality = new SceneJS.Locality({
 *      inner: 100000,  // Default node values, override these where needed
 *      outer: 200000
 *      },
 *
 *      // ... child nodes containing SceneJS.BoundingBox nodes ...
 *  )
 *</pre></code>
 * @extends SceneJS.Node
 * @since Version 0.7.3
 * @constructor
 * Create a new SceneJS.Locality
 * @param {Object} [cfg] Static configuration object
 * @param {double} [cfg.inner = 100000] Inner radius
 * @param {double} [cfg.outer = 200000] Outer radius
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Locality = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "locality";
    this._radii = {
        inner : 100000,
        outer : 200000
    };
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Locality, SceneJS.Node);

/**
 Sets the inner radius
 @function setInner
 @param {double} inner
 @returns {SceneJS.Locality} this
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.setInner = function(inner) {
    this._radii.inner = inner;
    return this;
};

/**
 Returns the inner radius
 @function {double} getInner
 @returns {double} Inner radius
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.getInner = function() {
    return this._radii.inner;
};

/**
 Sets the outer radius
 @function setOuter
 @param {double} outer
 @returns {SceneJS.Locality} this
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.setOuter = function(outer) {
    this._radii.outer = outer;
    return this;
};

/**
 Returns the outer radius
 @function {double} getOuter
 @returns {double} Outer radius
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.getOuter = function() {
    return this._radii.outer;
};

// @private
SceneJS.Locality.prototype._init = function(params) {
    if (params.inner) {
        this.setInner(params.inner);
    }
    if (params.outer) {
        this.setOuter(params.outer);
    }
};

// @private
SceneJS.Locality.prototype._render = function(traversalContext, data) {
    if (!this._fixedParams) {
        this._init(this._getParams(data));
    }
    var prevRadii = SceneJS._localityModule.getRadii();
    SceneJS._localityModule.setRadii(this._radii);
    this._renderNodes(traversalContext, data);
    SceneJS._localityModule.setRadii(prevRadii);
};

/** Returns a new SceneJS.Locality instance
 * @param {Object} [cfg] Static configuration object
 * @param {double} [cfg.inner = 100000] Inner radius
 * @param {double} [cfg.outer = 200000] Outer radius
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Locality}
 * @since Version 0.7.3
 */
SceneJS.locality = function() {
    var n = new SceneJS.Locality();
    SceneJS.Locality.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that manages material texture layers.
 *
 * Manages asynchronous load of texture images.
 *
 * Caches textures with a least-recently-used eviction policy.
 *
 * Holds currently-applied textures as "layers". Each layer specifies a texture and a set of parameters for
 * how the texture is to be applied, ie. to modulate ambient, diffuse, specular material colors, geometry normals etc.
 *
 * Holds the layers on a stack and provides the SceneJS.texture node with methods to push and pop them.
 *
 * Interacts with the shading backend through events; on a SHADER_RENDERING event it will respond with a
 * TEXTURES_EXPORTED to pass the entire layer stack to the shading backend.
 *
 * Avoids redundant export of the layers with a dirty flag; they are only exported when that is set, which occurs
 * when the stack is pushed or popped by the texture node, or on SCENE_RENDERING, SHADER_ACTIVATED and
 * SHADER_DEACTIVATED events.
 *
 * Whenever a texture node pushes or pops the stack, this backend publishes it with a TEXTURES_UPDATED to allow other
 * dependent backends to synchronise their resources.
 *
 *  @private
 */
SceneJS._textureModule = new (function() {

    var time = (new Date()).getTime();      // Current system time for LRU caching
    var canvas;
    var textures = {};
    var layerStack = [];
    var dirty;

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.TIME_UPDATED,
            function(t) {
                time = t;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                layerStack = [];
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.CANVAS_ACTIVATED,
            function(c) {
                canvas = c;
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.CANVAS_DEACTIVATED,
            function() {
                canvas = null;
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (dirty) {
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.TEXTURES_EXPORTED,
                            layerStack
                            );
                    dirty = false;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                dirty = true;
            });

    /** Removes texture from shader (if canvas exists in DOM) and deregisters it from backend
     * @private
     */
    function deleteTexture(texture) {
        textures[texture.textureId] = undefined;
        if (document.getElementById(texture.canvas.canvasId)) {
            texture.destroy();
        }
    }

    /**
     * Deletes all textures from their GL contexts - does not attempt
     * to delete them when their canvases no longer exist in the DOM.
     * @private
     */
    function deleteTextures() {
        for (var textureId in textures) {
            var texture = textures[textureId];
            deleteTexture(texture);
        }
        textures = {};
        layerStack = [];
        dirty = true;
    }

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RESET, // Framework reset - delete textures
            function() {
                deleteTextures();
            });

    /**
     * Registers this backend module with the memory management module as willing
     * to attempt to destroy a texture when asked, in order to free up memory. Eviction
     * is done on a least-recently-used basis, where a texture may be evicted if the
     * time that it was last used is the earliest among all textures, and after the current
     * system time. Since system time is updated just before scene traversal, this ensures that
     * textures previously or currently active during this traversal are not suddenly evicted.
     */
    SceneJS._memoryModule.registerEvictor(
            function() {
                var earliest = time; // Doesn't evict textures that are current in layers
                var evictee;
                for (var id in textures) {
                    if (id) {
                        var texture = textures[id];
                        if (texture.lastUsed < earliest) {
                            evictee = texture;
                            earliest = texture.lastUsed;
                        }
                    }
                }
                if (evictee) { // Delete LRU texture
                    SceneJS._loggingModule.info("Evicting texture: " + id);
                    deleteTexture(evictee);
                    return true;
                }
                return false;   // Couldnt find suitable evictee
            });

    /**
     * Translates a SceneJS param value to a WebGL enum value,
     * or to default if undefined. Throws exception when defined
     * but not mapped to an enum.
     * @private
     */
    function getGLOption(name, context, cfg, defaultVal) {
        var value = cfg[name];
        if (value == undefined) {
            return defaultVal;
        }
        var glName = SceneJS._webgl_enumMap[value];
        if (glName == undefined) {
            throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException(
                    "Unrecognised value for SceneJS.texture node property '" + name + "' value: '" + value + "'"));
        }
        var glValue = context[glName];
        //                if (!glValue) {
        //                    throw new SceneJS.errors.WebGLUnsupportedNodeConfigException(
        //                            "This browser's WebGL does not support value of SceneJS.texture node property '" + name + "' value: '" + value + "'");
        //                }
        return glValue;
    }

    /** Returns default value for when given value is undefined
     * @private
     */
    function getOption(value, defaultVal) {
        return (value == undefined) ? defaultVal : value;
    }


    /** Verifies that texture still cached - it may have been evicted after lack of recent use,
     * in which case client texture node will have to recreate it.
     * @private
     */
    this.textureExists = function(texture) {
        return textures[texture.textureId];
    };

    this.createTexture = function(uri, cfg, onSuccess, onError, onAbort) {
        var image = new Image();
        var _canvas = canvas;
        var _context = canvas.context;
        var process = SceneJS._processModule.createProcess({ // To support monitor of image loads through SceneJS PROCESS_XXX events
            description:"creating texture: uri = " + uri,
            timeoutSecs: -1 // Relying on Image object for timeout
        });
        //alert(uri);
        image.onload = function() {
            var textureId = SceneJS._createKeyForMap(textures, "t");
            SceneJS._memoryModule.allocate(
                    _context,
                    "texture '" + textureId + "'",
                    function() {
                        try {
                            textures[textureId] = new SceneJS._webgl_Texture2D(_context, {
                                textureId : textureId,
                                canvas: _canvas,
                                image : image,
                                texels :cfg.texels,
                                minFilter : getGLOption("minFilter", _context, cfg, _context.LINEAR),
                                magFilter :  getGLOption("magFilter", _context, cfg, _context.LINEAR),
                                wrapS : getGLOption("wrapS", _context, cfg, _context.CLAMP_TO_EDGE),
                                wrapT :   getGLOption("wrapT", _context, cfg, _context.CLAMP_TO_EDGE),
                                isDepth :  getOption(cfg.isDepth, false),
                                depthMode : getGLOption("depthMode", _context, cfg, _context.LUMINANCE),
                                depthCompareMode : getGLOption("depthCompareMode", _context, cfg, _context.COMPARE_R_TO_TEXTURE),
                                depthCompareFunc : getGLOption("depthCompareFunc", _context, cfg, _context.LEQUAL),
                                flipY : getOption(cfg.flipY, true),
                                width: getOption(cfg.width, 1),
                                height: getOption(cfg.height, 1),
                                internalFormat : getGLOption("internalFormat", _context, cfg, _context.LEQUAL),
                                sourceFormat : getGLOption("sourceType", _context, cfg, _context.ALPHA),
                                sourceType : getGLOption("sourceType", _context, cfg, _context.UNSIGNED_BYTE),
                                logging: SceneJS._loggingModule
                            });
                        } catch (e) {
                             throw SceneJS._errorModule.fatalError("Failed to create texture: \"" + uri + "\" : " + e);
                        }
                    });
            SceneJS._processModule.killProcess(process);
            onSuccess(textures[textureId]);
        };
        image.onerror = function() {
            SceneJS._processModule.killProcess(process);
            onError();
        };
        image.onabort = function() {
            SceneJS._processModule.killProcess(process);
            onAbort();
        };
        image.src = uri;  // Starts image load
        return image;
    };

    // @private
    this.pushLayer = function(texture, params) {
        if (!textures[texture.textureId]) {
            throw SceneJS._errorModule.fatalError("No such texture loaded \"" + texture.textureId + "\"");
        }
        texture.lastUsed = time;

        if (params.matrix && !params.matrixAsArray) {
            params.matrixAsArray = new WebGLFloatArray(params.matrix);
        }
        layerStack.push({
            texture: texture,
            params: params
        });
        dirty = true;
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.TEXTURES_UPDATED, layerStack);
    };

    // @private
    this.popLayers = function(nLayers) {
        for (var i = 0; i < nLayers; i++) {
            layerStack.pop();
        }
        dirty = true;
        SceneJS._eventModule.fireEvent(SceneJS._eventModule.TEXTURES_UPDATED, layerStack);
    };
})();
/**
 @class A layer within a {@link SceneJS.Texture} node.

 @constructor
 Create a new SceneJS.TextureLayer
 @param {Object} cfg The config object
 */
SceneJS.TextureLayer = function(cfg) {
        this._imageURL = null;
        this._minFilter = "linear";
        this._magFilter = "linear";
        this._wrapS = "clampToEdge";
        this._wrapT = "clampToEdge";
        this._isDepth = false;
        this._depthMode = "luminance";
        this._depthCompareMode = "compareRToTexture";
        this._depthCompareFunc = "lequal";
        this._flipY = true;
        this._width = 1;
        this._height = 1;
        this._internalFormat = "alpha";
        this._sourceFormat = "alpha";
        this._sourceType = "unsignedByte";
        this._dirty = true; // Needs recreate when this is dirty        
};


/**
 * @class A scene node that defines one or more layers of texture to apply to all geometries within its subgraph that have UV coordinates.
 * @extends SceneJS.node
 * <p>Texture layers are applied to specified material reflection cooficients, and may be transformed.</p>

 * <p>A cube wrapped with a material which specifies its base (diffuse) color coefficient, and a texture with
 * one layer which applies a texture image to that particular coefficient. The texture is also translated, scaled and
 * rotated, in that order. All the texture properties are specified here to show what they are. </p>
 *  <pre><code>
 * var subGraph =
 *       new SceneJS.Material({
 *           baseColor: { r: 1.0, g: 1.0, b: 1.0 }
 *       },
 *               new SceneJS.Texture({
 *                   layers: [
 *                       {
 *                           // Only the image URI is mandatory:
 *
 *                           uri:"http://scenejs.org/library/textures/misc/general-zod.jpg",
 *
 *                          // Optional params:
 *
 *                           minFilter: "linear",                   // Options are ”nearest”, “linear” (default), “nearestMipMapNearest”,
 *                                                                  //        ”nearestMipMapLinear” or “linearMipMapLinear”
 *                           magFilter: "linear",                   // Options are “nearest” or “linear” (default)
 *                           wrapS: "repeat",                       // Options are “clampToEdge” (default) or “repeat”
 *                           wrapT: "repeat",                       // Options are "clampToEdge” (default) or “repeat”
 *                           isDepth: false,                        // Options are false (default) or true
 *                           depthMode:"luminance"                  // (default)
 *                           depthCompareMode: "compareRToTexture", // (default)
 *                           depthCompareFunc: "lequal",            // (default)
 *                           flipY: false,                          // Options are true (default) or false
 *                           width: 1,
 *                           height: 1,
 *                           internalFormat:"lequal",               // (default)
 *                           sourceFormat:"alpha",                  // (default)
 *                           sourceType: "unsignedByte",            // (default)
 *                           applyTo:"baseColor",                   // Options so far are “baseColor” (default) or “diffuseColor”
 *
 *                           // Optional transforms - these can also be functions, as shown in the next example
 *
 *                           rotate: {      // Currently textures are 2-D, so only rotation about Z makes sense
 *                               z: 45.0
 *                           },
 *
 *                           translate : {
 *                               x: 10,
 *                               y: 0,
 *                               z: 0
 *                           },
 *
 *                           scale : {
 *                               x: 1,
 *                               y: 2,
 *                               z: 1
 *                           }
 *                       }
 *                   ]
 *               },
 *
 *               new SceneJS.objects.Cube()
 *           )
 *     );
 *  </code></pre>
 *
 * <p><b>Example 2</b></p>
 * <p>You can animate texture transformations - this example shows how the rotate, scale and translate properties
 * can be functions to take their values from the data scope, in this case created by a higher WithData node:</p>
 *  <pre><code>
 * var subGraph =
 *       new SceneJS.WithData({
 *           angle: 45.0   // Vary this value to rotate the texture
 *       },
 *               new SceneJS.Texture({
 *                   layers: [
 *                       {
 *                           uri:"http://scenejs.org/library/textures/misc/general-zod.jpg",
 *
 *                           rotate: function(data) {
 *                               return { z: data.get("angle") }
 *                           }
 *                       }
 *                   ]
 *               },
 *               new SceneJS.objects.Cube()
 *         )
 *   );
 *  </code></pre>
 * @constructor
 * Create a new SceneJS.texture
 * @param {Object} The config object or function, followed by zero or more child nodes
 */
SceneJS.Texture = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "texture";
    this._layers = null;
};

SceneJS._inherit(SceneJS.Texture, SceneJS.Node);

// @private
SceneJS.Texture.prototype._getMatrix = function(translate, rotate, scale) {
    var matrix = null;
    var t;
    if (translate) {
        matrix = SceneJS._math_translationMat4v([ translate.x || 0, translate.y || 0, translate.z || 0]);
    }
    if (scale) {
        t = SceneJS._math_scalingMat4v([ scale.x || 1, scale.y || 1, scale.z || 1]);
        matrix = matrix ? SceneJS._math_mulMat4(matrix, t) : t;
    }
    if (rotate) {
        if (rotate.x) {
            t = SceneJS._math_rotationMat4v(rotate.x * 0.0174532925, [1,0,0]);
            matrix = matrix ? SceneJS._math_mulMat4(matrix, t) : t;
        }
        if (rotate.y) {
            t = SceneJS._math_rotationMat4v(rotate.y * 0.0174532925, [0,1,0]);
            matrix = matrix ? SceneJS._math_mulMat4(matrix, t) : t;
        }
        if (rotate.z) {
            t = SceneJS._math_rotationMat4v(rotate.z * 0.0174532925, [0,0,1]);
            matrix = matrix ? SceneJS._math_mulMat4(matrix, t) : t;
        }
    }
    return matrix;
};

/** Ready to create texture layer
 *  @private
 */
SceneJS.Texture._STATE_INITIAL = 0;

/** Texture layer image load in progress
 *  @private
 */
SceneJS.Texture._STATE_LOADING = 1;

/** Texture layer image load completed
 *  @private
 */
SceneJS.Texture._STATE_LOADED = 2;

/** Texture layer creation or image load failed
 * @private
 */
SceneJS.Texture._STATE_ERROR = -1;


// @private
SceneJS.Texture.prototype._init = function(params) {
    this._layers = [];
    if (!params.layers) {
        throw new SceneJS.errors.NodeConfigExpectedException(
                "SceneJS.Texture.layers is undefined");
    }
    for (var i = 0; i < params.layers.length; i++) {
        var layerParam = params.layers[i];
        if (!layerParam.uri) {
            throw new SceneJS.errors.NodeConfigExpectedException(
                    "SceneJS.Texture.layers[" + i + "].uri is undefined");
        }
        if (layerParam.applyFrom) {
            if (layerParam.applyFrom != "uv" &&
                layerParam.applyFrom != "uv2" &&
                layerParam.applyFrom != "normal" &&
                layerParam.applyFrom != "geometry") {
                throw SceneJS._errorModule.fatalError(
                        new SceneJS.errors.InvalidNodeConfigException(
                                "SceneJS.Texture.layers[" + i + "].applyFrom value is unsupported - " +
                                "should be either 'uv', 'uv2', 'normal' or 'geometry'"));
            }
        }
        if (layerParam.applyTo) {
            if (layerParam.applyTo != "baseColor" && // Colour map
                layerParam.applyTo != "diffuseColor") {
                throw SceneJS._errorModule.fatalError(
                        new SceneJS.errors.InvalidNodeConfigException(
                                "SceneJS.Texture.layers[" + i + "].applyTo value is unsupported - " +
                                "should be either 'baseColor', 'diffuseColor'"));
            }
        }
        this._layers.push({
            state : SceneJS.Texture._STATE_INITIAL,
            process: null,                      // Image load process handle
            image : null,                       // Initialised when state == IMAGE_LOADED
            creationParams: layerParam,         // Create texture using this
            texture: null,                      // Initialised when state == TEXTURE_LOADED
            createMatrix : new (function() {
                var translate = layerParam.translate;
                var rotate = layerParam.rotate;
                var scale = layerParam.scale;
                var dynamic = ((translate instanceof Function) ||
                               (rotate instanceof Function) ||
                               (scale instanceof Function));
                var defined = dynamic || translate || rotate || scale;
                return function(data) {
                    var matrix = null;
                    if (defined && (dynamic || !matrix)) {
                        matrix = SceneJS.Texture.prototype._getMatrix(
                                (translate instanceof Function) ? translate(data) : translate,
                                (rotate instanceof Function) ? rotate(data) : rotate,
                                (scale instanceof Function) ? scale(data) : scale);
                    }
                    return matrix;
                };
            })(),
            applyFrom: layerParam.applyFrom || "uv",
            applyTo: layerParam.applyTo || "baseColor",
            blendMode: layerParam.blendMode || "multiply"
        });
    }
};

SceneJS.Texture.prototype._render = function(traversalContext, data) {
    if (!this._layers) { // One-shot dynamic config
        this._init(this._getParams(data));
    }

    /*-----------------------------------------------------
     * On each render, update state of each texture layer
     * and count how many are ready to apply
     *-----------------------------------------------------*/

    var countLayersReady = 0;
    for (var i = 0; i < this._layers.length; i++) {
        var layer = this._layers[i];

        if (layer.state == SceneJS.Texture._STATE_LOADED) {
            if (!SceneJS._textureModule.textureExists(layer.texture)) {  // Texture evicted from cache
                layer.state = SceneJS.Texture._STATE_INITIAL;

            }
        }


        switch (layer.state) {

            case SceneJS.Texture._STATE_LOADED: // Layer ready to apply
                countLayersReady++;
                break;

            case SceneJS.Texture._STATE_INITIAL: // Layer load to start
                layer.state = SceneJS.Texture._STATE_LOADING;
                (function(l) { // Closure allows this layer to receive results
                    SceneJS._textureModule.createTexture(
                            l.creationParams.uri,
                            l.creationParams,

                            function(texture) { // Success
                                l.texture = texture;
                                l.state = SceneJS.Texture._STATE_LOADED;                                
                            },

                            function() { // General error, probably 404
                                l.state = SceneJS.Texture._STATE_ERROR;
                                var message = "SceneJS.texture image load failed: " + l.creationParams.uri;
                                SceneJS._loggingModule.warn(message);
                            },

                            function() { // Load aborted - user probably refreshed/stopped page
                                SceneJS._loggingModule.warn("SceneJS.texture image load aborted: " + l.creationParams.uri);
                                l.state = SceneJS.Texture._STATE_ERROR;
                            });
                }).call(this, layer);
                break;

            case SceneJS.Texture._STATE_LOADING: // Layer still loading
                break;

            case SceneJS.Texture._STATE_ERROR: // Layer disabled
                break;
        }
    }

    /*------------------------------------------------
     * Render this node
     *-----------------------------------------------*/

    if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
        this._renderNodes(traversalContext, data);
    } else {

        /* Fastest strategy is to allow the complete set of layers to load
         * before applying any of them. There would be a huge performance penalty
         * if we were to apply the incomplete set as layers are still loading -
         * SceneJS._shaderModule would then have to generate a new shader for each new
         * layer loaded, which would become redundant as soon as the next layer is loaded.
         */

        if (countLayersReady == this._layers.length) {
            var countPushed = 0;
            for (var i = 0; i < this._layers.length; i++) {
                var layer = this._layers[i];

                if (layer.state = SceneJS.Texture._STATE_LOADED) {
                    SceneJS._textureModule.pushLayer(layer.texture, {
                        applyFrom : layer.applyFrom,
                        applyTo : layer.applyTo,
                        blendMode : layer.blendMode,
                        matrix: layer.createMatrix(data)
                    });
                    countPushed++;
                }
            }
            this._renderNodes(traversalContext, data);
            SceneJS._textureModule.popLayers(countPushed);

        } else {
            this._renderNodes(traversalContext, data);
        }
    }
};


/** Factory function that returns a new {@link SceneJS.Texture} instance
 */
SceneJS.texture = function() {
    var n = new SceneJS.Texture();
    SceneJS.Texture.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that manages scene fog.
 *
 * @private
 */
SceneJS._fogModule = new (function() {

    var fog;
    var dirty;

    // @private
    function colourToArray(v, fallback) {
        return v ?
               [
                   v.r != undefined ? v.r : fallback[0],
                   v.g != undefined ? v.g : fallback[1],
                   v.b != undefined ? v.b : fallback[2]
               ] : fallback;
    }

    // @private
    function _createFog(f) {
        if (f.mode &&
            (f.mode != "disabled"
                    && f.mode != "exp"
                    && f.mode != "exp2"
                    && f.mode != "linear")) {
            ctx.fatalError(new SceneJS.errors.InvalidNodeConfigException(
                    "SceneJS.fog node has a mode of unsupported type - should be 'none', 'exp', 'exp2' or 'linear'"));
        }
        if (f.mode == "disabled") {
            return {
                mode: f.mode || "exp"
            };
        } else {
            return {
                mode: f.mode || "exp",
                color: colourToArray(f.color, [ 0.5,  0.5, 0.5 ]),
                density: f.density || 1.0,
                start: f.start || 0,
                end: f.end || 1.0
            };
        }
    }

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function() {
                _createFog({});
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (dirty) {
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.FOG_EXPORTED,
                            fog);
                    dirty = false;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_DEACTIVATED,
            function() {
                dirty = true;
            });

    /** Sets the current fog
     *
     * @private
     * @param f
     */
    this.setFog = function(f) {
        fog = f ? _createFog(f) : null;
        dirty = true;
        SceneJS._eventModule.fireEvent(
                SceneJS._eventModule.FOG_UPDATED,
                fog);
    };

    /** Returns the current fog
     * @private
     */
    this.getFog = function() {
        return fog;
    };

})();

/**
 * @class A scene node that defines fog for nodes in its sub graph.

 * <p>Fog is effectively a region on the Z-axis of the view coordinate system within which
 * the colour of elements will blend with the scene ambient colour in proportion to their depth. You can define the
 * points on the Z axis at which the fog region starts and ends, along with the proportion as a linear, exponential
 * or quadratic mode. Scene content falling in front of the start point will have no fog applied, while content
 * after the end point will be invisible, having blended completely into the ambient colour.</p>
 * 
 * <p><b>Example Usage</b></p><p>Definition of fog with parameters that happen to be the defaults -
 * starting at Z=1, extending until Z=1000, linear mode, gray colour. Objects beyond Z=1000 will be entirely merged
 * into the background.</b></p><pre><code>
 * var fog = new SceneJS.Fog({
 *         mode:"linear",
 *         color: { r: 0.5, g: 0.5, b: 0.5 },
 *         density: 1.0,
 *         start: 1,
 *         end: 1000
 *     },
 *
 *     // ... child nodes
 * )
 * </pre></code>
 * @extends SceneJS.Node
 * @since Version 0.7.4
 * @constructor
 * Creates a new SceneJS.Fog
 * @param {Object} [cfg] Static configuration object
 * @param {String} [cfg.mode = "linear"] The fog mode - "disabled", "exp", "exp2" or "linear"
 * @param {Object} [cfg.color = {r: 0.5, g: 0.5, b: 0.5 } The fog color
 * @param {double} [cfg.density = 1.0] The fog density factor
 * @param {double} [cfg.start = 1.0] Point on Z-axis at which fog effect begins
 * @param {double} [cfg.end = 1.0] Point on Z-axis at which fog effect ends
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Fog = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "fog";
    this._mode = "linear";
    this._color = { r: 0.5, g: 0.5, b: 0.5 };
    this._density = 1.0;
    this._start = 0;
    this._end = 1000.0;
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Fog, SceneJS.Node);

/**
 Sets the fogging mode
 @function setMode
 @param {string} mode - "disabled", "exp", "exp2" or "linear"
 @returns {SceneJS.Fog} This fog node
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.setMode = function(mode) {
    if (mode != "disabled" && mode != "exp" && mode != "exp2" && mode != "linear") {
        throw SceneJS._errorModule.fatalError(new SceneJS.errors.InvalidNodeConfigException(
                "SceneJS.fog has a mode of unsupported type: '" + mode + " - should be 'none', 'exp', 'exp2' or 'linear'"));
    }
    this._mode = mode;
    return this;
};

/**
 Returns fogging mode
 @function {string} getMode
 @returns {string} The fog mode - "disabled", "exp", "exp2" or "linear"
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.getMode = function() {
    return this._mode;
};

/**
 Sets the fog color
 @function setColor
 @param {object} color - eg. bright red: {r: 1.0, g: 0, b: 0 }
 @returns {SceneJS.Fog} This fog node
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.setColor = function(color) {
    this._color.r = color.r != undefined ? color.r : 0.5;
    this._color.g = color.g != undefined ? color.g : 0.5;
    this._color.b = color.b != undefined ? color.b : 0.5;
    return this;
};

/**
 Returns the fog color
 @function getColor
 @returns {object} Fog color - eg. bright red: {r: 1.0, g: 0, b: 0 }
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.getColor = function() {
    return {
        r: this._color.r,
        g: this._color.g,
        b: this._color.b
    };
};

/**
 Sets the fog density
 @function setDensity
 @param {double} density - density factor
 @returns {SceneJS.Fog} This fog node
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.setDensity = function(density) {
    this._density = density || 1.0;
    return this;
};

/**
 Returns the fog density
 @function {double} getDensity
 @returns {double} Fog density factor
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.getDensity = function() {
    return this._density;
};

/**
 Sets the near point on the Z view-axis at which fog begins
 @function setStart
 @param {double} start - location on Z-axis
 @returns {SceneJS.Fog} This fog node
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.setStart = function(start) {
    this._start = start || 0;
    return this;
};

/**
 Returns the near point on the Z view-axis at which fog begins
 @function {double} getStart
 @returns {double} Position on Z view axis
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.getStart = function() {
    return this._start;
};

/**
 Sets the farr point on the Z view-axis at which fog ends
 @function setEnd
 @param {double} end - location on Z-axis
 @returns {SceneJS.Fog} This fog node
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.setEnd = function(end) {
    this._end = end || 1000.0;
    return this;
};

/**
 Returns the far point on the Z view-axis at which fog ends
 @function {double} getEnd
 @returns {double} Position on Z view axis
 @since Version 0.7.4
 */
SceneJS.Fog.prototype.getEnd = function() {
    return this._end;
};

// @private
SceneJS.Fog.prototype._init = function(params) {
    if (params.mode) {
        this.setMode(params.mode);
    }
    if (params.color) {
        this.setColor(params.color);
    }
    if (params.density != undefined) {
        this.setDensity(params.density);
    }
    if (params.start != undefined) {
        this.setStart(params.start);
    }
    if (params.end != undefined) {
        this.setEnd(params.end);
    }
};

// @private
SceneJS.Fog.prototype._render = function(traversalContext, data) {
    if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
        this._renderNodes(traversalContext, data);
    } else {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        }
        var f = SceneJS._fogModule.getFog();
        SceneJS._fogModule.setFog({
            mode: this._mode,
            color: this._color,
            density: this._density,
            start: this._start,
            end: this._end
        });
        this._renderNodes(traversalContext, data);
        SceneJS._fogModule.setFog(f);
    }
};

/** Factory function that returns a new {@link SceneJS.Fog} instance
 * @param {Object} [cfg] Static configuration object
 * @param {String} [cfg.mode = "linear"] The fog mode - "disabled", "exp", "exp2" or "linear"
 * @param {Object} [cfg.color = {r: 0.5, g: 0.5, b: 0.5 } The fog color
 * @param {double} [cfg.density = 1.0] The fog density factor
 * @param {double} [cfg.start = 1.0] Point on Z-axis at which fog effect begins
 * @param {double} [cfg.end = 1.0] Point on Z-axis at which fog effect ends
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS.Node} [childNodes] Child nodes
 * @returns {SceneJS.Fog}
 * @since Version 0.7.3
 */
SceneJS.fog = function() {
    var n = new SceneJS.Fog();
    SceneJS.Fog.prototype.constructor.apply(n, arguments);
    return n;
};
/**
 * Backend that manages socket interaction.
 *
 * @private
 */
SceneJS._SocketModule = new (function() {

    var debugCfg;
    var sceneMap = {};              // Socket set for each scene
    var activeSceneSockets = null;  // Socket set for the currently-rendering scene
    var socketStack = [];           // Stack of open sockets for current scene
    var activeSocket = null;        // Socket for currently-rendering Socket node, not in stack

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.INIT,
            function() {
                sceneMap = {};
                activeSceneSockets = null;
                socketStack = [];
                activeSocket = null;
            });

    SceneJS._eventModule.addListener(// When scene defined, create a socket map for it
            SceneJS._eventModule.SCENE_RENDERING,
            function(params) {
                debugCfg = SceneJS._debugModule.getConfigs("sockets") || {};
                activeSceneSockets = sceneMap[params.sceneId];
                if (!activeSceneSockets) {
                    activeSceneSockets = {
                        sceneId: params.sceneId,
                        sockets : {}
                    };
                    sceneMap[params.sceneId] = activeSceneSockets;
                }
            });

    SceneJS._eventModule.addListener(// When scene destroyed, close all its sockets
            SceneJS._eventModule.SCENE_DESTROYED,
            function(params) {
                var ss = sceneMap[params.sceneId];
                if (ss) {
                    var socket;
                    for (var socketId in ss.sockets) {
                        if (ss.sockets.hasOwnProperty(socketId)) {
                            socket = ss.sockets[socketId].socket;
                            if (socket.readyState != 2 && socket.readyState != 3) { // Only when not already closed or closing
                                socket.close();
                            }
                        }
                    }
                    sceneMap[params.sceneId] = null;
                }
            });

    function log(socketId, message) {
        if (debugCfg.trace) {
            SceneJS._loggingModule.info("Socket " + socketId + ": " + message);
        }
    }

    /** Open a fresh WebSocket, attach callbacks and make it the active one
     */
    this.openSocket = function(params, onOpen, onClose, onError) {
        if (!("WebSocket" in window)) {
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.SocketNotSupportedException("SceneJS.Socket cannot be used - WebSockets not supported by this browser"));
        }
        var socketId = SceneJS._createKeyForMap(activeSceneSockets.sockets, "socket");
        var webSocket;
        try {
            webSocket = new WebSocket(params.uri);  // W3C WebSocket
        } catch (e) {
            onError(new SceneJS.errors.SocketErrorException("SceneJS.Socket error (URI: '" + params.uri + "') : " + e.message || e));
            return;
        }
        var socket = {
            id : socketId,
            uri: params.uri,
            socket: webSocket,
            messages : {
                inQueue : []
            }
        };
        activeSceneSockets.sockets[socketId] = socket;
        webSocket.onopen = function() {
            onOpen(socketId);
            log(socketId, "opened");
        };
        webSocket.onmessage = function (evt) {
            log(socketId, "received message: '" + evt.data + "");
            socket.messages.inQueue.unshift(evt.data);  // Message ready to be collected by node

        };
        webSocket.onerror = function(e) {
            activeSceneSockets.sockets[socketId] = null;
            var msg = "SceneJS.Socket error (URI: '" + socket.uri + "') : " + e;
            onError(new SceneJS.errors.SocketErrorException(msg));
            log(socketId, msg);
        };
        webSocket.onclose = function() {
            activeSceneSockets.sockets[socketId] = null;
            onClose();
            log(socketId, "closed");
        };

        //testCreateMessages(activeSceneSockets.sockets[socketId]);
    };

    /** Attempt to activate a currently-open open WebSocket
     */
    this.acquireSocket = function(socketId) {
        if (activeSocket) {
            socketStack.push(activeSocket);
        }
        if (activeSceneSockets.sockets[socketId]) {
            activeSocket = activeSceneSockets.sockets[socketId];
            return true;
        } else {
            log(socketId, "has been freed");  /// Socket node must re-open
            return false;
        }
    };

    /** Flushes given message queue out the active socket. Messages are sent as they are popped off the tail.
     */
    this.sendMessages = function(messages, onError, onSuccess) {
        var message;
        var messageStr;
        try {
            while (messages.length > 0 && activeSocket.socket.readyState == 1) {
                message = messages[messages.length - 1]; // Dont deqeue yet for debug in case of error
                messageStr = JSON.stringify(message);
                if (debugCfg.trace) {
                    log(activeSocket.id, "sending message: '" + messageStr + "");
                }
                activeSocket.socket.send(messageStr);
                messages.pop();                       // Sent OK, can pop now
            }
        } catch(e) {
            onError(new SceneJS.errors.SocketErrorException
                    ("SceneJS.Socket error sending message (to server at URI: '" + activeSocket.uri + "') : " + e));
            return;
        }
        onSuccess();
    };

    /**
     * Fetches next message from the end of the incoming queue.
     *
     * Incoming messages look like this:
     *
     * { error: 404, body: "Not found!" }
     *
     * { body: < body object/string> }
     *
     * The onError will return an exception object, while the onSuccess handler will return the message body JSON object.
     */
    this.getNextMessage = function(onError, onSuccess) {
        var inQueue = activeSocket.messages.inQueue;
        var messageStr = inQueue[inQueue.length - 1]; // Dont deqeue yet for debug in case of error
        if (messageStr) {
            try {
                if (debugCfg.trace) {
                    log(activeSocket.id, "processing message: '" + messageStr + "");
                }
                var messageObj = eval('(' + messageStr + ')');
                if (messageObj.error) {

                    /* Server reports an error
                     */
                    onError(new SceneJS.errors.SocketServerErrorException(
                            "SceneJS.Socket server error - server reports error (server URI: '"
                                    + activeSocket.uri + "'): " + messageObj.error + ", " + messageObj.body));

                } else if (!messageObj.body) {

                    /* Badly-formed response - body missing
                     */
                    onError(new SceneJS.errors.SocketErrorException("SceneJS.Socket error - bad message from server (server URI: '"
                            + activeSocket.uri + "'): body is missing in message:" + messageStr));
                } else {
                    inQueue.pop();                        // Evaled OK, can pop now
                    onSuccess(messageObj.body);
                }
            } catch (e) {
                onError(new SceneJS.errors.SocketErrorException
                        ("SceneJS.Socket error reading message (from server at URI: '" + activeSocket.uri + "') : " + e));
            }
        }
    };


    /** Deactivates the current socket, reactivates the previously activated one (belonging to a higher Socket node if any)
     */
    this.releaseSocket = function() {
        if (socketStack.length > 0) {
            activeSocket = socketStack.pop();
        } else {
            activeSocket = null;
        }
    };

})();

/**
 * @class Binds its subgraph to a WebSocket, providing a server with the ability to add, remove and manipulate content within the subgraph
 *
 * <p>The SceneJS.Socket node enables a server to dynamically participate in the construction, destruction and
 * configuration of its subgraph. It binds the subgraph to a WebSocket through which it exchanges JSON message objects
 * with a server.</p>
 *
 * <h2>Message Format</h2>
 * <p>Incoming messages from a server are either error responses, like that shown below, or configuration maps
 * exactly like those specified with a {@link SceneJS.WithConfigs}. On receipt of a configuration map, a Socket
 * automatically applies the map to its subgraph in the same way that a {@link SceneJS.WithConfigs} does.</p>
 * <p>An error response object has two parts: the error code, either a string or number, and a message.</p>
 *
 * <p>Below is an example of an HTTP 404 error server response:</p>
 * <pre><code>
 * {
 *     error : 404,
 *     body  : "Could not find asset 'foobar'
 * }
 * </code></pre>
 *
 * <p>Below is an example of a server response containing subnode configurations:</p>
 * <pre><code>
 * {
 *     body : {
 *          configs: {
 *              // ...
 *          }
 *     }
 * }
 * </code></pre>
 *
 * <p>The outgoing message format is not part of the SceneJS specification and is whatever JSON objects the server on
 * the other end expects.</p>
 *
 * <h2>Message Queues</h2>
 * <p>Messages can be configured on the Socket to send when the connection first opens, or enqueued at any
 * time with {@link #addMessage} to send when the socket is next rendered while a connection is open.</p>
 *
 * <p>Incoming messages are also queued - each time the Socket is rendered while a connection is open, it dequeues and
 * processes the next incoming message before sending all queued outgoing messages.</p>
 *
 * <p>You can have multiple Sockets scattered throughout a scene graph, and may even nest them. This enables you to do some
 * fancy things, like have "live assets" that are controlled by the servers that they are downloaded from. Imagine a
 * subgraph defining an airplane, that relies on its server to manage its complex physics computations, for example.</p>
 *
 *  <p><b>Example Usage</b></p><p>Below is a Socket that connects to a server on the local host. The Socket starts off
 * in {@link #STATE_INITIAL}. Then as soon as it is rendered, it transitions to {@link #STATE_CONNECTING} and tries to
 * open the connection. When successful, it sends the optional specified messages and transitions to {@link #STATE_OPENED}.
 * The server may respond with an error (described further below) or a configuration map. If the response is a
 * configuration map, the Socket would then apply that to its sub-nodes.
 * On error, the Socket will transition to {@link #STATE_ERROR} and remain in that state, with connection closed. If
 * the connection ever closes, the Socket will attempt to re-open it when next rendered.</p>
 * <pre><code>
 * new SceneJS.Socket({
 *
 *       // Location of server
 *
 *       uri: "ws://127.0.0.1:8888/",
 *
 *       // Messages to send as soon as the socket is first opened
 *
 *       messages: [
 *          {
 *               myParam  : "foo",
 *               myParam2 : "bar"
 *          },
 *
 *          // Next message ...
 *
 *      ],
 *
 *      listeners: {
 *         "state-changed" : {
 *              fn: function(params) {
 *                  switch (params.newState) {
 *                      case SceneJS.Socket.STATE_CONNECTING:
 *
 *                          // Socket attempting to open connection with server at specified URI
 *
 *                          alert("STATE_CONNECTING");
 *                          break;
 *
 *                      case SceneJS.Socket.STATE_OPEN:
 *
 *                          // Server connection opened, messages sent
 *
 *                          alert("STATE_OPEN");
 *                          break;
 *
 *                      case SceneJS.Socket.STATE_CLOSED:
 *
 *                          // Connection closed OK
 *
 *                          alert("STATE_CLOSED");
 *                          break;
 *
 *                      case SceneJS.Socket.STATE_ERROR:
 *
 *                          // Error opening connection, or server error response
 *
 *                          alert("STATE_ERROR: " + params.exception.message);
 *                          break;
 *                   }
 *               }
 *           }
 *       },
 *
 *       // Child nodes that will receive configs returned by socket's server peer
 *)
 *
 * </code></pre>

 */
SceneJS.Socket = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "socket";
    this._uri = null;
    this._autoOpen = true;
    this._socketId = null;
    this._outMessages = [];
    this._state = SceneJS.Socket.STATE_INITIAL;
    this._configsModes = {
        strictProperties : true,
        strictNodes : false
    };
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.Socket, SceneJS.Node);

/** Initial state of Socket when not rendered yet.
 */
SceneJS.Socket.STATE_INITIAL = 0;

/** State of Socket when it has attempted to open a connection with a server and awaiting response. Socket tries to open
 * the connection as soon as it is rendered and enters this state.
 */
SceneJS.Socket.STATE_CONNECTING = 2;

/** State of Socket when connection is open with server.
 */
SceneJS.Socket.STATE_OPEN = 3;

/**
 * State of Socket in which connection is closed. From here it will attempt to r-open when next rendered.
 */
SceneJS.Socket.STATE_CLOSED = 4;

/** State of Socket in which an error occured, either due to failure to open connection, or as signalled by the server.
 */
SceneJS.Socket.STATE_ERROR = -1;

/** Enqeues an outgoing message to send when the Socket is next rendered while a connection is open.
 *
 * @param message
 * @returns {this}
 */
SceneJS.Socket.prototype.addMessage = function(message) {
    this._outMessages.unshift(message);
    return this;
};

/** Clears outgoing message queue - messages are not sent.
 * @returns {this}
 */
SceneJS.Socket.prototype.removeMessages = function() {
    this._outMessages = [];
    return this;
};

// @private
SceneJS.Socket.prototype._init = function(params) {
    this._uri = params.uri;
    if (params.messages) {
        this._outMessages = params.messages.reverse();
    }
};

// @private
SceneJS.Socket.prototype._render = function(traversalContext, data) {
    if (!this._fixedParams) {
        this._init(this._getParams(data));
    }
    if (!this._uri) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException("SceneJS.Socket uri property not defined"));
    }

    /* Socket can close after lack of use, in which case
     * the node would have to re-open it
     */
    if (this._state == SceneJS.Socket.STATE_OPEN) {
        if (!SceneJS._SocketModule.acquireSocket(this._socketId)) {
            this._changeState(SceneJS.Socket.STATE_CLOSED);
        }
    }

    if (this._state == SceneJS.Socket.STATE_OPEN) { // Still open, and socket was acquired above

        /* Process next incoming message then send pending outgoing messages
         */
        var _self = this;
        SceneJS._SocketModule.getNextMessage(

            /* Error
             */
                function(exception) { // onerror
                    _self._changeState(SceneJS.Socket.STATE_ERROR, { exception: exception });
                    SceneJS._errorModule.error(exception);
                },

            /* OK
             */
                function(messageBody) {

                    if (messageBody.configs) {

                        /* Configuration message
                         */
                        traversalContext = {
                            appendix : traversalContext.appendix,
                            insideRightFringe: _self._children.length > 1,
                            configs : _self._preprocessConfigs(messageBody.configs),
                            configsModes : _self._configsModes // TODO configsModes in message?
                        };
                        data = new SceneJS.Data(data, _self._fixedParams, this._data);

                    } else {

                        /* TODO: handle other message types
                         */
                        SceneJS._errorModule.error(
                                new SceneJS.errors.SocketServerErrorException(
                                        "SceneJS.Socket server responded with unrecognised message: " + JSON.stringify(messageBody)));
                    }
                });
        this._sendMessages();
        this._renderNodes(traversalContext, data);
        SceneJS._SocketModule.releaseSocket();
    } else {
        if (this._state == SceneJS.Socket.STATE_INITIAL || this._state == SceneJS.Socket.STATE_CLOSED) {

            this._changeState(SceneJS.Socket.STATE_CONNECTING);
            (function(_self) { // Closure allows this node to receive results
                SceneJS._SocketModule.openSocket({ uri: _self._uri },
                        function(socketId) { // onopen
                            _self._socketId = socketId;
                            _self._changeState(SceneJS.Socket.STATE_OPEN);
                        },
                        function() { // onclose
                            _self._changeState(SceneJS.Socket.STATE_CLOSED);
                        },
                        function(exception) { // onerror
                            _self._changeState(SceneJS.Socket.STATE_ERROR, { exception: exception });
                            SceneJS._errorModule.error(exception);
                        });
            })(this);
        }
        if (this._state == this._STATE_ERROR) { // Socket disabled - TODO: retry?
        }
        this._renderNodes(traversalContext, data); // We're assuming socket wont open instantly, ie. during this node visit
    }
};

// TODO: factor out and share with SceneJS.WithConfigs - mutual feature envy smell ;)

SceneJS.Socket.prototype._preprocessConfigs = function(configs) {
    var configAction;
    var funcName;
    var newConfigs = {};
    for (var key in configs) {
        if (configs.hasOwnProperty(key)) {
            key = key.replace(/^\s*/, "").replace(/\s*$/, "");    // trim
            if (key.length > 0) {
                configAction = key.substr(0, 1);
                if (configAction != "#") {  // Property reference
                    if (configAction == "+") {
                        funcName = "add" + key.substr(1, 1).toUpperCase() + key.substr(2);
                    } else if (configAction == "-") {
                        funcName = "remove" + key.substr(1, 1).toUpperCase() + key.substr(2);
                    } else {
                        funcName = "set" + key.substr(0, 1).toUpperCase() + key.substr(1);
                    }
                    newConfigs[funcName] = {
                        isFunc : true,
                        value : configs[key]
                    };

                } else {
                    newConfigs[key.substr(1)] = this._preprocessConfigs(configs[key]);
                }
            }
        }
    }
    return newConfigs;
};

// @private
SceneJS.Socket.prototype._changeState = function(newState, params) {
    params = params || {};
    params.oldState = this._state;
    params.newState = newState;
    this._state = newState;
    if (this._listeners["state-changed"]) {
        this._fireEvent("state-changed", params);
    }
};

SceneJS.Socket.prototype._onMessage = function(message) {
    if (this._listeners["msg-received"]) {
        this._fireEvent("msg-received", message);
    }
};

// @private
SceneJS.Socket.prototype._sendMessages = function() {
    if (this._outMessages.length > 0) {
        var _self = this;
        SceneJS._SocketModule.sendMessages(
                this._outMessages,
                function(exception) { // onerror
                    _self._changeState(SceneJS.Socket.STATE_ERROR, { exception: exception });
                },
                function() {  // onsuccess
                    this._outMessages = [];
                });

    }
};

/** Factory function that returns a new {@link SceneJS.Socket} instance
 * @param {Object} [cfg] Static configuration object

 * @returns {SceneJS.Socket}
 * @since Version 0.7.6
 */
SceneJS.socket = function() {
    var n = new SceneJS.Socket();
    SceneJS.Socket.prototype.constructor.apply(n, arguments);
    return n;
};
/* Backend that manages picking
 *
 *
 *
 *  @private
 */
SceneJS._pickModule = new (function() {
    var scenePickBufs = {};            // Pick buffer for each existing scene
    var boundPickBuf = null;           // Pick buffer for currently active scene while picking
    var color = { r: 0, g: 0, b: 0 };
    var sidStack = [];
    var nodeArray = new Array(1000);
    var pickX = null;
    var pickY = null;
    var debugCfg = null;
    var rootObserver = null;
    var leafObserver = null;
    var nodeIndex = 0;
    var pickedNodeIndex = 0;

    /**
     * On init, put SceneJS in rendering mode.
     * Pick buffers are destroyed when their scenes are destroyed.
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.INIT,
            function() {
                SceneJS._traversalMode = SceneJS._TRAVERSAL_MODE_RENDER;
                debugCfg = SceneJS._debugModule.getConfigs("picking"); // TODO: debug mode only changes on reset
                scenePickBufs = {};
                boundPickBuf = null;
            });

    /** Make sure we are back in render mode on error/reset
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.RESET,
            function() {
                SceneJS._traversalMode = SceneJS._TRAVERSAL_MODE_RENDER;
            });

    /** Called by SceneJS.Scene to pick at x,y and enter picking mode.
     */
    this.pick = function(x, y) {
        if (debugCfg.logTrace) {
            SceneJS._loggingModule.info("Picking at (" + x + ", " + y + ")");
        }
        SceneJS._traversalMode = SceneJS._TRAVERSAL_MODE_PICKING;
        pickX = x;
        pickY = y;
        color = { r: 0, g: 0, b: 0 };
        nodeIndex = 0;
        sidStack = [];
        rootObserver = null;
        leafObserver = null;
    };

    /**
     * When a scene begins rendering, then if in pick mode, bind pick buffer for scene,
     * creating buffer first if not existing
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERING,
            function(e) {
                if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
                    if (!scenePickBufs[e.sceneId]) {
                        scenePickBufs[e.sceneId] = createPickBuffer(e.canvas);
                    }
                    bindPickBuffer(scenePickBufs[e.sceneId]);
                }
            });

    function createPickBuffer(canvas) {
        var gl = canvas.context;
        var width = canvas.canvas.width;
        var height = canvas.canvas.height;

        var pickBuf = {
            canvas : canvas,
            frameBuf : gl.createFramebuffer(),
            renderBuf : gl.createRenderbuffer(),
            texture : gl.createTexture()
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuf.frameBuf);

        gl.bindTexture(gl.TEXTURE_2D, pickBuf.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        try {
            // Do it the way the spec requires
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
        } catch (exception) {
            // Workaround for what appears to be a Minefield bug.
            var textureStorage = new WebGLUnsignedByteArray(width * height * 3);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, textureStorage);
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, pickBuf.renderBuf);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickBuf.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pickBuf.renderBuf);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        /* Verify framebuffer is OK
         */
        gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuf.frameBuf);
        if (!gl.isFramebuffer(pickBuf.frameBuf)) {
            throw("Invalid framebuffer");
        }
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            case gl.FRAMEBUFFER_UNSUPPORTED:
                throw("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
            default:
                throw("Incomplete framebuffer: " + status);
        }
        return pickBuf;
    }

    function bindPickBuffer(pickBuf) {
        if (debugCfg.logTrace) {
            SceneJS._loggingModule.info("Binding pick buffer");
        }
        var context = pickBuf.canvas.context;
        context.bindFramebuffer(context.FRAMEBUFFER, pickBuf.frameBuf);
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        context.disable(context.BLEND);
        boundPickBuf = pickBuf;
    }

    /** Push SID to path, map next unique colour to path and node
     */
    this.preVisitNode = function(node) {
        if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) { // Quietly igore if not picking

            /* Save node with SID
             */
            var sid = node.getSID();
            if (sid) {
                sidStack.push(sid);

                color.g = parseFloat(Math.round((nodeIndex + 1) / 256) / 256);
                color.r = parseFloat((nodeIndex - color.g * 256 + 1) / 256);
                color.b = 1.0;

                if (nodeArray.length <= nodeIndex) {
                    nodeArray.push({});
                }
                nodeArray[nodeIndex] = {
                    node: node,
                    sidStack : sidStack.slice(0),
                    leafObserver : leafObserver
                };
                if (debugCfg.logTrace) {
                    SceneJS._loggingModule.info(
                            "Mapping pick index to color/node: " + nodeIndex + " => {r:" + color.r + ", g:" + color.g + ", b:" + color.b + "} " + sidStack.join("/"));
                }
                nodeIndex+=1;
            }

            /* Track pick event observer
             */
            if (node.hasListener("picked")) {
                leafObserver = {             // TODO: reuse same observer records from pool array
                    node: node,
                    sidDepth: sidStack.length, // Depth of observer node in SID namespace
                    parent : leafObserver
                };
                if (!rootObserver) {
                    rootObserver = leafObserver;
                }
                if (debugCfg.logTrace) {
                    SceneJS._loggingModule.info(
                            "Registering node as \"picked\" event listener: SID path = {" + sidStack.join("/") + "}");
                }
            }
        }
    };

    /** Export the current pick color when requested by shader module
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SHADER_RENDERING,
            function() {
                if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
                    SceneJS._eventModule.fireEvent(
                            SceneJS._eventModule.PICK_COLOR_EXPORTED, { pickColor: [color.r,color.g,color.b]});
                }
            });

    /** Pop SID off path
     */
    this.postVisitNode = function(node) {
        if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) { // Quietly igore if not picking
            sidStack.pop();
            if (node.hasListener("picked")) {
                leafObserver = leafObserver.parent;
                if (!leafObserver) {
                    rootObserver = null;
                }
            }
        }
    };

    /** When scene finished rendering, then if in pick mode, read and unbind pick buffer
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERED,
            function() {
                if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
                    readPickBuffer();
                    unbindPickBuffer();
                }
            });


    function readPickBuffer() {
        var context = boundPickBuf.canvas.context;
        var pix = context.readPixels(pickX, boundPickBuf.canvas.canvas.height - pickY, 1, 1, context.RGBA, context.UNSIGNED_BYTE);
        if (!pix) {  //  http://asalga.wordpress.com/2010/07/14/compensating-for-webgl-readpixels-spec-changes/
            pix = new WebGLUnsignedByteArray(4);            
            context.readPixels(pickX, boundPickBuf.canvas.canvas.height - pickY, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pix);
        }
        if (debugCfg.logTrace) {
            SceneJS._loggingModule.info("Reading pick buffer - picked pixel(" + pickX + ", " + pickY + ") = {r:" + pix[0] + ", g:" + pix[1] + ", b:" + pix[2] + "}");
        }
        pickedNodeIndex = (pix[0] + pix[1] * 256) - 1;
    }

    function unbindPickBuffer() {
        if (debugCfg.logTrace) {
            SceneJS._loggingModule.info("Unbinding pick buffer");
        }
        boundPickBuf.canvas.context.bindFramebuffer(boundPickBuf.canvas.context.FRAMEBUFFER, null);
        boundPickBuf = null;
    }

    /**
     * When a scene finished rendering in pick mode, find picked node and fire "picked" event at
     * each node on path back to root that is listening for "picked" events.
     */
    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_RENDERED,
            function() {
                if (SceneJS._traversalMode == SceneJS._TRAVERSAL_MODE_PICKING) {
                    if (debugCfg.logTrace) {
                        SceneJS._loggingModule.info("Finished rendering..");
                    }
                    var picked = nodeArray[pickedNodeIndex];
                    if (picked) {
                        for (var observer = picked.leafObserver; observer != null; observer = observer.parent) {

                            /* Path to picked node, relative to the observer node
                             */
                            var relSIDPath = picked.sidStack.slice(observer.sidDepth).join("/");
                            if (debugCfg.logTrace) {
                                SceneJS._loggingModule.info("Node was picked - SID path:" + relSIDPath);
                            }
                            var pickedEvent = { uri : relSIDPath };
                            if (debugCfg.logTrace) {
                                SceneJS._loggingModule.info("Notifying \"picked\" event observer");
                            }
                            observer.node.addEvent("picked", pickedEvent);
                        }
                    } else {
                        if (debugCfg.logTrace) {
                            SceneJS._loggingModule.info("No nodes picked");
                        }
                    }
                    SceneJS._traversalMode = SceneJS._TRAVERSAL_MODE_RENDER;
                }
            });

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.SCENE_DESTROYED,
            function(e) {
                if (debugCfg.logTrace) {
                    SceneJS._loggingModule.info("Destroying pick buffer");
                }
            });
})();
