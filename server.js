import express from 'express';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Needed to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check for Render
app.get('/health', (req, res) => {
    res.send('Server is healthy!');
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

// Serve the summary text
app.get('/summary', (req, res) => {
    const summaryPath = path.join(__dirname, 'watchtime_summary.txt');
    res.sendFile(summaryPath);
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
