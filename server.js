// server.js

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fsExtra from 'fs-extra';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('🎬 Welcome to the YouTube Watchtime API!');
});

app.post('/run-watchtime', async (req, res) => {
  try {
    const filePath = './watch-history.json';
    const file = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(file);

    const totalVideos = jsonData.length;
    const topCreator = "Unknown"; // We will improve this later

    const prompt = `
    Based on the following YouTube Watchtime Data:
    - Top Creator: ${topCreator}
    - Total Videos Watched: ${totalVideos}

    Write a fun, energetic 2-3 sentence summary describing the user's YouTube habits!
    `;

    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const aiSummary = openaiResponse.data.choices[0].message.content;

    const result = {
      status: 'success',
      totalVideos,
      topCreator,
      aiSummary,
      timestamp: new Date().toISOString()
    };

    // Save backup
    const backupDir = path.join('./backups');
    await fsExtra.ensureDir(backupDir);
    const backupPath = path.join(backupDir, `backup-${uuidv4()}.json`);
    await fs.writeFile(backupPath, JSON.stringify(result, null, 2));

    // Also save latest summary
    await fs.writeFile('./latest-summary.json', JSON.stringify(result, null, 2));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing watch history or generating AI summary:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error', details: error.message });
  }
});

// Get latest summary
app.get('/summary', async (req, res) => {
  try {
    const data = await fs.readFile('./latest-summary.json', 'utf-8');
    const json = JSON.parse(data);
    res.status(200).json(json);
  } catch (error) {
    res.status(404).json({ status: 'error', message: 'No summary available yet' });
  }
});

// Get top creator (future upgrade)
app.get('/top-creator', (req, res) => {
  res.json({ topCreator: "Unknown (coming soon!)" });
});

app.listen(port, () => {
  console.log(`🎬 Watchtime server is live on port ${port}`);
});