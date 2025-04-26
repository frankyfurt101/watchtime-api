import express from 'express';
import fs from 'fs/promises'; // Use promises version
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// To safely get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Watchtime API 🚀</title>
      <style>
        body {
          background: #0f0f0f;
          color: #f5f5f5;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        h1 {
          font-size: 3rem;
          color: #61dafb;
        }
        p {
          font-size: 1.2rem;
          color: #aaa;
        }
        a {
          margin-top: 20px;
          display: inline-block;
          color: #61dafb;
          text-decoration: none;
          border: 1px solid #61dafb;
          padding: 8px 16px;
          border-radius: 4px;
        }
        a:hover {
          background: #61dafb;
          color: #0f0f0f;
        }
      </style>
    </head>
    <body>
      <div>
        <h1>🚀 Watchtime API is Live!</h1>
        <p>Welcome to your live server. Everything is operational.</p>
        <a href="/run-watchtime">Test Watchtime Endpoint</a>
      </div>
    </body>
    </html>
  `);
});

// Run watchtime calculation
app.get('/run-watchtime', async (req, res) => {
  try {
    const watchHistoryPath = path.join(__dirname, 'src', 'data', 'watch-history.json');

    const data = await fs.readFile(watchHistoryPath, 'utf-8');
    const watchHistory = JSON.parse(data);

    const totalVideos = watchHistory.length;

    const creators = {};
    for (const entry of watchHistory) {
      const creator = entry.subtitles?.[0]?.name || 'Unknown';
      creators[creator] = (creators[creator] || 0) + 1;
    }

    const topCreator = Object.entries(creators).sort((a, b) => b[1] - a[1])[0];

    // 🧠 Generate OpenAI Summary
    const prompt = `
    Based on the following YouTube Watchtime Data:
    - Top Creator: ${topCreator ? topCreator[0] : 'None'}
    - Total Videos Watched: ${totalVideos}

    Write a fun, energetic 2-3 sentence summary describing the user's YouTube habits!
    `;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiSummary = response.data.choices[0].message.content.trim();

    res.json({
      totalVideos,
      topCreatorName: topCreator ? topCreator[0] : 'None',
      topCreatorCount: topCreator ? topCreator[1] : 0,
      aiGeneratedSummary: aiSummary
    });

  } catch (error) {
    console.error('Error processing watch history or generating AI summary:', error);
    res.status(500).json({ error: 'Failed to process watch history or generate AI summary' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});