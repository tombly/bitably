
const df = require("durable-functions");

// This function is triggered by an HTTP starter function.
module.exports = df.orchestrator(function* (context) {
    const outputs = [];

    // TODO: Use the fan-out pattern to fetch biometric data in parallel
    // for different users.
    outputs.push(yield context.df.callActivity("Fetch"));
    return outputs;
});
