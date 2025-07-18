#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');

const testPrompt = `
# カスタムプロンプトテスト

このプロジェクトでは以下のルールに従ってください：
1. TypeScriptを使用
2. エラーハンドリングを適切に行う
3. コメントは日本語で記述
`;

console.log('Testing custom prompt functionality...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
});

// First, ensure default user exists
db.run(
  `INSERT OR IGNORE INTO user_settings (user_id) VALUES ('default')`,
  [],
  (err) => {
    if (err) {
      console.error('Failed to create default user:', err);
      db.close();
      return;
    }
    
    // Update custom prompt instructions
    db.run(
      `UPDATE user_settings SET custom_prompt_instructions = ? WHERE user_id = 'default'`,
      [testPrompt],
      (err) => {
        if (err) {
          console.error('Failed to update custom prompt:', err);
        } else {
          console.log('✓ Custom prompt instructions saved successfully');
        }
        
        // Verify the update
        db.get(
          `SELECT custom_prompt_instructions FROM user_settings WHERE user_id = 'default'`,
          [],
          (err, row) => {
            if (err) {
              console.error('Failed to retrieve custom prompt:', err);
            } else if (row && row.custom_prompt_instructions) {
              console.log('\n✓ Retrieved custom prompt instructions:');
              console.log('-----------------------------------');
              console.log(row.custom_prompt_instructions);
              console.log('-----------------------------------');
              console.log('\nCustom prompt feature is working correctly!');
            } else {
              console.error('✗ No custom prompt instructions found');
            }
            
            db.close();
          }
        );
      }
    );
  }
);