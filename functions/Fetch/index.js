
// See here for documentation:
// https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/tables/data-tables/samples/v12/javascript

const configuration = require('./config.js');
const fitbit = require('./fitbit');
const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

const databaseName = "Biometric";
const containerName = "Sleep";

module.exports = async function (context) {

    context.log(`Fetch function started ${new Date().toISOString()}`);

    // Read our configuration from our App Configuration resource.
    config = await configuration.readConfig();

    // Create and configure our Cosmos container if necessary.
    await initCosmosContainer();

    // Get the list of registered users.
    const users = await GetUsersFromStorage();
    context.log(`Found ${users.length} user(s).`);

    // Step through each user and retrieve new data from the Fitbit API as
    // necessary.
    for (const user of users) {
        context.log(`Processing user: ${user.userId}`);

        // See what dates we already have in Cosmos for this user.
        const downloadedDates = await getDatesInCosmos(user.userId);
        context.log(`Dates in database: ${downloadedDates.length}`);

        // See what dates we need.
        let neededDates = getDatesSinceToday(10);

        // Retrieve as many of the dates we need as possible.
        for (const date of neededDates) {
            if (downloadedDates.includes(date) == false) {
                context.log(`Retrieving ${date}...`);
                try {
                    // Only save data that has a date (we'll get an empty object
                    // if we request a date from the Fitbit API for which there
                    // isn't any data).
                    const respObject = await fitbit.getSleepDataForDate(date, user.token);
                    if (respObject.dateOfSleep !== undefined) {
                        await SaveToBlobStorage(respObject, user.userId);
                        await SaveToCosmos(respObject, user.userId);
                    }
                }
                catch (err) {
                    if (err === 429) {
                        context.log("Too many requests, stopping.");
                        break;
                    }
                    if (err === 401) {
                        // We can't use an implicit flow token to get a refresh
                        // token so we can't do anything now. We could allow the
                        // user to auth a second time using the authorization
                        // code flow which would allow us to use refresh tokens.
                        context.log("Unauthorized");
                        break;
                    }
                    context.log(`Failed to retrieve ${date}: ${err}`);
                }
            }
        }
    }

    context.log("Done.");
    return '{}';
};

function getDatesSinceToday(numberOfDays) {
    let dates = [];
    let nextDate = new Date();
    for (let i = 0; i < numberOfDays; i++) {
        const dateStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`;
        nextDate.setDate(nextDate.getDate() - 1);
        dates.push(dateStr);
    }
    return dates;
}

// Get the list of dates that we have already downloaded for this user.
async function getDatesInCosmos(userId) {
    const container = await getCosmosContainer();
    let downloadedDays = [];
    const { resources } = await container.items
        .query({
            query: "SELECT * from s WHERE s.userId = @userId",
            parameters: [{ name: "@userId", value: userId }]
        })
        .fetchAll();

    for (const entry of resources) {
        downloadedDays.push(entry.dateOfSleep);
    }
    return downloadedDays;
}

function getCosmosClient() {
    const endpoint = config.cosmos.endpoint;
    const key = config.cosmos.key;
    return new CosmosClient({ endpoint, key });
}

async function getCosmosContainer() {
    const cosmosClient = getCosmosClient();
    const { database } = await cosmosClient.databases.createIfNotExists({ id: databaseName });
    const { container } = await database.containers.createIfNotExists({ id: containerName });
    return container;
}

async function initCosmosContainer() {

    // Connect to Cosmos DB.
    const cosmosClient = getCosmosClient();

    // Create the database if necessary.
    const { database } = await cosmosClient.databases.createIfNotExists({ id: databaseName });

    // Create the container if necessary. The call to readAll() costs some RUs so
    // we don't want to perform this check on every item op so we just call it
    // once on function startup.
    const iterator = database.containers.readAll();
    const { resources: containersList } = await iterator.fetchAll();

    // See if the container exists already or not.
    const exists = containersList.find(x => x.id === containerName) !== undefined;

    // For the Sleep container we need to use the id as the partition key.
    const { container } = await database.containers.createIfNotExists({
        id: containerName,
        partitionKey: "/id"
    });

    // If we just created it then we need to set the index policy.
    if (exists == false) {
        console.log(`Initializing container: ${containerName}`);

        // Restrict indices to the dateOfSleep and userId properties.
        const containerResponse = await database.container(containerName).read();
        containerResponse.resource.indexingPolicy.excludedPaths = [{ path: '/*' }];
        containerResponse.resource.indexingPolicy.includedPaths = [{ path: '/userId/?' }, { path: '/dateOfSleep/?' }];
        await database.container(containerName).replace(containerResponse.resource);
    }

    return container;
}

async function SaveToCosmos(data, userId) {

    console.log("Saving data to cosmos...");

    // We will only ever have one item for each user for each day, so we combine
    // the user ID with the date and use it as the id property (which must be
    // within each logical partition) and then we'll use the id property as the
    // partition key so that every item is in a separate logical partition. The
    // only downside is that we can't use triggers and stored procedures across
    // logical partitions, and we may end up with cross-partition (physical)
    // queries if, for example, we want to grab all the sleep data for a user
    // for a particular date range, and we have lots of data (GBs) that results
    // many physical partitions, and those dates for the same user are spread
    // across multiple physical partitions.
    //
    // We only index the dateOfSleep and userId so that we can query using them.

    // Build a composite key to use as the item ID.
    data.id = `${userId}.${data.dateOfSleep}`;

    // Add our user ID to the document.
    data.userId = userId;

    console.log(`Saving ${data.id}/${data.userId} to db`);

    const container = await getCosmosContainer();
    container.items.create(data);
}

async function SaveToBlobStorage(data, userId) {

    console.log("Saving data to blob storage...");

    // Create our BlobServiceClient.
    const account = config.storage.account;
    const accountKey = config.storage.key;

    const credential = new StorageSharedKeyCredential(account, accountKey);
    const client = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);

    const containerName = `sleep`;
    const containerClient = client.getContainerClient(containerName);

    // Create the container if it does not exist.
    await containerClient.createIfNotExists();

    // Upload the data to the container.
    const blob = JSON.stringify(data);
    const blobName = `${userId}.${data.dateOfSleep}`;
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.upload(blob, blob.length);
}

async function GetUsersFromStorage() {

    // Create our TableClient (which lets us perform both table and entity operations).
    const account = config.storage.account;
    const accountKey = config.storage.key;

    const credential = new AzureNamedKeyCredential(account, accountKey);
    const tableName = "datastore";
    const client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

    // Create the table if it does not exist.
    await client.createTable(tableName);

    // Get the list of registered user IDs.
    let userIds = [];
    let entities = client.listEntities();
    for await (const entity of entities) {
        //console.log(`got entity: ${entity.timestamp}, ${entity.rowKey}`);
        userIds.push({ userId: entity.rowKey, token: entity.token });
    }

    return userIds;
}
