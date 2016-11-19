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

    it("should return 'ABCABC", function () {
        let test = '';

        let screenplay = new Screenplay({
            async: false
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
            .play(2);

        expect(test).to.be.equal('ABCABC');
    });
});
