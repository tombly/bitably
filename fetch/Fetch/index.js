
const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const { DateTime } = require("luxon");

const { getProfile } = require('./fitbit');
const configuration = require('./config.js');
const fitbit = require('./fitbit');

module.exports = async function (context) {

    context.log(`Fetch function started ${new Date().toISOString()}`);
    await main(context);
    context.log("Fetch function stopping.");

    return '{}';
};

// This function caches biometric data retrieved from the Fitbit API and stores
// it locally. The tricky thing with the Fitbit API is that we don't have a way
// to know when the data for a particular day has changed - as the user syncs
// their devices throughout the day, new data is uploaded to the Fitbit and the
// API returns the latest data retrieved for a day. If we simply cache each day
// only once, then we may miss data that was uploaded from user devices (for
// that day) after we cached it. In general, there is no way to know when all
// data has been uploaded for a given day (e.g. maybe a scale has been offline
// for a month and then the user fixes the WiFi connection and the scale then
// uploads weight data for the last 30 days).
//
// Since we can't efficiently determine if or when the data for a particular
// day has changed, here we take the approach of refreshing all of the user's
// biometric data on each execution (the caller of this function thus controls
// how fresh the data in the cache is via the frequency of execution).
//
// The Fitbit API has a quota of 150 API requests per hour, so we just have to
// make sure that we can retrieve all the user's data within that number of
// requests (so that we don't have to worry about throttling our calls and
// spacing them out over several hours).
//
// For sleep data, we can retrieve up to 100 days of data in each call, so we
// could retrieve 100 days * 150 requests = 15,000 days = 41 years of data.
// Even if we want to retrieve other data (steps, weight, etc.) that's still
// a sufficient number of requests if we assume most users have only been using
// Fitbit for a few years.
//
// Based on the above, the following code:
//  1. step through each user
//  2. retrieve the user's profile
//  3. extract the date when they joined Fitbit
//  4. starting at that date, request sleep data in 100-day batches
//  5. store each day individually into our cache
//  6. repeat until we reach today's date
//
// TODO: how should we signal that all the data for a user is ready?

async function main(context) {

    // Read our configuration from our App Configuration resource.
    config = await configuration.readConfig();

    // Get the list of registered users. The user objects include both a user
    // ID and an access token for making Fitbit API calls.
    const users = await getUsersFromStorage();
    context.log(`Found ${users.length} user(s).`);

    // Step through each user.
    for (const user of users) {
        context.log(`Fetching for user: ${user.userId}`);

        // Get the date the user joined Fitbit from their profile, e.g.
        // '2018-10-10'.
        const memberSince = JSON.parse(await getProfile(user.token, user.userId)).user.memberSince;
        context.log(`Member since: ${memberSince}`);

        // Step forward in time in groups of 100 days.
        let startDate = DateTime.fromISO(memberSince);
        let stopDate = startDate.plus({ days: 100 });
        while (true) {
            try {
                context.log(`Fetching: ${startDate.toISODate()} = ${stopDate.toISODate()}`);
                const response = await fitbit.getSleepDataForDateRange(user.token, startDate.toISODate(), stopDate.toISODate());
                response.forEach(async (day, i) => {
                    await saveToBlobStorage(day, user.userId);
                });
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
                context.log(`Failed to retrieve: ${err}`);
            }

            if (stopDate > DateTime.now()) {
                break;
            }

            startDate = stopDate.plus({ days: 1 });
            stopDate = startDate.plus({ days: 100 });

            break; // for testing
        }
    }
}

async function saveToBlobStorage(data, userId) {

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

async function getUsersFromStorage() {

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
