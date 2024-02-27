const cron = require('node-cron');
const { spawn } = require('child_process');
const fs = require('fs');

// Define the cron job schedule to run at 3am CET every day
const cronJob = '*/2 * * * *'; // Adjust according to your requirements

// Command to run your Node.js script
const command = 'node';
const scriptPath = './index.js'; // Update this with the correct path to your script

// Define the cron job task
const task = cron.schedule(cronJob, () => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] Running script...\n`;

    // Log the starting of the script
    fs.appendFile('cronjob.log', logMessage, (err) => {
        if (err) {
            console.error(`[${timestamp}] Error appending start log: ${err}`);
        } else {
            console.log(`[${timestamp}] Log appended to cronjob.log: Running script`);
        }
    });

    const child = spawn(command, [scriptPath]);

    child.stdout.on('data', (data) => {
        console.log(`[${timestamp}] stdout: ${data}`);
        // Log stdout data
        fs.appendFile('cronjob.log', `[${timestamp}] stdout: ${data}`, (err) => {
            if (err) {
                console.error(`[${timestamp}] Error appending stdout log: ${err}`);
            }
        });
    });

    child.stderr.on('data', (data) => {
        console.error(`[${timestamp}] stderr: ${data}`);
        // Log stderr data
        fs.appendFile('cronjob.log', `[${timestamp}] ERROR: ${data}`, (err) => {
            if (err) {
                console.error(`[${timestamp}] Error appending stderr log: ${err}`);
            }
        });
    });

    child.on('close', (code) => {
        console.log(`[${timestamp}] Script process exited with code ${code}`);
        // Log script process exit code
        const exitLog = `[${timestamp}] Script process exited with code ${code}\n`;
        fs.appendFile('cronjob.log', exitLog, (err) => {
            if (err) {
                console.error(`[${timestamp}] Error appending exit log: ${err}`);
            } else {
                console.log(`[${timestamp}] Log appended to cronjob.log: Script process exited`);
            }
        });
    });
});

// Start the cron job
task.start();
