const { exportStaticMetrics } = require('../export_static_metrics');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();
    context.log('Static Metrics Export Timer triggered at:', timeStamp);
    
    try {
        // Run the metrics export
        context.log('Starting metrics export...');
        await exportStaticMetrics();
        context.log('Metrics export completed successfully');
        
        // Upload the exported files to Azure Blob Storage
        await uploadFilesToBlobStorage(context);
        
        // Set outputBlob with metadata
        context.bindings.outputBlob = JSON.stringify({
            timestamp: timeStamp,
            status: 'success',
            files_exported: ['kpis.json', 'top_stores.json', 'regional_performance.json', 
                             'brands.json', 'brand_distribution.json', 'insights.json', 
                             'data_freshness.json', 'metadata.json'],
            message: 'Export completed successfully'
        }, null, 2);
        
        context.log('Export process completed and files uploaded to blob storage');
    } catch (error) {
        context.log.error('Error in export process:', error);
        
        // Set outputBlob with error metadata
        context.bindings.outputBlob = JSON.stringify({
            timestamp: timeStamp,
            status: 'error',
            error: error.message,
            stack: error.stack
        }, null, 2);
        
        throw error;
    }
};

/**
 * Upload exported JSON files to Azure Blob Storage
 */
async function uploadFilesToBlobStorage(context) {
    const fs = require('fs');
    const path = require('path');
    
    // Output directory for JSON files
    const OUTPUT_DIR = process.env.EXPORT_OUTPUT_DIR || './deploy/data';
    
    // Azure Storage connection string
    const connectionString = process.env.AzureWebJobsStorage;
    
    // Container name for dashboard data
    const containerName = 'dashboarddata';
    
    // Create a timestamp folder for this export
    const timestamp = new Date();
    const dateFolderName = timestamp.toISOString().split('T')[0];
    const timeFolderName = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
    const blobPrefix = `${dateFolderName}/${timeFolderName}`;
    
    // Create blob service client
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Make sure container exists
    await containerClient.createIfNotExists();
    
    // Read all JSON files from the output directory
    const files = fs.readdirSync(OUTPUT_DIR).filter(file => file.endsWith('.json'));
    
    // Upload each file
    for (const file of files) {
        const filePath = path.join(OUTPUT_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Upload to timestamped folder
        const blobName = `${blobPrefix}/${file}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.upload(fileContent, fileContent.length);
        context.log(`Uploaded ${file} to ${blobName}`);
        
        // Also upload to latest folder (overwrite)
        const latestBlobName = `latest/${file}`;
        const latestBlockBlobClient = containerClient.getBlockBlobClient(latestBlobName);
        
        await latestBlockBlobClient.upload(fileContent, fileContent.length);
        context.log(`Uploaded ${file} to ${latestBlobName}`);
    }
}