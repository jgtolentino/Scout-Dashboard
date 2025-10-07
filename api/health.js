export default async function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    version: '5.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    region: process.env.VERCEL_REGION || 'sin1',
    services: {
      database: 'connected',
      medallion: 'active',
      api: 'operational'
    },
    deployment: {
      platform: 'vercel',
      runtime: 'nodejs20.x',
      architecture: 'serverless'
    }
  });
}