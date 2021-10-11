const config = require('./config.js');
const appInsights = require('applicationinsights');
const express = require('express');
const { CosmosWrapper } = require('./cosmos-wrapper');
const { TableWrapper } = require('./table-wrapper');

// Singleton or no?
const cosmosWrapper = new CosmosWrapper();
const tableWrapper = new TableWrapper();

// Analytics.
//appInsights.setup(config.appInsights.key).start();
//const client = appInsights.defaultClient;

const app = express();
const port = 80;
app.use(express.json());

// After the SPA gets the token from Fitbit and uses it to get the profile info
// (user ID and name), it sends them here to save it into storage.
app.get('/register', (req, res) => {
    //    client.trackNodeHttpRequest({ request: req, response: res });
    tableWrapper.register(req.query.userId, req.query.token).then((data) => {
        res.send("{}");
    });
});

app.get('/sleep/days/count', (req, res) => {
    //    client.trackNodeHttpRequest({ request: req, response: res });
    cosmosWrapper.sleepDayCount(req.query.userId).then(count => {
        res.send(`{"count":"${count}"}`);
        //client.trackEvent({ name: "SleepDayCount", properties: { count: count } });
    });
});

app.get('/ping', (req, res) => {
    //    client.trackNodeHttpRequest({ request: req, response: res });
    console.log('ping');
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});