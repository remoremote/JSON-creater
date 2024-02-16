const cron = require('node-cron');
const { spawn } = require('child_process');

// Define the cron job schedule to run at 3am CET every day
const cronJob = '0 3 * * *';

// Command to run your Node.js script
const command = 'node';
const scriptPath = './index.js'; // Update this with the correct path to your script

// Define the cron job task
const task = cron.schedule(cronJob, () => {
    console.log('Running script...');
    const child = spawn(command, [scriptPath]);

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`Script process exited with code ${code}`);
    });
});

// Start the cron job
task.start();
