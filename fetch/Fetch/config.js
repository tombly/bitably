
const fs = require('fs');
const { parseKeyVaultSecretIdentifier, SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");
const { AppConfigurationClient, parseSecretReference, isSecretReference } = require("@azure/app-configuration");

async function readConfig() {

  // Read the config file that just has the app config connection string.
  let config = JSON.parse(fs.readFileSync('Fetch/config.json', 'utf8'));

  // Pull all the settings from the app config.
  appConfigConnectionString = config.appConfig.connectionString;
  const configClient = new AppConfigurationClient(appConfigConnectionString);
  const apiSettings = configClient.listConfigurationSettings({ keyFilter: "function*" });

  for await (const setting of apiSettings) {
    let value = setting.value;

    // Let's check to see if this entry is a key vault reference
    if (isSecretReference(setting)) {
      const parsedSecretReference = parseSecretReference(setting);

      // Get the name and vaultUrl from the secretId.
      const { name: secretName, vaultUrl } = parseKeyVaultSecretIdentifier(
        parsedSecretReference.value.secretId
      );

      const secretClient = new SecretClient(vaultUrl, new DefaultAzureCredential());
      value = (await secretClient.getSecret(secretName)).value;
    }

    // We expect keys to have 3 parts formatted like "App:Resource:Name".
    // Here we trim off the App part and turn the Resource and Name parts
    // into nested objects. For example, if there was a key named
    // "api:cosmos:endpoint" with the value "https://mycosmos.doc..." then
    // it would be added to the config object as:
    //
    // {
    //   "cosmos": {
    //     "endpoint": "https://mycosmos.doc" 
    //   }
    // }
    const [_, resource, name] = setting.key.split(":");
    if (config[resource] === undefined) {
      config[resource] = {};
    }
    config[resource][name] = value;
  }

  return config;
}

module.exports.readConfig = readConfig;
