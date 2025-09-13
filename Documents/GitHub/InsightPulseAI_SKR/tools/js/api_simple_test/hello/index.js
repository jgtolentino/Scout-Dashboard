module.exports = async function (context, req) {
    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello from Azure Functions!', timestamp: new Date().toISOString() })
    };
};