const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const taskId = process.argv[2];
if (!taskId) {
  console.log('Usage: node request-task.js <task-id>');
  console.log('Example: node request-task.js T-1752707631562-z4fe9frth');
  process.exit(1);
}

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('Connected to database');
  
  // Update task status to requested
  db.run('UPDATE tasks SET status = "requested" WHERE id = ?', [taskId], function(err) {
    if (err) {
      console.error('Error updating task:', err);
    } else if (this.changes === 0) {
      console.log('Task not found:', taskId);
    } else {
      console.log(`Task ${taskId} status updated to "requested"`);
      console.log('The task should be executed within the next 5 seconds');
    }
    
    db.close();
  });
});