#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
const db = new sqlite3.Database(dbPath);

console.log('Cleaning up stuck executions...\n');

// First, find and display stuck executions
db.all(`
  SELECT 
    e.id as execution_id,
    e.task_id,
    e.status as execution_status,
    e.started_at,
    t.title,
    t.status as task_status
  FROM executions e
  LEFT JOIN tasks t ON e.task_id = t.id
  WHERE e.status = 'running' 
    AND (t.status IN ('review', 'completed', 'pending') OR t.status IS NULL)
  ORDER BY e.started_at DESC
`, (err, rows) => {
  if (err) {
    console.error('Error querying database:', err);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('✅ No stuck executions found.');
    db.close();
    return;
  }

  console.log(`Found ${rows.length} stuck execution(s):\n`);
  rows.forEach(row => {
    console.log(`Execution: ${row.execution_id}`);
    console.log(`  Task: ${row.title || 'Unknown'} (${row.task_id})`);
    console.log(`  Task Status: ${row.task_status || 'Task not found'}`);
    console.log(`  Started: ${row.started_at}`);
    console.log('');
  });

  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nDo you want to fix these stuck executions? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      // Fix executions based on task status
      let fixedCount = 0;
      let errorCount = 0;

      const fixExecutions = () => {
        rows.forEach((row, index) => {
          let newStatus = 'failed';
          let message = 'Execution marked as failed due to inconsistent state';

          if (row.task_status === 'review' || row.task_status === 'completed') {
            newStatus = 'completed';
            message = 'Execution marked as completed to match task status';
          }

          db.run(`
            UPDATE executions 
            SET status = ?, 
                completed_at = datetime('now', 'localtime'),
                execution_logs = COALESCE(execution_logs, '') || '\n\n[Cleanup Script] ' || ?
            WHERE id = ?
          `, [newStatus, message, row.execution_id], (err) => {
            if (err) {
              console.error(`❌ Error fixing execution ${row.execution_id}:`, err);
              errorCount++;
            } else {
              console.log(`✅ Fixed execution ${row.execution_id} - set to ${newStatus}`);
              fixedCount++;
            }

            // Check if we're done
            if (index === rows.length - 1) {
              console.log(`\nCleanup complete: ${fixedCount} fixed, ${errorCount} errors`);
              db.close();
              rl.close();
            }
          });
        });
      };

      fixExecutions();
    } else {
      console.log('Cleanup cancelled.');
      db.close();
      rl.close();
    }
  });
});