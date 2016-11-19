/*!-----------------------------------------------------------------------------
 * screenplay — A tiny library to timeline functions
 * v0.0.1-1 - built 2016-11-19
 * Licensed under the MIT License.
 * http://screenplay.jaysalvat.com/
 * ----------------------------------------------------------------------------
 * Copyright (C) 2016 Jay Salvat
 * http://jaysalvat.com/
 * --------------------------------------------------------------------------*/
/* global define */

(function (context, factory) {
    'use strict';

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        context.screenplay = factory();
    }
})(this, function () {
    'use strict';

    var screenplay = function screenplay() {
        console.log('It works');
    };

    return screenplay;
});
//# sourceMappingURL=maps/screenplay.js.map
