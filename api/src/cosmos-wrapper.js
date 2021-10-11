const config = require('./config.js');
const { CosmosClient } = require("@azure/cosmos");

const databaseName = 'Biometric';
const containerName = 'Sleep';

exports.CosmosWrapper = CosmosWrapper;

function CosmosWrapper() {}

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

CosmosWrapper.prototype.getCosmosContainer = async function() {
    const cosmosClient = this.getCosmosClient();
    const { database } = await cosmosClient.databases.createIfNotExists({ id: databaseName });
    const { container } = await database.containers.createIfNotExists({ id: containerName });
    return container;
}

CosmosWrapper.prototype.getCosmosClient = function() {
    const endpoint = config.cosmos.endpoint;
    const key = config.cosmos.key;
    return new CosmosClient({ endpoint, key });
}