// server.js

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fsExtra from 'fs-extra';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// Health Check - Root
app.get('/', (req, res) => {
  res.send('🎬 Welcome to the YouTube Watchtime API!');
});

// Quick Health Check - SwiftUI friendly
app.get('/run-watchtime', async (req, res) => {
  try {
    res.status(200).json({ message: '✅ API is alive!' });
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(500).json({ status: 'error', message: 'Health error', details: error.message });
  }
});

// Full Watchtime Processing
app.post('/run-watchtime', async (req, res) => {
  try {
    const filePath = './watch-history.json';
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    const totalVideos = jsonData.length;
    const topCreator = "Unknown"; // Future: Analyze most watched

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

    const aiSummary = openaiResponse.data.choices[0]?.message?.content || 'No summary generated.';

    const result = {
      status: 'success',
      totalVideos,
      topCreator,
      aiSummary,
      timestamp: new Date().toISOString()
    };

    const backupDir = path.join('./backups');
    await fsExtra.ensureDir(backupDir);
    const backupPath = path.join(backupDir, `backup-${uuidv4()}.json`);
    await fs.writeFile(backupPath, JSON.stringify(result, null, 2));
    await fs.writeFile('./latest-summary.json', JSON.stringify(result, null, 2));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error during /run-watchtime:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal server error', details: error.message });
  }
});

// Get Latest Summary
app.get('/summary', async (req, res) => {
  try {
    const latest = await fs.readFile('./latest-summary.json', 'utf-8');
    res.status(200).json(JSON.parse(latest));
  } catch (error) {
    res.status(404).json({ status: 'error', message: 'No summary available yet' });
  }
});

// Get Top Creator
app.get('/top-creator', (req, res) => {
  res.json({ topCreator: "Unknown (upgrade coming soon!)" });
});

// Start server
app.listen(port, () => {
  console.log(`🎬 Watchtime server is live on port ${port}`);
});