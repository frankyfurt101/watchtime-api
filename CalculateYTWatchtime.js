import pkg from 'stream-json';
const { parser } = pkg;

import streamArrayPkg from 'stream-json/streamers/StreamArray.js';
const { StreamArray } = streamArrayPkg;

import { readFile } from 'fs/promises';
import path from 'path';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

// Serve JSON summary
app.get('/summary', async (req, res) => {
  try {
    const summaryPath = path.join(__dirname, 'src', 'data', 'watchtime_summary.json');
    const jsonData = await readFile(summaryPath, 'utf-8');
    const summary = JSON.parse(jsonData);
    res.json(summary);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ message: "📊 No watchtime summary available yet. Try running a calculation first." });
    } else {
      console.error('Error reading summary:', err);
      res.status(500).json({ message: "⚠️ Server error occurred." });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});