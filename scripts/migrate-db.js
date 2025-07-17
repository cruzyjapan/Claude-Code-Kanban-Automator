#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const DATABASE_PATH = process.env.DATABASE_PATH || './database/tasks.db';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// Connect to database
const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log(`Connected to SQLite database: ${DATABASE_PATH}`);
});

// Create migrations table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating migrations table:', err);
    process.exit(1);
  }
  
  // Run migrations
  runMigrations();
});

function runMigrations() {
  // Get list of migration files
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    db.close();
    return;
  }

  // Get applied migrations
  db.all('SELECT filename FROM migrations', (err, rows) => {
    if (err) {
      console.error('Error getting applied migrations:', err);
      process.exit(1);
    }

    const appliedMigrations = new Set(rows.map(row => row.filename));
    const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.has(file));

    if (pendingMigrations.length === 0) {
      console.log('All migrations are up to date');
      db.close();
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    // Apply pending migrations
    applyMigrations(pendingMigrations, 0);
  });
}

function applyMigrations(migrations, index) {
  if (index >= migrations.length) {
    console.log('All migrations completed successfully');
    db.close();
    return;
  }

  const migrationFile = migrations[index];
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  
  console.log(`Applying migration: ${migrationFile}`);
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  db.exec(migrationSQL, (err) => {
    if (err) {
      console.error(`Error applying migration ${migrationFile}:`, err);
      db.close();
      process.exit(1);
    }
    
    // Record migration as applied
    db.run('INSERT INTO migrations (filename) VALUES (?)', [migrationFile], (err) => {
      if (err) {
        console.error(`Error recording migration ${migrationFile}:`, err);
        db.close();
        process.exit(1);
      }
      
      console.log(`✓ Migration ${migrationFile} applied successfully`);
      
      // Apply next migration
      applyMigrations(migrations, index + 1);
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nClosing database connection...');
  db.close();
  process.exit(0);
});