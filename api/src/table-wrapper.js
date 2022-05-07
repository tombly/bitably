
const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

const tableName = 'datastore';
let config;

exports.TableWrapper = TableWrapper;

function TableWrapper(c) {
    config = c;
}

TableWrapper.prototype.register = async function(userId, accessToken) {
    console.log(`register(${userId},${accessToken.slice(0, 8)}...)`);
    const client = await this.getTableClient();
    await client.upsertEntity({
        partitionKey: 'user',
        rowKey: userId,
        token: accessToken
    });
}

TableWrapper.prototype.getTableClient = async function() {
    const account = config.storage.account;
    const accountKey = config.storage.key;

    // Create our TableClient (which lets us perform both table and entity operations).
    const credential = new AzureNamedKeyCredential(account, accountKey);
    const client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

    // Create the table if it does not exist.
    await client.createTable(tableName);

    return client;
}