// Retrieve Azure SQL credentials from Azure Key Vault
require('dotenv').config({path: '.env.local'});
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

async function getKeyVaultCredentials() {
  console.log('🔐 Retrieving Azure SQL credentials from Key Vault...');
  console.log('===============================================');
  
  try {
    // Key Vault configuration
    const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL || 'https://tbwa-keyvault.vault.azure.net/';
    console.log(`🏛️  Key Vault URL: ${keyVaultUrl}`);
    
    // Create credential and client
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(keyVaultUrl, credential);
    
    console.log('🔍 Retrieving secrets...');
    
    // Retrieve SQL credentials from Key Vault
    const secrets = {
      server: await client.getSecret('azure-sql-server'),
      database: await client.getSecret('azure-sql-database'), 
      user: await client.getSecret('azure-sql-user'),
      password: await client.getSecret('azure-sql-password')
    };
    
    console.log('✅ Successfully retrieved all secrets');
    
    const credentials = {
      server: secrets.server.value,
      database: secrets.database.value,
      user: secrets.user.value,
      password: secrets.password.value
    };
    
    console.log('📊 Retrieved credentials:');
    console.log(`   Server: ${credentials.server}`);
    console.log(`   Database: ${credentials.database}`);
    console.log(`   User: ${credentials.user}`);
    console.log(`   Password: ${'*'.repeat(credentials.password.length)}`);
    
    return credentials;
    
  } catch (error) {
    console.error('❌ Error retrieving Key Vault credentials:', error.message);
    
    if (error.message.includes('AADSTS')) {
      console.log('');
      console.log('💡 Authentication issue. Please ensure:');
      console.log('   1. You are logged in to Azure CLI: az login');
      console.log('   2. Your account has access to the Key Vault');
      console.log('   3. The Key Vault URL is correct');
    }
    
    throw error;
  }
}

// Export for use in other scripts
module.exports = { getKeyVaultCredentials };

// Run standalone if called directly
if (require.main === module) {
  getKeyVaultCredentials()
    .then(credentials => {
      console.log('');
      console.log('🎉 Credentials retrieved successfully!');
      console.log('Ready to use for Azure SQL connection');
    })
    .catch(error => {
      console.error('Failed to retrieve credentials:', error);
      process.exit(1);
    });
}