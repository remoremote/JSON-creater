const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    // Only process GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const logFilePath = path.join(__dirname, '..', 'cronjob.log');  // Assuming cronjob.log is at the root of your project
    try {
        const data = fs.readFileSync(logFilePath, 'utf8');
        return { statusCode: 200, body: data };
    } catch (err) {
        console.error('Error reading log file:', err);
        return { statusCode: 500, body: 'Error reading log file' };
    }
};
