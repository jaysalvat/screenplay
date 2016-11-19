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

    const screenplay = () => {
        console.log('It works');
    };

    return screenplay;
});
