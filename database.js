/**
 * Ladybug Bot V5 — JSON Database
 * Handles group settings, users, warnings, mods,
 * anti-spam tracking, and word filter lists.
 */

const fs     = require('fs');
const path   = require('path');
const config = require('./config');

const DB_PATH       = path.join(__dirname, 'database');
const GROUPS_DB     = path.join(DB_PATH, 'groups.json');
const USERS_DB      = path.join(DB_PATH, 'users.json');
const WARNINGS_DB   = path.join(DB_PATH, 'warnings.json');
const MODS_DB       = path.join(DB_PATH, 'mods.json');
// ── V5 new tables ──
const SPAM_DB       = path.join(DB_PATH, 'spam.json');
const WORDFILTER_DB = path.join(DB_PATH, 'wordfilter.json');
const CMDLOG_DB     = path.join(DB_PATH, 'cmdlog.json');

// Ensure database directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Initialise a DB file with a default value if it doesn't exist
const initDB = (filePath, defaultData = {}) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initDB(GROUPS_DB,     {});
initDB(USERS_DB,      {});
initDB(WARNINGS_DB,   {});
initDB(MODS_DB,       { moderators: [] });
initDB(SPAM_DB,       {});
initDB(WORDFILTER_DB, { global: [], groups: {} });
initDB(CMDLOG_DB,     []);

// ─────────────────────────────────────────────
// 🔧 Low-level helpers
// ─────────────────────────────────────────────
const readDB = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading database: ${error.message}`);
    return Array.isArray(fs.readFileSync(filePath, 'utf-8').trim()[0]) ? [] : {};
  }
};

const writeDB = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing database: ${error.message}`);
    return false;
  }
};

// ─────────────────────────────────────────────
// 👥 Group Settings
// ─────────────────────────────────────────────
const getGroupSettings = (groupId) => {
  const groups = readDB(GROUPS_DB);
  if (!groups[groupId]) {
    groups[groupId] = { ...config.defaultGroupSettings };
    writeDB(GROUPS_DB, groups);
  }
  return groups[groupId];
};

const updateGroupSettings = (groupId, settings) => {
  const groups = readDB(GROUPS_DB);
  groups[groupId] = { ...groups[groupId], ...settings };
  return writeDB(GROUPS_DB, groups);
};

// ─────────────────────────────────────────────
// 👤 User Data
// ─────────────────────────────────────────────
const getUser = (userId) => {
  const users = readDB(USERS_DB);
  if (!users[userId]) {
    users[userId] = {
      registered: Date.now(),
      premium: false,
      banned: false
    };
    writeDB(USERS_DB, users);
  }
  return users[userId];
};

const updateUser = (userId, data) => {
  const users = readDB(USERS_DB);
  users[userId] = { ...users[userId], ...data };
  return writeDB(USERS_DB, users);
};

// ─────────────────────────────────────────────
// ⚠️ Warnings System
// ─────────────────────────────────────────────
const getWarnings = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  return warnings[key] || { count: 0, warnings: [] };
};

const addWarning = (groupId, userId, reason) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;

  if (!warnings[key]) {
    warnings[key] = { count: 0, warnings: [] };
  }

  warnings[key].count++;
  warnings[key].warnings.push({ reason, date: Date.now() });

  writeDB(WARNINGS_DB, warnings);
  return warnings[key];
};

const removeWarning = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;

  if (warnings[key] && warnings[key].count > 0) {
    warnings[key].count--;
    warnings[key].warnings.pop();
    writeDB(WARNINGS_DB, warnings);
    return true;
  }
  return false;
};

const clearWarnings = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  delete warnings[key];
  return writeDB(WARNINGS_DB, warnings);
};

// ─────────────────────────────────────────────
// 🛡️ Moderators System
// ─────────────────────────────────────────────
const getModerators = () => {
  const mods = readDB(MODS_DB);
  return mods.moderators || [];
};

const addModerator = (userId) => {
  const mods = readDB(MODS_DB);
  if (!mods.moderators) mods.moderators = [];
  if (!mods.moderators.includes(userId)) {
    mods.moderators.push(userId);
    return writeDB(MODS_DB, mods);
  }
  return false;
};

const removeModerator = (userId) => {
  const mods = readDB(MODS_DB);
  if (mods.moderators) {
    mods.moderators = mods.moderators.filter(id => id !== userId);
    return writeDB(MODS_DB, mods);
  }
  return false;
};

const isModerator = (userId) => {
  return getModerators().includes(userId);
};

// ─────────────────────────────────────────────
// 🚫 V5 — Anti-Spam Tracker
// Per-user message rate tracking per group.
// ─────────────────────────────────────────────

/**
 * Record a new message from a user and return their updated spam record.
 * @param {string} groupId
 * @param {string} userId
 * @returns {{ timestamps: number[], count: number }}
 */
const recordSpamMessage = (groupId, userId) => {
  const spam = readDB(SPAM_DB);
  const key  = `${groupId}_${userId}`;
  const now  = Date.now();
  const WINDOW = 5000; // 5-second rolling window

  if (!spam[key]) {
    spam[key] = { timestamps: [], warned: false };
  }

  // Prune old timestamps outside the window
  spam[key].timestamps = spam[key].timestamps.filter(t => now - t < WINDOW);
  spam[key].timestamps.push(now);

  writeDB(SPAM_DB, spam);
  return spam[key];
};

/**
 * Get spam record for a user in a group.
 */
const getSpamRecord = (groupId, userId) => {
  const spam = readDB(SPAM_DB);
  const key  = `${groupId}_${userId}`;
  return spam[key] || { timestamps: [], warned: false };
};

/**
 * Mark a user as already warned for spam.
 */
const markSpamWarned = (groupId, userId) => {
  const spam = readDB(SPAM_DB);
  const key  = `${groupId}_${userId}`;
  if (!spam[key]) spam[key] = { timestamps: [], warned: false };
  spam[key].warned = true;
  return writeDB(SPAM_DB, spam);
};

/**
 * Reset a user's spam record (after kick or manual clear).
 */
const clearSpamRecord = (groupId, userId) => {
  const spam = readDB(SPAM_DB);
  const key  = `${groupId}_${userId}`;
  delete spam[key];
  return writeDB(SPAM_DB, spam);
};

// ─────────────────────────────────────────────
// 🤬 V5 — Word Filter
// Global banned words list + per-group overrides.
// ─────────────────────────────────────────────

/**
 * Get the combined word list for a group (global + group-specific).
 * @param {string} groupId
 * @returns {string[]}
 */
const getWordFilterList = (groupId) => {
  const db = readDB(WORDFILTER_DB);
  const global = db.global || [];
  const groupWords = (db.groups && db.groups[groupId]) ? db.groups[groupId] : [];
  // Merge and deduplicate
  return [...new Set([...global, ...groupWords])].map(w => w.toLowerCase());
};

/**
 * Add a banned word globally or to a specific group.
 * @param {string} word
 * @param {string|null} groupId — pass null for global
 */
const addBannedWord = (word, groupId = null) => {
  const db = readDB(WORDFILTER_DB);
  word = word.toLowerCase().trim();

  if (!groupId) {
    if (!db.global) db.global = [];
    if (!db.global.includes(word)) db.global.push(word);
  } else {
    if (!db.groups) db.groups = {};
    if (!db.groups[groupId]) db.groups[groupId] = [];
    if (!db.groups[groupId].includes(word)) db.groups[groupId].push(word);
  }
  return writeDB(WORDFILTER_DB, db);
};

/**
 * Remove a banned word globally or from a specific group.
 * @param {string} word
 * @param {string|null} groupId
 */
const removeBannedWord = (word, groupId = null) => {
  const db = readDB(WORDFILTER_DB);
  word = word.toLowerCase().trim();

  if (!groupId) {
    db.global = (db.global || []).filter(w => w !== word);
  } else {
    if (db.groups && db.groups[groupId]) {
      db.groups[groupId] = db.groups[groupId].filter(w => w !== word);
    }
  }
  return writeDB(WORDFILTER_DB, db);
};

/**
 * Check if a message body contains any banned word.
 * @param {string} body
 * @param {string} groupId
 * @returns {{ found: boolean, word: string|null }}
 */
const checkWordFilter = (body, groupId) => {
  const words = getWordFilterList(groupId);
  const lowerBody = body.toLowerCase();
  for (const word of words) {
    if (lowerBody.includes(word)) {
      return { found: true, word };
    }
  }
  return { found: false, word: null };
};

// ─────────────────────────────────────────────
// 📋 V5 — Command Logger
// Append an entry every time a command is executed.
// ─────────────────────────────────────────────

/**
 * Log a command execution.
 * @param {string} command
 * @param {string} sender
 * @param {string} groupId
 */
const logCommand = (command, sender, groupId) => {
  try {
    const log = readDB(CMDLOG_DB);
    if (!Array.isArray(log)) return;

    log.push({
      command,
      sender,
      groupId: groupId || 'DM',
      timestamp: Date.now(),
      date: new Date().toISOString()
    });

    // Keep only last 500 entries to prevent unbounded growth
    const trimmed = log.length > 500 ? log.slice(log.length - 500) : log;
    writeDB(CMDLOG_DB, trimmed);
  } catch (err) {
    // Non-critical — never crash the bot over logging
    console.error('[CmdLog Error]', err.message);
  }
};

/**
 * Get recent command log entries.
 * @param {number} limit — default 20
 * @returns {Array}
 */
const getCommandLog = (limit = 20) => {
  const log = readDB(CMDLOG_DB);
  if (!Array.isArray(log)) return [];
  return log.slice(-limit).reverse();
};

// ─────────────────────────────────────────────
// 📤 Exports
// ─────────────────────────────────────────────
module.exports = {
  // Group settings
  getGroupSettings,
  updateGroupSettings,

  // Users
  getUser,
  updateUser,

  // Warnings
  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings,

  // Moderators
  getModerators,
  addModerator,
  removeModerator,
  isModerator,

  // ── V5: Anti-Spam ──
  recordSpamMessage,
  getSpamRecord,
  markSpamWarned,
  clearSpamRecord,

  // ── V5: Word Filter ──
  getWordFilterList,
  addBannedWord,
  removeBannedWord,
  checkWordFilter,

  // ── V5: Command Logger ──
  logCommand,
  getCommandLog
};
