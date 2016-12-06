'use strict';

class Screenplay {
    constructor (settings = {}) {
        let {
            direction = 1,
            loops = 1,
            loopBackward = false,
        } = settings;

        this.steps = [];
        this.waits = [];
        this.index = 0;
        this.loops = loops;
        this.loopBackward = loopBackward;
        this.loopBuffer = loops;
        this.dir = direction;
        this.indexes = [];
        this.markers = {};
        this.playing = false;
        this.started = false;
        this.running = false;
        this.animationEnd = getEventName('animation');
        this.transitionEnd = getEventName('transition');
        this.timer = null;
        this.events = {
            'step': [],
            'play': [],
            'stop': [],
            'start': [],
            'loop': [],
            'pause': [],
            'before': [],
            'after': []
        };
        this.finale = () => {};
    }

    stop() {
        if (this.started) {
            this.started = false;
            this.running = false;
            this.playing = false;
            this.finale.call(this);
            this._trigger('stop');
        }

         return this;
    }

    play(loops = this.loops) {
        this.loops = loops;
        this.loopBuffer = loops;

        if (!this.started) {
            if (this.dir === -1) {
                this.index = this.steps.length - 1;
            }
        }

        if (!this.playing) {
            this.playing = true;
            this.started = true;
            this.running = false;

            this._run();

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

    previous(nb = 1) {
        if (this.started) {
            this.index = this.index - ((nb + 1) * this.dir);
            this._run();
        }

        return this;
    }

    next(nb = 1) {
        if (this.started) {
            this.index = this.index + ((nb - 1) * this.dir);
            this._run();
        }

        return this;
    }

    same() {
        this.index = this.index - (1 * this.dir);
        this._run();

        return this;
    }

    rewind() {
        this.index = (this.dir === -1) ? this.steps.length - 1 : 0;

        return this._run();
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

    index(index) {
        if (index === undefined) {
            return this.index;
        }
        this.index = index;

        return this;
    }

    direction(direction) {
        if (direction === undefined) {
            return this.dir;
        }
        this.dir = direction;

        return this;
    }

    reverse() {
        return this.direction(this.dir * -1);
    }

    done(fn) {
        this.finale = fn;

        return this;
    }

    loop(loops = -1, loopBackward = this.loopBackward) {
        this.loops = loops;
        this.loopBackward = loopBackward;
        this.loopBuffer = loops;

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
            }
        }

        if (typeof marker === 'number') {
            if (this.steps[marker]) {
                this.index = this.steps[marker];
            }
        }

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
        if (!this.started) {
            return;
        }

        this.running = true;

        if (this.index < 0) {
            if (this.loops !== -1) {
                if (this.dir === -1 || (this.dir === 1 && this.loopBackward)) {
                    this.index = this.steps.length - 1;
                    this.loops = this.loops + this.dir;
                } else {
                    return this.stop();
                }
            }

            if (this.loops === 0 || this.loops > this.loopBuffer) {
                return this.stop();
            }
        }

        if (this.index >= this.steps.length) {
            if (this.loops !== -1) {
                if (this.dir === 1 || (this.dir === -1 && this.loopBackward)) {
                    this.index = 0;
                    this.loops = this.loops - this.dir;
                } else {
                    return this.stop();
                }
            }

            if (this.loops === 0 || this.loops > this.loopBuffer) {
                return this.stop();
            }
        }

        setTimeout(() => {
            let step = this.steps[this.index],
                steps = step;

            this._trigger('before');

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

            this.index = this.index + this.dir;
        });

        return this;
    }

    _next(elements) {
        let elementCount = 0;

        let done = () => {
            if (--this.concurrentSteps <= 0) {
                clearTimeout(this.timer);

                this.timer = setTimeout(() => {
                    if (!this.playing) {
                        return;
                    }
                    this._run();
                    this._trigger('after');
                }, this.waits[this.index]);
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
