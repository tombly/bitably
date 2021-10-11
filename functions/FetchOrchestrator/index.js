
const df = require("durable-functions");

// This function is triggered by an HTTP starter function.
module.exports = df.orchestrator(function* (context) {
    const outputs = [];
    outputs.push(yield context.df.callActivity("Fetch"));
    return outputs;
});
