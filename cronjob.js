const cron = require('node-cron');
const { spawn } = require('child_process');
const fs = require('fs');

// Define the cron job schedule to run at 3am CET every day
const cronJob = '*/10 * * * *'; // Adjust according to your requirements

// Command to run your Node.js script
const command = 'node';
const scriptPath = './index.js'; // Update this with the correct path to your script

// Define the cron job task
const task = cron.schedule(cronJob, () => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] Running script...\n`;

    // Log the starting of the script
    fs.appendFile('cronjob.log', logMessage, (err) => {
        if (err) throw err;
        console.log('Log appended to cronjob.log');
    });

    const child = spawn(command, [scriptPath]);

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        // Log stdout data
        fs.appendFile('cronjob.log', `[${timestamp}] ${data}`, (err) => {
            if (err) throw err;
        });
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        // Log stderr data
        fs.appendFile('cronjob.log', `[${timestamp}] ${data}`, (err) => {
            if (err) throw err;
        });
    });

    child.on('close', (code) => {
        console.log(`Script process exited with code ${code}`);
        // Log script process exit code
        fs.appendFile('cronjob.log', `[${timestamp}] Script process exited with code ${code}\n`, (err) => {
            if (err) throw err;
        });
    });
});

// Start the cron job
task.start();
