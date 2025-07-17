const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../tasks.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Add last_activity_at column to executions table
db.run(`ALTER TABLE executions ADD COLUMN last_activity_at DATETIME`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Column last_activity_at already exists');
    } else {
      console.error('Error adding column:', err);
      process.exit(1);
    }
  } else {
    console.log('Added last_activity_at column to executions table');
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
});