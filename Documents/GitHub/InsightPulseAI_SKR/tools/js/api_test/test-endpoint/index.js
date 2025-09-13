module.exports = async function (context, req) {
    context.log('Test endpoint triggered');
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'API is working',
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url
        })
    };
};