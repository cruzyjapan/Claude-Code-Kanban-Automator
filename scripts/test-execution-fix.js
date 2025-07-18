#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing execution status fix...\n');

// Check for tasks in review status with running executions
db.all(`
  SELECT 
    t.id as task_id,
    t.title,
    t.status as task_status,
    e.id as execution_id,
    e.status as execution_status,
    e.started_at,
    e.completed_at
  FROM tasks t
  INNER JOIN executions e ON t.id = e.task_id
  WHERE t.status = 'review' AND e.status = 'running'
  ORDER BY e.started_at DESC
`, (err, rows) => {
  if (err) {
    console.error('Error querying database:', err);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('✅ No tasks found in review status with running executions.');
  } else {
    console.log(`⚠️  Found ${rows.length} task(s) in review status with running executions:\n`);
    rows.forEach(row => {
      console.log(`Task: ${row.title} (${row.task_id})`);
      console.log(`  Status: ${row.task_status}`);
      console.log(`  Execution: ${row.execution_id}`);
      console.log(`  Execution Status: ${row.execution_status}`);
      console.log(`  Started: ${row.started_at}`);
      console.log(`  Completed: ${row.completed_at || 'Not completed'}`);
      console.log('');
    });
  }

  // Also check for any running executions in general
  db.all(`
    SELECT 
      e.id,
      e.task_id,
      e.status,
      e.started_at,
      e.last_activity_at,
      t.title,
      t.status as task_status
    FROM executions e
    LEFT JOIN tasks t ON e.task_id = t.id
    WHERE e.status = 'running'
    ORDER BY e.started_at DESC
  `, (err2, runningRows) => {
    if (err2) {
      console.error('Error querying running executions:', err2);
      db.close();
      return;
    }

    console.log('\n--- All Running Executions ---');
    if (runningRows.length === 0) {
      console.log('✅ No running executions found.');
    } else {
      console.log(`Found ${runningRows.length} running execution(s):\n`);
      runningRows.forEach(row => {
        console.log(`Execution: ${row.id}`);
        console.log(`  Task: ${row.title || 'Unknown'} (${row.task_id})`);
        console.log(`  Task Status: ${row.task_status || 'Unknown'}`);
        console.log(`  Started: ${row.started_at}`);
        console.log(`  Last Activity: ${row.last_activity_at || 'No activity'}`);
        console.log('');
      });
    }

    db.close();
  });
});