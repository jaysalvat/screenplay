/* global define */

(function (context, factory) {
    'use strict';

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        context.Screenplay = factory();
    }
})(this, function () {
    'use strict';

    var Screenplay = function (settings) {
        if (!(this instanceof Screenplay)) {
            return new Screenplay(settings);
        }

        this.steps   = [];
        this.indexes = [];
        this.markers = {};
        this.index   = 0;
        this.loops   = 1;
        this.playing = false;
        this.animationEnd  = getEndEventName('animation');
        this.transitionEnd = getEndEventName('transition');
        this.events = {
            'step':   [],
            'play':   [],
            'pause':  [],
            'stop':   [],
            'loop':   [],
            'before': [],
            'after':  []
        };
        this.timer  = null;
        this.finale = function () {};

        return this;
    };

    Screenplay.prototype = {
        play: function (loops) {
            this.loops = loops ? loops : this.loops;
            this.playing = true;
            this.run();

            return this.trigger('play');
        },

        pause: function () {
            this.playing = false;
            this.run();

            return this.trigger('pause');
        },

        toggle: function () {
            return this.playing ? this.pause() : this.play();
        },

        stop: function () {
            this.loops = 1;
            this.playing = false;
            this.finale.call(this);

            return this.trigger('stop');
        },

        step: function (fn, repeat) {
            repeat = repeat || 1;

            for (var i = 0; i < repeat; i++) {
                this.steps.push(fn);
                this.indexes.push(this.steps.length - 1);
            }

            return this;
        },

        wait: function (time) {
            this.steps.push(function (next) {
                clearTimeout(this.timer);

                this.timer = setTimeout(function () {
                    next();
                }, time);
            });

            return this;
        },

        repeat: function (repeat) {
            var last = this.steps[this.steps.length - 1];

            return this.step(last, repeat);
        },

        end: function (fn) {
            this.finale = fn;

            return this;
        },

        rewind: function () {
            this.index = 0;
            this.playing = true;
            this.run();

            return this;
        },

        marker: function (marker) {
            this.markers[marker.toString()] = this.steps.length;

            return this;
        },

        goto: function (marker) {
            if (typeof marker === 'string') {
                if (this.markers[marker]) {
                    this.index = this.markers[marker];
                    this.run();
                }
            }

            if (typeof marker === 'number') {
                if (this.indexes[marker]) {
                    this.index = this.indexes[marker];
                    this.run();
                }
            }

            return this;
        },

        on: function (key, fn) {
            this.events[key].push(fn);

            return this;
        },

        off: function (key, fn) {
            if (fn) {
                this.events[key] = this.events[key].filter(function (f) {
                    return f !== fn;
                });
            } else {
                this.events[key] = [];
            }

            return this;
        },

        trigger: function (key) {
            var self = this;

            this.events[key].forEach(function (fn) {
                fn.call(self);
            });

            return this;
        },

        loop: function (loops) {
            this.loops = loops !== undefined ? loops : -1;

            return this;
        },

        previous: function (nb) {
            var index = this._reverseIndex(this.index - (nb || 1), true);

            if (index) {
                this.index = index;
                this.run();
            }

            return this;
        },

        next: function (nb) {
            var index = this._reverseIndex(this.index + (nb || 1));

            if (index) {
                this.index = index;
                this.run();
            }

            return this;
        },

        same: function () {
            this.index -= 1;
            this.run();

            return this;
        },

        run: function () {
            var step;

            if (!this.playing) {
                return;
            }

            if (this.index < 0) {
                this.index = 0;
            }

            if (this.index >= this.steps.length) {
                this.index = 0;

                if (this.loops !== -1) {
                    this.loops--;
                }

                if (this.loops === 0) {
                    return this.stop();
                }
            }

            this.trigger('before');

            step = this.steps[this.index];

            if (typeof step === 'function') {
                this.concurrentSteps = 1;

                step.call(this, this._next.bind(this));
            }

            if (Array.isArray(step)) {
                var steps = step;

                this.concurrentSteps = steps.length;

                steps.forEach(function (step) {
                    step.call(this, this._next.bind(this));
                });
            }

            return this;
        },

        _next: function (doms) {
            var self = this, domCount = 0;

            var done = function () {
                self.concurrentSteps--;

                if (self.concurrentSteps === 0) {
                    console.log('next');
                    self.index++;
                    self.run();
                    self.trigger('after');
                }
            };

            if (doms) {
                doms = Array.isArray(doms) ? doms : [ doms ];

                doms.forEach(function (dom) {
                    var callback = function () {
                        dom.removeEventListener(self.animationEnd,  callback);
                        dom.removeEventListener(self.transitionEnd, callback);

                        if (domCount++ === doms.length - 1) {
                            done();
                        }
                    };

                    dom.addEventListener(self.transitionEnd, callback, false);
                    dom.addEventListener(self.animationEnd,  callback, false);
                });
            } else {
                done();
            }

            return this;
        },

        _reverseIndex: function (index, previous) {
            var buffer;

            for (var i = 0; i < this.indexes.length; i++) {
                if ((previous && this.indexes[i] >= index) || (!previous && this.indexes[i] > index)) {
                    return buffer;
                }

                buffer = this.indexes[i];
            }

            return 0;
        }
    };

    function getEndEventName (key) {
        var div, map = {
            animation: {
                'animation': 'animationend',
                '-o-animation': 'oAnimationEnd',
                '-moz-animation': 'animationend',
                '-webkit-animation': 'webkitAnimationEnd'
            },
            transition: {
                'transition': 'transitionend',
                '-o-transition': 'oTransitionEnd',
                '-moz-transition': 'transitionend',
                '-webkit-transition': 'webkitTransitionEnd'
            }
        };

        try {
            div = document.createElement('div');
        } catch (e) {
            return null;
        }

        for (var eventName in map[key]) {
            if (typeof(div.style[eventName]) !== 'undefined') {
                return map[key][eventName];
            }
        }

        return null;
    }

    return Screenplay;
});
