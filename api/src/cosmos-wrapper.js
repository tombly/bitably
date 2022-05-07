
const { CosmosClient } = require("@azure/cosmos");

const databaseName = 'Biometric';
const containerName = 'Sleep';
let config;

exports.CosmosWrapper = CosmosWrapper;

function CosmosWrapper(c) {
    config = c;
}

CosmosWrapper.prototype.sleepDayCount = async function(userId) {
    console.log(`sleepDayCount(${userId})`);
    const container = await this.getCosmosContainer();
    const { resources } = await container.items
        .query({
            query: "SELECT VALUE COUNT(1) from s WHERE s.userId = @userId",
            parameters: [{ name: "@userId", value: userId }]
        })
        .fetchAll();
    const count = resources[0];
    return count;
}

CosmosWrapper.prototype.getSleep = async function (userId) {
    console.log(`getSleep(${userId})`);
    const container = await this.getCosmosContainer();
    const { resources } = await container.items
        .query({
            query: "SELECT * from s WHERE s.userId = @userId",
            parameters: [{ name: "@userId", value: userId }]
        })
        .fetchAll();
    return resources;
}

CosmosWrapper.prototype.getCosmosContainer = async function () {
    const cosmosClient = this.getCosmosClient();
    const { database } = await cosmosClient.databases.createIfNotExists({ id: databaseName });
    const { container } = await database.containers.createIfNotExists({ id: containerName });
    return container;
}

// TODO: The CosmosClient is thread-safe and is designed to be a single instance
// so that it can efficiently handle connections - refactor this code so that
// there is a single instance for our app.
CosmosWrapper.prototype.getCosmosClient = function () {
    const endpoint = config.cosmos.endpoint;
    const key = config.cosmos.key;
    return new CosmosClient({ endpoint, key });
}