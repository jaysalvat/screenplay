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
                .play(2)
                .done(function () {
                    expect(test).to.be.equal('ABCABC');
                });
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
                .play()
                .done(function () {
                    expect(test).to.be.equal('ABCABCABC');
                });
        });
    });


    describe("Next() With Promise", function () {
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
});
