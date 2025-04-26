import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok'});
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});