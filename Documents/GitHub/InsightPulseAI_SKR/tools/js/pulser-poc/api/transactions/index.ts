import { AzureFunction, Context, HttpRequest } from '@azure/functions';

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log('Processing transaction trends request');

  // Generate demo data for the last 30 days
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate realistic transaction patterns
    const dayOfWeek = date.getDay();
    const baseCount = 100 + (dayOfWeek === 0 || dayOfWeek === 6 ? -20 : 20); // Lower on weekends
    const variation = Math.floor(Math.random() * 40) - 20;
    const count = baseCount + variation;

    const baseAmount = count * 45; // Average transaction value
    const amountVariation = Math.floor(Math.random() * count * 10);
    const amount = baseAmount + amountVariation;

    data.push({
      date: date.toISOString().split('T')[0],
      count: count,
      amount: amount,
    });
  }

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    },
    body: data,
  };
};

export default httpTrigger;
