// 1. Import the tools we installed
const express = require('express');
const { Pool } = require('pg');

// 2. Turn on the Express website builder
const app = express();
app.use(express.json()); 
app.use(express.static('public'));// Allows the system to read data (like book details)

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
// 8. Stock the Shelves (Add Sample Data)
app.get('/seed-data', async (req, res) => {
  const seedSQL = `
    INSERT INTO Category (CategoryID, CategoryName) VALUES ('C1', 'IT'), ('C2', 'Design') ON CONFLICT DO NOTHING;
    INSERT INTO Publisher (PublisherID, PublisherName) VALUES ('P1', 'TechPress') ON CONFLICT DO NOTHING;
    
    INSERT INTO Book (BookID, Title, Author, Price, StockQty, CategoryID, PublisherID) VALUES 
    ('B1', 'Database System', 'John Doe', 18.00, 10, 'C1', 'P1'),
    ('B2', 'Web Design Basics', 'Jane Smith', 12.00, 5, 'C2', 'P1')
    ON CONFLICT DO NOTHING;
  `;

  try {
    await pool.query(seedSQL);
    res.send('SUCCESS: Sample books added to the store!');
  } catch (err) {
    console.error(err);
    res.status(500).send('ERROR adding data: ' + err.message);
  }
});

// 9. The Search Engine (Get all books)
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Book');
    res.json(result.rows); // This sends the data back in a format the website can read
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});
// 6. Tell the server to listen for traffic
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 7. Setup Database Tables (One-Time Setup)
app.get('/setup-tables', async (req, res) => {
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS Category (
        CategoryID VARCHAR(20) PRIMARY KEY,
        CategoryName VARCHAR(100) NOT NULL,
        Description TEXT
    );

    CREATE TABLE IF NOT EXISTS Publisher (
        PublisherID VARCHAR(20) PRIMARY KEY,
        PublisherName VARCHAR(100) NOT NULL,
        Phone VARCHAR(20),
        Address TEXT
    );

    CREATE TABLE IF NOT EXISTS Customer (
        CustomerID VARCHAR(20) PRIMARY KEY,
        FirstName VARCHAR(50) NOT NULL,
        LastName VARCHAR(50) NOT NULL,
        Phone VARCHAR(20) NOT NULL,
        Email VARCHAR(100),
        Address VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS Payment (
        PaymentID VARCHAR(20) PRIMARY KEY,
        PaymentDate TIMESTAMP NOT NULL,
        PaymentMethod VARCHAR(50) NOT NULL,
        Amount DECIMAL(10, 2) NOT NULL,
        Status VARCHAR(20) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Book (
        BookID VARCHAR(20) PRIMARY KEY,
        Title VARCHAR(100) NOT NULL,
        Author VARCHAR(100) NOT NULL,
        ISBN VARCHAR(20),
        Price DECIMAL(10, 2) NOT NULL,
        StockQty INT NOT NULL,
        CategoryID VARCHAR(20) REFERENCES Category(CategoryID),
        PublisherID VARCHAR(20) REFERENCES Publisher(PublisherID)
    );

    CREATE TABLE IF NOT EXISTS "Order" (
        OrderID VARCHAR(20) PRIMARY KEY,
        CustomerID VARCHAR(20) REFERENCES Customer(CustomerID),
        OrderDate TIMESTAMP NOT NULL,
        TotalAmount DECIMAL(10, 2) NOT NULL,
        PaymentID VARCHAR(20) REFERENCES Payment(PaymentID)
    );

    CREATE TABLE IF NOT EXISTS OrderDetail (
        OrderDetailID VARCHAR(20) PRIMARY KEY,
        OrderID VARCHAR(20) REFERENCES "Order"(OrderID),
        BookID VARCHAR(20) REFERENCES Book(BookID),
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(10, 2) NOT NULL,
        SubTotal DECIMAL(10, 2) NOT NULL
    );
  `;

  try {
    await pool.query(createTablesSQL);
    res.send('SUCCESS: All 7 Database tables created successfully according to your Data Dictionary!');
  } catch (err) {
    console.error(err);
    res.status(500).send('ERROR creating tables: ' + err.message);
  }
});