import express from 'express';
import { processWatchHistory } from './CalculateYTWatchtime.js';

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/run-watchtime', async (req, res) => {
  try {
    const summary = await processWatchHistory();
    res.json(summary);
  } catch (error) {
    console.error('Error processing watch history:', error);
    res.status(500).send('Error processing watch history');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});