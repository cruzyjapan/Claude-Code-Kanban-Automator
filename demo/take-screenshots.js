#!/usr/bin/env node

/**
 * Automated Screenshot Tool for Claude Code Kanban Automator
 * This script uses Puppeteer to automatically capture screenshots of the application
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const DEMO_DIR = './demo';
const VIEWPORT = { width: 1920, height: 1080 };
const WAIT_TIME = 2000; // Wait 2 seconds for page to load

// Screenshot configurations
const screenshots = [
  {
    name: '01-dashboard',
    url: '/',
    description: 'Main dashboard with Kanban board',
    actions: []
  },
  {
    name: '02-task-creation',
    url: '/',
    description: 'New task creation modal',
    actions: [
      { type: 'click', selector: 'button:has-text("新規タスク")' },
      { type: 'wait', time: 1000 }
    ]
  },
  {
    name: '03-settings-notifications',
    url: '/settings',
    description: 'Notification settings page',
    actions: [
      { type: 'click', selector: 'button:has-text("通知")' },
      { type: 'wait', time: 1000 }
    ]
  },
  {
    name: '04-settings-appearance',
    url: '/settings',
    description: 'Appearance settings page',
    actions: [
      { type: 'click', selector: 'button:has-text("外観")' },
      { type: 'wait', time: 1000 }
    ]
  },
  {
    name: '05-settings-language',
    url: '/settings',
    description: 'Language settings page',
    actions: [
      { type: 'click', selector: 'button:has-text("言語")' },
      { type: 'wait', time: 1000 }
    ]
  },
  {
    name: '06-settings-permissions',
    url: '/settings',
    description: 'Permission settings page',
    actions: [
      { type: 'click', selector: 'button:has-text("権限設定")' },
      { type: 'wait', time: 1000 }
    ]
  },
  {
    name: '07-settings-custom-prompt',
    url: '/settings',
    description: 'Custom prompt settings page',
    actions: [
      { type: 'click', selector: 'button:has-text("カスタムプロンプト")' },
      { type: 'wait', time: 1000 }
    ]
  },
  {
    name: '08-archive-page',
    url: '/archive',
    description: 'Archive page with completed tasks',
    actions: []
  },
  {
    name: '09-notification-center',
    url: '/',
    description: 'Notification center dropdown',
    actions: [
      { type: 'click', selector: 'button[aria-label="notifications"]' },
      { type: 'wait', time: 1000 }
    ]
  },
  {
    name: '10-mobile-responsive',
    url: '/',
    description: 'Mobile responsive view',
    viewport: { width: 375, height: 667 },
    actions: []
  }
];

async function takeScreenshot(page, config) {
  console.log(`📸 Taking screenshot: ${config.name}`);
  
  try {
    // Set viewport
    const viewport = config.viewport || VIEWPORT;
    await page.setViewport(viewport);
    
    // Navigate to page
    await page.goto(`${BASE_URL}${config.url}`, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(WAIT_TIME);
    
    // Execute actions
    for (const action of config.actions || []) {
      switch (action.type) {
        case 'click':
          try {
            await page.click(action.selector);
          } catch (error) {
            console.warn(`⚠️  Could not click ${action.selector}: ${error.message}`);
          }
          break;
        case 'wait':
          await page.waitForTimeout(action.time);
          break;
        case 'type':
          await page.type(action.selector, action.text);
          break;
      }
    }
    
    // Take screenshot
    const screenshotPath = path.join(DEMO_DIR, `${config.name}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    
    console.log(`✅ Screenshot saved: ${screenshotPath}`);
    
  } catch (error) {
    console.error(`❌ Failed to take screenshot ${config.name}:`, error.message);
  }
}

async function takeAllScreenshots() {
  console.log('🎬 Starting automated screenshot capture...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📁 Output directory: ${DEMO_DIR}`);
  console.log('');
  
  // Check if demo directory exists
  if (!fs.existsSync(DEMO_DIR)) {
    fs.mkdirSync(DEMO_DIR, { recursive: true });
  }
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set default viewport
  await page.setViewport(VIEWPORT);
  
  // Add some basic styling for better screenshots
  await page.addStyleTag({
    content: `
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* Hide scrollbars for cleaner screenshots */
      ::-webkit-scrollbar {
        display: none;
      }
      
      /* Ensure animations are disabled for consistent screenshots */
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
  
  try {
    // Check if application is running
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('✅ Application is running');
    
    // Take all screenshots
    for (const config of screenshots) {
      await takeScreenshot(page, config);
    }
    
    console.log('');
    console.log('🎉 All screenshots captured successfully!');
    console.log(`📊 Total screenshots: ${screenshots.length}`);
    
  } catch (error) {
    console.error('❌ Error: Could not connect to application');
    console.error('💡 Make sure the application is running:');
    console.error('   npm run dev');
    console.error('   Open http://localhost:5173');
  } finally {
    await browser.close();
  }
}

// Manual screenshot function for specific pages
async function takeManualScreenshot(name, url, actions = []) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  
  console.log(`📸 Taking manual screenshot: ${name}`);
  console.log(`🌐 URL: ${BASE_URL}${url}`);
  
  await page.goto(`${BASE_URL}${url}`);
  await page.waitForTimeout(WAIT_TIME);
  
  // Execute actions
  for (const action of actions) {
    switch (action.type) {
      case 'click':
        console.log(`🖱️  Clicking: ${action.selector}`);
        await page.click(action.selector);
        break;
      case 'wait':
        console.log(`⏱️  Waiting: ${action.time}ms`);
        await page.waitForTimeout(action.time);
        break;
      case 'type':
        console.log(`⌨️  Typing: ${action.text}`);
        await page.type(action.selector, action.text);
        break;
    }
  }
  
  const screenshotPath = path.join(DEMO_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  console.log(`✅ Screenshot saved: ${screenshotPath}`);
  console.log('Press Ctrl+C to close browser');
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    takeAllScreenshots();
  } else if (args[0] === 'manual') {
    const name = args[1] || 'manual-screenshot';
    const url = args[2] || '/';
    takeManualScreenshot(name, url);
  } else {
    console.log('Usage:');
    console.log('  node take-screenshots.js              # Take all screenshots automatically');
    console.log('  node take-screenshots.js manual [name] [url]  # Take manual screenshot');
  }
}

module.exports = { takeAllScreenshots, takeManualScreenshot };