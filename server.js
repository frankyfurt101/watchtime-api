const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const port = 3000;

// Allow your iPhone to connect
app.use(cors());

app.get('/run-watchtime', (req, res) => {
    console.log('Received request to run watchtime calculation...');
    exec('node /Users/frankyfernandez/Desktop/Youtube\\ Project/CalculateYTWatchtime.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error running script: ${error.message}`);
            res.status(500).send('❌ Failed to run watchtime calculation.');
            return;
        }
        console.log(`Output: ${stdout}`);
        res.send('✅ Watchtime calculation complete!');
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
