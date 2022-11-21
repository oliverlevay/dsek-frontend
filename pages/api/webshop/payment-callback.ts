import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(404);
  }
  console.log('Recieved callback from swish!');
  console.log('req.body', req.body);
  console.log('req', req);
  console.log('req.headers', req.headers);

  return res.status(200).json({
    res: JSON.stringify(res),
    req: JSON.stringify(req),
  });
}
