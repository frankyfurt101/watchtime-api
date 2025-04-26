import express from 'express';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// Needed to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pro Health Check for Render
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        message: 'Server is healthy!',
        timestamp: Date.now()
    });
});

// Endpoint to trigger watchtime calculation
app.get('/run-watchtime', (req, res) => {
    console.log('🟡 Received request to run watchtime calculation...');
    exec('node CalculateYTWatchtime.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            res.status(500).send(`❌ Watchtime calculation failed:\n${error.message}`);
            return;
        }
        if (stderr) {
            console.warn(`⚠️ Stderr: ${stderr}`);
        }
        console.log(`✅ Output: ${stdout}`);
        res.send('✅ Watchtime calculation complete!');
    });
});

// Serve the summary text with fallback
app.get('/summary', async (req, res) => {
    const summaryPath = path.join(__dirname, 'watchtime_summary.txt');
    try {
        res.sendFile(summaryPath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.send("📊 No watchtime summary available yet.\n\nTry running a calculation first.");
        } else {
            console.error("Server error reading summary:", err);
            res.status(500).send("⚠️ Server error occurred.");
        }
    }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
