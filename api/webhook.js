export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello from LINE WORKS Bot!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
