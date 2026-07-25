const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'Frontend', 'public', 'screenshots');

// Ensure directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 Starting screenshot automation...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Landing Page
    console.log('📸 Loading landing page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'landing.png') });
    console.log('✅ Captured landing.png');

    // 2. Sign In Page
    console.log('📸 Navigating to Sign In page...');
    // Click the access console button in the header
    const accessConsoleBtn = await page.waitForSelector('header button');
    await accessConsoleBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'signin.png') });
    console.log('✅ Captured signin.png');

    // 3. Perform Login
    console.log('🔑 Logging in as demo admin...');
    await page.waitForSelector('#login-email');
    await page.type('#login-email', 'admin@unifiedcrm.io');
    await page.type('#login-password', 'UnifiedCRM2026!Secured');
    
    await page.waitForSelector('#login-submit');
    await page.click('#login-submit');
    
    // Wait for dashboard to load
    console.log('⌛ Waiting for dashboard load...');
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard.png') });
    console.log('✅ Captured dashboard.png');

    // Helper to click sidebar tabs
    const clickTab = async (tabLabel, filename) => {
      console.log(`📸 Navigating to tab: "${tabLabel}"...`);
      await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.trim().includes(label));
        if (btn) {
          btn.click();
        } else {
          console.error(`Button with text "${label}" not found.`);
        }
      }, tabLabel);
      
      await new Promise(r => setTimeout(r, 2500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
      console.log(`幕 Captured ${filename}`);
    };

    // 4. AI Document Parser
    await clickTab('AI Document Parser', 'document_parser.png');

    // 5. API Playground
    await clickTab('API Playground', 'api_playground.png');

    // 6. Normalization Explorer
    await clickTab('Normalization Explorer', 'explorer.png');

    // 7. Request Logs
    await clickTab('Request Logs', 'request_logs.png');

    console.log('🎉 Screenshot generation complete!');
  } catch (err) {
    console.error('❌ Error during screenshot generation:', err);
  } finally {
    await browser.close();
  }
})();
