'use strict';

class Screenplay {
    constructor (settings = {}) {
        let {
            async = true
        } = settings;

        this.async = async;
        this.steps = [];
        this.index = 0;
        this.loops = 1;
        this.indexes = [];
        this.markers = {};
        this.playing = false;
        this.animationEnd = getEventName('animation');
        this.transitionEnd = getEventName('transition');
        this.timer = null;
        this.events = {
            'step': [],
            'play': [],
            'stop': [],
            'loop': [],
            'pause': [],
            'before': [],
            'after': []
        };
        this.finale = () => {};
    }

    play(loops = this.loops) {
        this.loops = loops;
        this.playing = true;
        this.run();

        return this.trigger('play');
    }

    pause() {
        this.playing = false;
        this.run();

        return this.trigger('pause');
    }

    toggle() {
        return this.playing ? this.pause() : this.play();
    }

    stop() {
        this.loops = 1;
        this.playing = false;
        this.finale.call(this);

        return this.trigger('stop');
    }

    step(fn, repeat = 1) {
        for (let i = 0; i < repeat; i++) {
            this.steps.push(fn);
            this.indexes.push(this.steps.length - 1);
        }

        return this;
    }

    wait(time) {
        this.steps.push(function (next) {
            clearTimeout(this.timer);

            this.timer = setTimeout(function () {
                next();
            }, time);
        });

        return this;
    }

    repeat(repeat) {
        let last = this.steps[this.steps.length - 1];

        return this.step(last, repeat);
    }

    end(fn) {
        this.finale = fn;

        return this;
    }

    rewind() {
        this.index = 0;
        this.playing = true;
        this.run();

        return this;
    }

    marker(marker) {
        this.markers[marker.toString()] = this.steps.length;

        return this;
    }

    goto(marker) {
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
    }

    on(key, fn) {
        this.events[key].push(fn);

        return this;
    }

    off(key, fn) {
        if (fn) {
            this.events[key] = this.events[key].filter((f) => f !== fn);
        } else {
            this.events[key] = [];
        }

        return this;
    }

    trigger(key) {
        this.events[key].forEach((fn) => fn.call(this));

        return this;
    }

    loop(loops = -1) {
        this.loops = loops;

        return this;
    }

    previous(nb = 1) {
        let index = this._reverseIndex(this.index - nb, true);

        if (index) {
            this.index = index;
            this.run();
        }

        return this;
    }

    next(nb = 1) {
        let index = this._reverseIndex(this.index + nb);

        if (index) {
            this.index = index;
            this.run();
        }

        return this;
    }

    same() {
        this.index -= 1;
        this.run();

        return this;
    }

    run() {
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

        const go = () => {
            let step = this.steps[this.index],
                steps = step;

            if (typeof step === 'function') {
                this.concurrentSteps = 1;

                step.call(this, this._next.bind(this));
            }

            if (Array.isArray(steps)) {
                this.concurrentSteps = steps.length;

                steps.forEach((step) => {
                    step.call(this, this._next.bind(this));
                });
            }
        };

        this.trigger('before');

        if (this.async) {
            setTimeout(go);
        } else {
            go();
        }

        return this;
    }

    _next(elements) {
        let elementCount = 0;

        let done = () => {
            if (--this.concurrentSteps === 0) {
                this.index++;
                this.run();
                this.trigger('after');
            }
        };

        if (elements) {
            elements = Array.isArray(elements) ? elements : [ elements ];

            elements.forEach((element) => {
                let self = this;

                function callback () {
                    element.removeEventListener(self.animationEnd,  callback, false);
                    element.removeEventListener(self.transitionEnd, callback, false);
                    element.removeEventListener("ended", callback, false);

                    if (++elementCount === elements.length) {
                        done();
                    }
                }

                if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
                    element.addEventListener(this.animationEnd,  callback, false);
                    element.addEventListener(this.transitionEnd, callback, false);

                    if (element.tagName === 'AUDIO' || element.tagName === 'VIDEO') {
                        element.addEventListener("ended", callback, false);
                    }
                }

                if (typeof element.then === 'function') {
                    element.then(done, done);
                }
            });
        } else {
            done();
        }

        return this;
    }

    _reverseIndex(index, previous) {
        let buffer;

        for (let i = 0; i < this.indexes.length; i++) {
            if ((previous && this.indexes[i] >= index) || (!previous && this.indexes[i] > index)) {
                return buffer;
            }
            buffer = this.indexes[i];
        }

        return 0;
    }
}

function getEventName (key) {
    const map = {
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
        let div = document.createElement('div');

        for (let eventName in map[key]) {
            if (typeof(div.style[eventName]) !== 'undefined') {
                return map[key][eventName];
            }
        }
    } catch (e) {
        return null;
    }
}

export default Screenplay;
