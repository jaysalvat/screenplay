'use strict';

class Screenplay {
    constructor (settings = {}) {
        let {
            async = true
        } = settings;

        this.async = async;
        this.steps = [];
        this.waits = [];
        this.index = 0;
        this.loops = 1;
        this.indexes = [];
        this.markers = {};
        this.playing = false;
        this.started = false;
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

        if (!this.playing) {
            this.playing = true;

            if (this.started) {
                this.next();
            } else {
                this._run();
            }

            this._trigger('play');
        }

        return this;
    }

    pause() {
        if (this.playing) {
            this.playing = false;
            this._trigger('pause');
        }

        return this;
    }

    toggle() {
        return this.playing ? this.pause() : this.play();
    }

    stop() {
        this.loops = 1;
        this.playing = false;
        this.finale.call(this);

        return this._trigger('stop');
    }

    step(fn, repeat = 1) {
        for (let i = 0; i < repeat; i++) {
            this.steps.push(fn);
        }

        return this;
    }

    wait(time) {
        this.waits[this.steps.length - 1] = time;

        return this;
    }

    end(fn) {
        this.finale = fn;

        return this;
    }

    rewind() {
        this.index = 0;

        return this._run();
    }

    marker(marker) {
        this.markers[marker.toString()] = this.steps.length;

        return this;
    }

    goto(marker) {
        if (typeof marker === 'string') {
            if (this.markers[marker]) {
                this.index = this.markers[marker];
            }
        }

        if (typeof marker === 'number') {
            if (this.steps[marker]) {
                this.index = this.steps[marker];
            }
        }

        return this._run();
    }

    loop(loops = -1) {
        this.loops = loops;

        return this;
    }

    previous(nb = 1) {
        this.index = this.index - nb;

        return this._run();
    }

    next(nb = 1) {
        this.index = this.index + nb;

        return this._run();
    }

    same() {
        return this._run();
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

    _trigger(key) {
        this.events[key].forEach((fn) => fn.call(this));

        return this;
    }
    _run() {
        if (this.index < 0) {
            this.index = 0;
            return;
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
            if (!this.started) {
                this.started = true;
            }

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

        this._trigger('before');

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
            let goNext = () => {
                this.index++;
                this._run();
                this._trigger('after');
            };

            if (--this.concurrentSteps === 0) {
                if (this.playing) {
                    if (this.waits[this.index]) {
                        setTimeout(function () {
                            goNext();
                        }, this.waits[this.index]);
                    } else {
                        goNext();
                    }
                }
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
