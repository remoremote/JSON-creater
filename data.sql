const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTable() {
  const query = `
    CREATE TABLE details (
      id SERIAL PRIMARY KEY,
      address JSONB, 
      metaTitle VARCHAR(255), 
      descriptionHTML TEXT, 
      descriptionMarkdown TEXT,
      systemOfficeId VARCHAR(255),
      spaceType VARCHAR(255),
      Nutzung VARCHAR(255),
      dateRent VARCHAR(255),
      stockwerk INT,
      price INT,
      totalArea INT,
      images TEXT[]
      -- Add more columns as needed
    );
  `;

  try {
    const res = await pool.query(query);
    console.log('Table created successfully');
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await pool.end(); // Close the database connection
  }
}

createTable();