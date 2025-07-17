#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const DATABASE_PATH = process.env.DATABASE_PATH || './database/tasks.db';
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Read schema file
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Create and initialize database
const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log(`Connected to SQLite database: ${DATABASE_PATH}`);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Execute schema
db.exec(schema, (err) => {
  if (err) {
    console.error('Error creating schema:', err);
    process.exit(1);
  }
  console.log('Database schema created successfully');

  // Insert default data
  insertDefaultData();
});

function insertDefaultData() {
  // Insert default user settings
  db.run(
    `INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)`,
    ['default'],
    (err) => {
      if (err) {
        console.error('Error inserting default user settings:', err);
      } else {
        console.log('Default user settings created');
      }
    }
  );

  // Insert default tags
  const defaultTags = [
    { name: 'backend', color: '#3B82F6' },
    { name: 'frontend', color: '#10B981' },
    { name: 'api', color: '#8B5CF6' },
    { name: 'database', color: '#F59E0B' },
    { name: 'documentation', color: '#6B7280' },
    { name: 'testing', color: '#EF4444' },
    { name: 'ui/ux', color: '#EC4899' },
    { name: 'performance', color: '#F97316' },
    { name: 'security', color: '#DC2626' },
    { name: 'refactoring', color: '#7C3AED' }
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO tags (id, name, color) VALUES (?, ?, ?)');
  
  defaultTags.forEach((tag) => {
    const tagId = `tag-${tag.name}`;
    stmt.run(tagId, tag.name, tag.color, (err) => {
      if (err) {
        console.error(`Error inserting tag ${tag.name}:`, err);
      }
    });
  });

  stmt.finalize(() => {
    console.log('Default tags created');
    
    // Insert sample task templates
    insertSampleTemplates();
  });
}

function insertSampleTemplates() {
  const templates = [
    {
      id: 'tpl-api-endpoint',
      name: 'API エンドポイント作成',
      description: 'RESTful API エンドポイントの作成テンプレート',
      category: 'backend',
      template_data: JSON.stringify({
        title: '{{endpoint}} APIエンドポイントの実装',
        description: `以下のAPIエンドポイントを実装してください：

- メソッド: {{method}}
- パス: {{path}}
- 機能: {{description}}

要件：
- 入力検証を実装
- エラーハンドリングを含める
- 適切なHTTPステータスコードを返す
- テストケースを作成`,
        priority: 'medium',
        tags: ['backend', 'api']
      })
    },
    {
      id: 'tpl-react-component',
      name: 'React コンポーネント作成',
      description: 'React コンポーネントの作成テンプレート',
      category: 'frontend',
      template_data: JSON.stringify({
        title: '{{componentName}} コンポーネントの作成',
        description: `以下のReactコンポーネントを作成してください：

コンポーネント名: {{componentName}}
機能: {{description}}

要件：
- TypeScriptで実装
- Props の型定義を含める
- 必要に応じてHooksを使用
- Storybook用のストーリーを作成
- ユニットテストを作成`,
        priority: 'medium',
        tags: ['frontend', 'ui/ux']
      })
    },
    {
      id: 'tpl-db-migration',
      name: 'データベースマイグレーション',
      description: 'データベース変更のマイグレーションテンプレート',
      category: 'database',
      template_data: JSON.stringify({
        title: 'データベースマイグレーション: {{description}}',
        description: `以下のデータベース変更を実装してください：

変更内容: {{changes}}

要件：
- マイグレーションスクリプトを作成
- ロールバックスクリプトも含める
- 既存データへの影響を考慮
- 実行前にバックアップを取得`,
        priority: 'high',
        tags: ['database']
      })
    }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO task_templates (id, name, description, category, template_data) 
    VALUES (?, ?, ?, ?, ?)
  `);

  templates.forEach((template) => {
    stmt.run(
      template.id,
      template.name,
      template.description,
      template.category,
      template.template_data,
      (err) => {
        if (err) {
          console.error(`Error inserting template ${template.name}:`, err);
        }
      }
    );
  });

  stmt.finalize(() => {
    console.log('Sample templates created');
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database initialization completed successfully!');
      }
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nClosing database connection...');
  db.close();
  process.exit(0);
});