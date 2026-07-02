const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { buildInfographicHtml } = require('../templates/infographicTemplate');
const { DATA_DIR } = require('./store');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'assets', 'logo.png');

function getLogoDataUri() {
  if (!fs.existsSync(LOGO_PATH)) return null;
  const buf = fs.readFileSync(LOGO_PATH);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function getBranding() {
  return {
    companyName: process.env.COMPANY_NAME || 'Dan Chin Homes',
    companyKicker: process.env.COMPANY_KICKER || 'Weekly Team Recap',
    companySubline: process.env.COMPANY_SUBLINE || '',
    companyTagline: process.env.COMPANY_TAGLINE || "Let's keep going.",
    companyTagwords: process.env.COMPANY_TAGWORDS || ''
  };
}

/**
 * Renders the recap content into a branded infographic PNG.
 * Returns the absolute path and filename of the saved image.
 */
async function renderInfographic({ content, id }) {
  const branding = getBranding();
  const html = buildInfographicHtml({ content, branding, logoDataUri: getLogoDataUri() });

  const imagesDir = path.join(DATA_DIR, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  const filename = `recap-${id}.png`;
  const filePath = path.join(imagesDir, filename);

  const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {};
  const browser = await chromium.launch(launchOpts);
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: filePath, fullPage: true });
  } finally {
    await browser.close();
  }

  return { filePath, filename };
}

module.exports = { renderInfographic };
