export default async function handler(req, res) {
  const value = process.env.HELLO || process.env.GREETING || 'not set';
  res.status(200).json({ message: 'hello', env: value });
}