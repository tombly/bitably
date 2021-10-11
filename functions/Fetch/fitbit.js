
const config = require('./config.js');
const querystring = require('querystring');
const utils = require('./utils');

module.exports = {

    // Retrieves sleep data from the Fitbit API for the given user and date using
    // the given access token.
    async getSleepDataForDate(date, token) {

        let options = {
            hostname: 'api.fitbit.com',
            port: 443,
            path: `/1.2/user/-/sleep/date/${date}.json`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        let sleepRecords = JSON.parse(await utils.callHttp(options)).sleep;

        // Grab the data from the "sleep" property, which we expect to
        // be an array with exactly one element.
        if (sleepRecords.length == 0) {
            return {};
        }
        else {
            return sleepRecords[0];
        }
    },

    getToken(code) {
        console.log(`getToken(${code})`);

        const postData = querystring.stringify({
            code: code,
            grant_type: "authorization_code",
            client_id: config.clientId,
            redirect_uri: config.redirectUri
        });

        const options = {
            hostname: 'api.fitbit.com',
            port: 443,
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + config.secret,
                'Content-Length': postData.length
            }
        }

        return utils.callHttp(options, postData);
    },

    getRefreshToken(refreshToken) {
        console.log(`refreshToken(${refreshToken})`);

        const postData = querystring.stringify({
            grant_type: "refresh_token",
            refresh_token: refreshToken
        });

        const options = {
            hostname: 'api.fitbit.com',
            port: 443,
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + config.secret,
                'Content-Length': postData.length
            }
        }

        return utils.callHttp(options, postData);
    },

    getProfile(token, userId) {
        console.log(`getProfile(${token},${userId})`);

        const options = {
            hostname: 'api.fitbit.com',
            port: 443,
            path: `/1/user/${userId}/profile.json`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        return utils.callHttp(options);
    },

    getSleepForDate(token, userId, date) {
        console.log(`getSleepForDate(${token},${userId},${date}})`);

        const options = {
            hostname: 'api.fitbit.com',
            port: 443,
            path: `/1.2/user/${userId}/sleep/date/${date}.json`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        return utils.callHttp(options);
    }

}
