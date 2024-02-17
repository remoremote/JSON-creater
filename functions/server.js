const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.get('/cronjob-log', (req, res) => {
    const logFilePath = path.join(__dirname, 'cronjob.log');

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading log file:', err);
            res.status(500).send('Error reading log file');
        } else {
            const lines = data.trim().split('\n');
            const latestLogs = lines.slice(-10);
            const formattedLogs = latestLogs.join('\n');
            res.send(formattedLogs); // Send the log content as plain text
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at https://reapi.netlify.app/`);
});
