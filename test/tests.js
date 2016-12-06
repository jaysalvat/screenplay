/* global describe, it */

'use strict';

if (typeof window === 'undefined') {
    var Screenplay = require('../dist/screenplay.js');
    var chai = require('chai');
}
var expect = chai.expect;

/**
 * TODO:
 * - Better tests ;)
 */

describe("Screenplay tests", function () {
    it("should be a function", function () {
        expect(function () {
            new Screenplay();
        }).to.not.throw(Error);
    });

    describe("Play()", function () {
        it("should return 'ABC' with play()", function () {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    test += 'A';
                    next();
                })
                .step(function (next) {
                    test += 'B';
                    next();
                })
                .step(function (next) {
                    test += 'C';
                    next();
                })
                .play();

            expect(test).to.be.equal('ABC');
        });

        it("should return 'ABCABC' with play(2)", function () {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    test += 'A';
                    next();
                })
                .step(function (next) {
                    test += 'B';
                    next();
                })
                .step(function (next) {
                    test += 'C';
                    next();
                })
                .play(2);

            expect(test).to.be.equal('ABCABC');
        });

        it("should return '' with play(2) asynchronous", function (done) {
            let test = '';
            let screenplay = new Screenplay({
                async: true
            });

            screenplay
                .step(function (next) {
                    test += 'A';
                    next();
                })
                .step(function (next) {
                    test += 'B';
                    next();
                })
                .step(function (next) {
                    test += 'C';
                    next();
                })
                .done(function () {
                    expect(test).to.be.equal('ABCABC');
                    done();
                })
                .play(2);

            expect(test).to.be.equal('');
        });
    });

    describe("loop()", function () {
        it("should return 'ABCABCABC' with loop(3)", function () {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    test += 'A';
                    next();
                })
                .step(function (next) {
                    test += 'B';
                    next();
                })
                .step(function (next) {
                    test += 'C';
                    next();
                })
                .loop(3)
                .play();

                expect(test).to.be.equal('ABCABCABC');
        });
    });

    describe("Go to next function With Promise", function () {
        it("should return 'ABC'", function (done) {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    var promise = new Promise(function (resolve) {
                        setTimeout(function () {
                            test += 'A';
                            resolve();
                        }, 1);
                    });
                    next(promise);
                })
                .step(function (next) {
                    var promise = new Promise(function (resolve) {
                        setTimeout(function () {
                            test += 'B';
                            resolve();
                        }, 1);
                    });
                    next(promise);
                })
                .done(function () {
                    expect(test).to.be.equal('AB');
                    done();
                })
                .play();
        });

        it("should return 'AB'", function (done) {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    var promise1 = new Promise(function (resolve) {
                        setTimeout(function () {
                            test += 'A';
                            resolve();
                        }, 1);
                    });
                    var promise2 = new Promise(function (resolve) {
                        setTimeout(function () {
                            test += 'B';
                            resolve();
                        }, 1);
                    });
                    next([ promise1, promise2 ]);
                })
                .done(function () {
                    expect(test).to.be.equal('AB');
                    done();
                })
                .play();
        });
    });

    describe("Reverse()", function () {
        it("should return 'CBACBA' with play(2)", function () {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    test += 'A';
                    next();
                })
                .step(function (next) {
                    test += 'B';
                    next();
                })
                .step(function (next) {
                    test += 'C';
                    next();
                })
                .reverse()
                .play(2);

            expect(test).to.be.equal('CBACBA');
        });
    });

    describe("Init(), Next(), Previous(), Same(), Stop()", function () {
        it("should return 'CBACBA' with navigation methods", function (done) {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    test += 'A';
                    next();
                })
                .step(function (next) {
                    test += 'B';
                    next();
                })
                .step(function (next) {
                    test += 'C';
                    next();
                })
                .done(function () {
                    expect(test).to.be.equal('ABCBAA');
                    done();
                });

            screenplay.init();
            screenplay.next();
            screenplay.next();
            screenplay.previous();
            screenplay.previous();
            screenplay.same();
            screenplay.stop();

            expect(test).to.be.equal('ABCBAA');
        });
    });

    describe("on()", function () {
        it("should return 'IN-BE-AF-BE-AF-PL-BE-AF-ST' by events", function () {
            let test = '';
            let screenplay = new Screenplay();

            screenplay
                .step(function (next) {
                    next();
                }, 3)
                .on('init', function () {
                    test += 'IN-';
                })
                .on('play', function () {
                    test += 'PL-';
                })
                .on('before', function () {
                    test += 'BE-';
                })
                .on('after', function () {
                    test += 'AF-';
                })
                .on('stop', function () {
                    test += 'ST';
                });

            screenplay.init();
            screenplay.next();
            screenplay.play();
            screenplay.stop();

            expect(test).to.be.equal('IN-BE-AF-BE-AF-PL-BE-AF-ST');
        });
    });
});
