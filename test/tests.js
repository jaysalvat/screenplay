/* global describe, it */

'use strict';

if (typeof window === 'undefined') {
    var screenplay = require('../dist/screenplay.js');
    var chai = require('chai');
}
var expect = chai.expect;

describe("Some tests", function () {
    it("should work", function () {
        expect(screenplay).to.be.a('function');
        expect(screenplay).to.not.throw(Error);
    });
});
