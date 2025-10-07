import request from 'supertest';

const base = process.env.BASE_URL || 'https://thankful-sea-06d26c00f.6.azurestaticapps.net';

const routes = [
  '/api/transactions/trends',
  '/api/transactions/heatmap',
  '/api/product-mix',
  '/api/analytics/behavior',
  '/api/analytics/profiling',
  '/api/stores/nearby',
  '/api/premium-insights'
];

describe('🐾  API smoke-suite (live)', () => {
  jest.setTimeout(20_000);

  routes.forEach(route => {
    it(`${route} → 200`, async () => {
      const res = await request(base).get(route);
      expect(res.status).toBe(200);
      expect(res.body).toBeTruthy();
    });
  });
});