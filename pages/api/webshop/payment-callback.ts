import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(404);
  }
  const { status, id } = req.body;

  console.log('Payment status', status, id);

  return res.status(200).json({ status, id });
}
