
const nock = require('nock');
const utils = require("../src/utils.js");

describe("callHttp", function () {

    it("Returns a response for a GET", function (done) {

        // Arrange.
        nock('https://api.website.com')
            .get('/endpoint')
            .reply(200, "<response>");

        const options = {
            hostname: 'api.website.com',
            port: 443,
            path: `/endpoint`,
            method: 'GET'
        }

        // Act.
        utils.callHttp(options).then((data) => {

            // Assert.
            expect(data).toBe("<response>");
            done();
        });
    });

    it("Returns a response for a POST", function (done) {

        // Arrange.
        nock('https://api.website.com')
            .post('/endpoint')
            .reply(200, "<response>");

        const options = {
            hostname: 'api.website.com',
            port: 443,
            path: `/endpoint`,
            method: 'POST'
        }

        // Act.
        utils.callHttp(options, "<post data>").then((data) => {

            // Assert.
            expect(data).toBe("<response>");
            done();
        });
    });

    it("Returns an error when endpoint returns error", function (done) {

        // Arrange.
        nock('https://api.website.com')
            .get('/endpoint')
            .reply(400, "<response>");

        const options = {
            hostname: 'api.website.com',
            port: 443,
            path: `/endpoint`,
            method: 'GET'
        }

        // Act.
        utils.callHttp(options).catch((reason) => {

            // Assert.
            expect(reason).toBe(400);
            done();
        });
    });

});
