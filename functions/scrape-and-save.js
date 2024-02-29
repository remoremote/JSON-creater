// netlify/functions/scrape-and-save.js

const { handler: scrapeData } = require('../../index'); // Adjust the path as necessary to ensure correct importing

exports.handler = async function(event, context) {
  try {
    await scrapeData(); // Call your main scraping function
    return {
      statusCode: 200,
      body: 'Scraping and Saving process completed successfully.',
    };
  } catch (error) {
    console.error('Failed to complete scraping and saving:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error: could not complete the request',
    };
  }
};
