#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');

console.log('Clearing default custom prompt...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
});

// Clear custom prompt for default user
db.run(
  `UPDATE user_settings SET custom_prompt_instructions = '' WHERE user_id = 'default'`,
  [],
  (err) => {
    if (err) {
      console.error('Failed to clear custom prompt:', err);
    } else {
      console.log('✓ Custom prompt cleared successfully');
    }
    
    db.close();
  }
);