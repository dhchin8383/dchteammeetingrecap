const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RECAPS_FILE = path.join(DATA_DIR, 'recaps.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RECAPS_FILE)) fs.writeFileSync(RECAPS_FILE, '[]');
}

function listRecaps() {
  ensureStore();
  const raw = fs.readFileSync(RECAPS_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function addRecap(recap) {
  ensureStore();
  const recaps = listRecaps();
  recaps.unshift(recap);
  fs.writeFileSync(RECAPS_FILE, JSON.stringify(recaps, null, 2));
  return recap;
}

module.exports = { listRecaps, addRecap, DATA_DIR };
