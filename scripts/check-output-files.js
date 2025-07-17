const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
const db = new Database(dbPath);

console.log('Checking output_files table...\n');

// Get all output files
const outputFiles = db.prepare(`
  SELECT 
    of.*, 
    t.title as task_title,
    e.status as execution_status
  FROM output_files of
  JOIN tasks t ON of.task_id = t.id
  JOIN executions e ON of.execution_id = e.id
  ORDER BY of.created_at DESC
  LIMIT 20
`).all();

console.log(`Found ${outputFiles.length} output files:\n`);

outputFiles.forEach(file => {
  console.log(`Task: ${file.task_title} (${file.task_id})`);
  console.log(`  File: ${file.file_name}`);
  console.log(`  Path: ${file.file_path}`);
  console.log(`  Type: ${file.file_type}`);
  console.log(`  Size: ${file.file_size} bytes`);
  console.log(`  Execution: ${file.execution_id} (${file.execution_status})`);
  console.log(`  Created: ${file.created_at}\n`);
});

// Check a specific task
const taskId = process.argv[2];
if (taskId) {
  console.log(`\nFiles for task ${taskId}:`);
  const taskFiles = db.prepare(`
    SELECT * FROM output_files 
    WHERE task_id = ?
    ORDER BY created_at DESC
  `).all(taskId);
  
  if (taskFiles.length === 0) {
    console.log('No files found for this task.');
  } else {
    taskFiles.forEach(file => {
      console.log(`  - ${file.file_name} (${file.file_size} bytes)`);
    });
  }
}

db.close();