const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    context.log('Processing data API request');

    try {
        // Get table parameter from query string
        const table = req.query.table;
        if (!table) {
            context.res = {
                status: 400,
                body: { error: "Missing 'table' parameter" }
            };
            return;
        }

        // Build the ADLS Gen2 URL
        const url = `https://tbwadata.dfs.core.windows.net/gold/${table}`;
        
        // Create blob service client with managed identity
        const credential = new DefaultAzureCredential();
        const blobServiceClient = new BlobServiceClient(
            "https://tbwadata.dfs.core.windows.net",
            credential
        );

        // Get container client
        const containerClient = blobServiceClient.getContainerClient("gold");
        
        // Get blob client for the _latest.json file in the specified table path
        const blobClient = containerClient.getBlobClient(`${table}/_latest.json`);
        
        // Download blob content
        const downloadResponse = await blobClient.download();
        const downloaded = await streamToString(downloadResponse.readableStreamBody);
        
        // Parse and return the data
        const data = JSON.parse(downloaded);
        
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: data
        };
    } catch (error) {
        context.log.error(`Error processing request: ${error.message}`);
        context.res = {
            status: 500,
            body: { error: `Failed to fetch data: ${error.message}` }
        };
    }
};

// Helper function to convert stream to string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}