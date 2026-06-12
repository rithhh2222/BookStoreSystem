// 1. Import the tools we installed
const express = require('express');
const { Pool } = require('pg');

// 2. Turn on the Express website builder
const app = express();
app.use(express.json()); // Allows the system to read data (like book details)

// 3. Connect to your Render Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This is required for secure Render databases
  }
});

// 4. Create a test homepage so we know the server is alive
app.get('/', (req, res) => {
  res.send('Welcome to the Book Store Management System API!');
});

// 5. Create a test database connection route
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send('Database connected successfully at: ' + result.rows[0].now);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to connect to the database.');
  }
});

// 6. Tell the server to listen for traffic
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});