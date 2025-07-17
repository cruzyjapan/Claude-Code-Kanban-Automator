#!/usr/bin/env node

/**
 * Sample Data Generator for Claude Code Kanban Automator
 * This script creates sample tasks and data for demonstration purposes
 */

const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DB_PATH = './database/tasks.db';
const SAMPLE_DATA_DIR = './demo/sample-data';

// Sample tasks data
const sampleTasks = [
  {
    title: "React コンポーネントの作成",
    description: "ユーザープロフィール表示用のReactコンポーネントを作成してください。\n\n要件：\n- TypeScriptで実装\n- プロフィール画像、名前、メールアドレスを表示\n- 編集モードの切り替え機能\n- レスポンシブデザイン対応",
    priority: "high",
    status: "pending",
    estimated_hours: 3.0
  },
  {
    title: "API エンドポイントの実装",
    description: "ユーザー管理用のRESTful APIエンドポイントを実装してください。\n\n必要なエンドポイント：\n- GET /api/users - ユーザー一覧取得\n- GET /api/users/:id - ユーザー詳細取得\n- POST /api/users - ユーザー作成\n- PUT /api/users/:id - ユーザー更新\n- DELETE /api/users/:id - ユーザー削除",
    priority: "medium",
    status: "requested",
    estimated_hours: 5.0
  },
  {
    title: "データベース設計の最適化",
    description: "現在のデータベース設計を見直し、パフォーマンスを向上させてください。\n\n対象：\n- インデックスの追加\n- クエリの最適化\n- テーブル構造の改善",
    priority: "low",
    status: "working",
    estimated_hours: 8.0
  },
  {
    title: "認証システムの実装",
    description: "JWT トークンベースの認証システムを実装してください。\n\n機能：\n- ログイン・ログアウト\n- パスワードリセット\n- トークンの自動更新\n- 権限管理",
    priority: "high",
    status: "review",
    estimated_hours: 12.0
  },
  {
    title: "単体テストの作成",
    description: "既存のサービスクラスに対する単体テストを作成してください。\n\n対象：\n- UserService\n- TaskService\n- AuthService\n\nテストフレームワーク：Jest",
    priority: "medium",
    status: "completed",
    estimated_hours: 6.0,
    actual_hours: 5.5
  }
];

// Sample feedback data
const sampleFeedback = [
  {
    content: "認証システムの実装、お疲れ様でした。以下の点を修正してください：\n\n1. パスワードの複雑さチェックを追加\n2. ログイン試行回数の制限を実装\n3. セッションタイムアウトの設定\n\nよろしくお願いします。",
    addressed: 0
  },
  {
    content: "UIの調整をお願いします。モバイル表示でボタンが小さすぎます。",
    addressed: 1,
    addressed_version: 2
  }
];

// Sample notifications
const sampleNotifications = [
  {
    type: "task_completed",
    title: "タスクが完了しました",
    message: "「単体テストの作成」が完了し、レビュー待ちです。",
    is_read: 0,
    priority: "medium"
  },
  {
    type: "task_review",
    title: "レビューが必要です",
    message: "「認証システムの実装」のレビューをお願いします。",
    is_read: 0,
    priority: "high"
  },
  {
    type: "feedback_added",
    title: "フィードバックが追加されました",
    message: "「認証システムの実装」にフィードバックが追加されました。",
    is_read: 1,
    priority: "medium"
  }
];

async function createSampleData() {
  console.log('🎭 Creating sample data for demo...');
  
  // Create sample data directory
  if (!fs.existsSync(SAMPLE_DATA_DIR)) {
    fs.mkdirSync(SAMPLE_DATA_DIR, { recursive: true });
  }
  
  // Create sample attachment files
  const attachmentFiles = [
    { name: 'requirements.md', content: '# 要件定義書\n\n## 概要\nユーザー管理システムの要件定義です。' },
    { name: 'design.png', content: 'Mock image data for design file' },
    { name: 'api-spec.json', content: JSON.stringify({ 
      openapi: '3.0.0',
      info: { title: 'User API', version: '1.0.0' },
      paths: {}
    }, null, 2) }
  ];
  
  attachmentFiles.forEach(file => {
    fs.writeFileSync(path.join(SAMPLE_DATA_DIR, file.name), file.content);
  });
  
  // Open database connection
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    // Insert sample tasks
    console.log('📝 Inserting sample tasks...');
    for (const task of sampleTasks) {
      const taskId = `task-${uuidv4()}`;
      const now = new Date().toISOString();
      
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO tasks (id, title, description, priority, status, estimated_hours, actual_hours, created_at, updated_at, version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          taskId,
          task.title,
          task.description,
          task.priority,
          task.status,
          task.estimated_hours,
          task.actual_hours || null,
          now,
          now,
          1
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
      
      // Add sample executions for working/review/completed tasks
      if (['working', 'review', 'completed'].includes(task.status)) {
        const executionId = `exec-${uuidv4()}`;
        const startTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
        const endTime = task.status === 'working' ? null : new Date(Date.now() - 1800000).toISOString(); // 30 min ago
        
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO executions (id, task_id, version, started_at, completed_at, status, execution_logs)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            executionId,
            taskId,
            1,
            startTime,
            endTime,
            task.status === 'working' ? 'running' : 'completed',
            `[${startTime}] Task execution started\n[${startTime}] Analyzing requirements...\n[${startTime}] Generating code...\n${endTime ? `[${endTime}] Task completed successfully` : '[Running] In progress...'}`
          ], function(err) {
            if (err) reject(err);
            else resolve(this);
          });
        });
      }
      
      // Add sample feedback for review tasks
      if (task.status === 'review') {
        const feedbackId = `feedback-${uuidv4()}`;
        
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO feedback (id, task_id, user_id, content, created_at, addressed)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            feedbackId,
            taskId,
            'demo-user',
            sampleFeedback[0].content,
            now,
            0
          ], function(err) {
            if (err) reject(err);
            else resolve(this);
          });
        });
      }
    }
    
    // Insert sample notifications
    console.log('🔔 Inserting sample notifications...');
    for (const notification of sampleNotifications) {
      const notificationId = `notif-${uuidv4()}`;
      const now = new Date().toISOString();
      
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          notificationId,
          'demo-user',
          notification.type,
          notification.title,
          notification.message,
          notification.is_read,
          now,
          notification.priority
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }
    
    // Insert sample user settings
    console.log('⚙️ Inserting sample user settings...');
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO user_settings (
          user_id, desktop_notifications, sound_enabled, sound_volume, sound_type,
          notify_review_request, notify_task_complete, notify_error, notify_task_start,
          notify_feedback_complete, theme, language, task_timeout_minutes, enable_task_timeout,
          enable_dangerous_permissions, custom_prompt_instructions, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'default',
        1, 1, 70, 'chime',
        1, 1, 1, 0, 1,
        'auto', 'ja', 15, 1,
        0, 'デフォルトの指示：\n- コードには日本語でコメントを書いてください\n- TypeScriptを使用してください\n- エラーハンドリングを含めてください',
        new Date().toISOString(),
        new Date().toISOString()
      ], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    
    console.log('✅ Sample data created successfully!');
    console.log('📊 Summary:');
    console.log(`  - ${sampleTasks.length} sample tasks`);
    console.log(`  - ${sampleNotifications.length} sample notifications`);
    console.log(`  - ${attachmentFiles.length} sample attachment files`);
    console.log('');
    console.log('🌐 You can now start the application and take screenshots:');
    console.log('  npm run dev');
    console.log('  Open http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    db.close();
  }
}

// Run the script
if (require.main === module) {
  createSampleData();
}

module.exports = { createSampleData };