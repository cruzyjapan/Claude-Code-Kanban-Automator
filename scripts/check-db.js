const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('Connected to database');
  
  // Check tasks
  db.all('SELECT id, title, status FROM tasks', (err, rows) => {
    if (err) {
      console.error('Error querying tasks:', err);
      return;
    }
    
    console.log('\nTasks in database:');
    if (rows.length === 0) {
      console.log('No tasks found');
    } else {
      rows.forEach(row => {
        console.log(`- ${row.id}: ${row.title} (${row.status})`);
      });
    }
    
    // Update requested tasks to pending to stop execution
    if (rows.some(row => row.status === 'requested')) {
      console.log('\nFound tasks in "requested" status. Updating to "pending" to prevent execution...');
      db.run('UPDATE tasks SET status = "pending" WHERE status = "requested"', (err) => {
        if (err) {
          console.error('Error updating tasks:', err);
        } else {
          console.log('Tasks updated successfully');
        }
        db.close();
      });
    } else {
      db.close();
    }
  });
});