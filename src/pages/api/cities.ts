import type { NextApiRequest, NextApiResponse } from 'next';

const cities = [
  { id: 1, name: 'Helsinki' },
  { id: 2, name: 'Tampere' },
  { id: 3, name: 'Turku' },
  { id: 4, name: 'Oulu' },
  { id: 5, name: 'Jyväskylä' },
  { id: 6, name: 'Kuopio' },
  { id: 7, name: 'Lahti' },
  { id: 8, name: 'Pori' },
  { id: 9, name: 'Kouvola' },
  { id: 10, name: 'Rovaniemi' }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(cities);
}
