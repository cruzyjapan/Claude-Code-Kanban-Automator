# Demo Screenshots

This folder contains screenshots of the Claude Code Kanban Automator application to showcase its features.

## How to Take Screenshots

To capture screenshots of the application, follow these steps:

### 1. Start the Application

```bash
# Start both backend and frontend
npm run dev

# Access the application at http://localhost:5173
```

### 2. Screenshots to Capture

Take the following screenshots and save them with the specified names:

#### Main Application Views

1. **01-dashboard.png** - Main dashboard showing the Kanban board
   - URL: `http://localhost:5173/`
   - Show: Kanban columns (Pending, Requested, Working, Review, Completed)
   - Include: Task cards, status indicators, create task button

2. **02-task-creation.png** - New task creation modal
   - URL: `http://localhost:5173/`
   - Action: Click "新規タスク" (New Task) button
   - Show: Task creation form with title, description, priority, attachments

3. **03-task-detail.png** - Task detail page
   - URL: `http://localhost:5173/tasks/[task-id]`
   - Show: Task information, execution logs, feedback tabs

4. **04-task-detail-execution.png** - Task execution logs
   - URL: `http://localhost:5173/tasks/[task-id]`
   - Tab: "実行ログ" (Execution Logs)
   - Show: Execution history, status, duration

5. **05-task-detail-outputs.png** - Task outputs
   - URL: `http://localhost:5173/tasks/[task-id]`
   - Tab: "成果物" (Outputs)
   - Show: Generated files, download options

6. **06-task-detail-feedback.png** - Task feedback
   - URL: `http://localhost:5173/tasks/[task-id]`
   - Tab: "フィードバック" (Feedback)
   - Show: Feedback form, feedback history

7. **07-task-detail-attachments.png** - Task attachments
   - URL: `http://localhost:5173/tasks/[task-id]`
   - Tab: "添付ファイル" (Attachments)
   - Show: Attached files, upload interface

#### Settings Pages

8. **08-settings-notifications.png** - Notification settings
   - URL: `http://localhost:5173/settings`
   - Tab: "通知" (Notifications)
   - Show: Notification preferences, sound settings

9. **09-settings-appearance.png** - Appearance settings
   - URL: `http://localhost:5173/settings`
   - Tab: "外観" (Appearance)
   - Show: Theme selection (Light/Dark/Auto)

10. **10-settings-language.png** - Language settings
    - URL: `http://localhost:5173/settings`
    - Tab: "言語" (Language)
    - Show: Language selection (Japanese/English)

11. **11-settings-permissions.png** - Permission settings
    - URL: `http://localhost:5173/settings`
    - Tab: "権限設定" (Permissions)
    - Show: Permission toggles, dangerous permissions warning

12. **12-settings-custom-prompt.png** - Custom prompt settings
    - URL: `http://localhost:5173/settings`
    - Tab: "カスタムプロンプト" (Custom Prompt)
    - Show: Custom prompt instructions textarea

#### Additional Features

13. **13-archive-page.png** - Archive page
    - URL: `http://localhost:5173/archive`
    - Show: Archived tasks, filters

14. **14-notification-center.png** - Notification center
    - URL: `http://localhost:5173/`
    - Action: Click bell icon in header
    - Show: Notification list, mark as read options

15. **15-mobile-responsive.png** - Mobile responsive view
    - URL: `http://localhost:5173/`
    - Action: Resize browser to mobile width (375px)
    - Show: Mobile-optimized layout

#### System Status

16. **16-system-status.png** - System status indicators
    - URL: `http://localhost:5173/`
    - Show: Claude Code status, backend status, permission status

17. **17-task-workflow.png** - Task workflow in action
    - URL: `http://localhost:5173/`
    - Show: Tasks in different status columns, drag-and-drop demonstration

### 3. Screenshot Guidelines

- **Resolution**: Use 1920x1080 or similar high resolution
- **Browser**: Use Chrome or Firefox for consistency
- **Zoom**: Use 100% zoom level
- **Format**: Save as PNG for best quality
- **Naming**: Use the exact filenames specified above

### 4. Optional: Create GIFs

For dynamic features, consider creating GIFs:

- **drag-and-drop.gif** - Dragging tasks between columns
- **task-execution.gif** - Real-time task execution progress
- **notification-demo.gif** - Notification system in action

### 5. Automated Screenshot Tool

You can also use automated tools like Puppeteer to capture screenshots:

```javascript
// Example Puppeteer script
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto('http://localhost:5173');
  await page.screenshot({ path: 'demo/01-dashboard.png' });
  
  await browser.close();
})();
```

## Sample Data Setup

Before taking screenshots, create some sample data:

1. Create 3-5 sample tasks with different priorities
2. Move tasks to different status columns
3. Add some feedback to tasks
4. Upload sample attachments
5. Execute at least one task to show outputs

This will make the screenshots more realistic and informative.