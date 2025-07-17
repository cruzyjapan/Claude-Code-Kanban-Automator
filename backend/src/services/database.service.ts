import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseService {
  private db: sqlite3.Database;
  private runAsync: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  private getAsync: (sql: string, params?: any[]) => Promise<any>;
  private allAsync: (sql: string, params?: any[]) => Promise<any[]>;

  constructor() {
    const dbPath = process.env['DATABASE_PATH'] || path.join(__dirname, '../../../database/tasks.db');
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        throw err;
      }
      console.log('Connected to SQLite database');
    });

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
    
    // Set timezone to JST (UTC+9)
    process.env.TZ = 'Asia/Tokyo';
    
    // Configure SQLite to use localtime instead of UTC
    this.db.run("PRAGMA timezone = 'localtime'", (err) => {
      if (err) {
        // SQLite might not support timezone pragma, try alternative approach
        console.log('SQLite timezone pragma not supported, using datetime functions with localtime modifier');
      }
    });

    // Promisify database methods
    this.runAsync = promisify(this.db.run.bind(this.db));
    this.getAsync = promisify(this.db.get.bind(this.db));
    this.allAsync = promisify(this.db.all.bind(this.db));
  }

  async run(sql: string, params?: any[]): Promise<sqlite3.RunResult> {
    return this.runAsync(sql, params);
  }

  async get(sql: string, params?: any[]): Promise<any> {
    return this.getAsync(sql, params);
  }

  async all(sql: string, params?: any[]): Promise<any[]> {
    return this.allAsync(sql, params);
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.run('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Singleton instance
let databaseInstance: DatabaseService | null = null;

export function getDatabase(): DatabaseService {
  if (!databaseInstance) {
    databaseInstance = new DatabaseService();
  }
  return databaseInstance;
}