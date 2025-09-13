import { NextApiRequest, NextApiResponse } from 'next';
import askCesClient from '@/lib/askCesClient'; // your new CES SDK wrapper

export default async function handler(req, res) {
  const { context } = req.body;
  // Call Ask CES AI to generate tutorial steps for this context
  const steps = await askCesClient.generateTutorial({ context });
  res.status(200).json({ steps });
} 