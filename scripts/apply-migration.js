#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_custom_prompt_instructions.sql');

console.log('Applying migration: add_custom_prompt_instructions...');

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
});

// Apply migration
db.exec(migrationSQL, (err) => {
  if (err) {
    // Check if column already exists (error will occur if it does)
    if (err.message.includes('duplicate column name')) {
      console.log('Column custom_prompt_instructions already exists, skipping migration.');
    } else {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  } else {
    console.log('Migration applied successfully!');
  }
  
  // Verify the column exists
  db.all("PRAGMA table_info(user_settings)", (err, rows) => {
    if (err) {
      console.error('Failed to verify migration:', err);
    } else {
      const hasColumn = rows.some(row => row.name === 'custom_prompt_instructions');
      if (hasColumn) {
        console.log('✓ Column custom_prompt_instructions verified in user_settings table');
      } else {
        console.error('✗ Column custom_prompt_instructions not found in user_settings table');
      }
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
  });
});