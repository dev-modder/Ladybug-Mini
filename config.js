/**
 * Global Configuration for Ladybug Bot V5
 * Version: 5.0.0 — by Dev-Ntando
 */

module.exports = {

  // ────────────────────────────────────────────
  // 👑 OWNER CONFIGURATION
  // ────────────────────────────────────────────
  ownerNumber: ['263786831091', '263777124998'], // Numbers without + or spaces
  ownerName:   ['Dev-Ntando', 'Mr Ntando Ofc'],  // Names matching ownerNumber order

  // ────────────────────────────────────────────
  // 🤖 BOT CONFIGURATION
  // ────────────────────────────────────────────
  botName:      'Ladybug Bot V5',
  prefix:       '.',
  sessionName:  'session',
  sessionID:    process.env.SESSION_ID || 'KnightBot!H4sIAAAAAAAAA5VUTZOiSBD9Kxt11RiBUkQjOmIRUFFUbFSUjTkUUEApn0Uh4oT/fQO7e3oOu7O9t6KKzHz53sv8AdKMlHiJGzD+AXJKrojh9siaHIMxmFRBgCnoAh8xBMZAUqKjNllYuySnFhotO9LhGJuFfy2TaKVM9uxE9Nkp3biX+gU8uiCv3Jh4v0mYynxZlLcMLaFodaKN0WR8cttB77rh9ONazYvSHBzWr8FRegGPNiMilKShlkc4wRTFS9yYiNCvwdcWm9EBXqZDe+FjuT5EhXiBk7szwJmlHeaq5e3P/CHQCp77GnxvkcwqO5jyutbpwZ69zmF2CaHlrQ/nIE32qzRcZJID77PyDX5JwhT7uo9TRljzZd6tzSRXg/1iF3qO5zHVtdO1LHTm0VYJw0rr0eK+onlP60y9rwEvsjCrzrZi+OJcs090HzmrQuyYF6SqRXPYO/26jA5ka/Par8BN+uGVy//hvWOqmmjEg00wK4evfCMnHX07SgzfVvPegM19J5h3bNfLBPmLtuGylZjP5UnmnYyC2nadxa/2SD32R7YwyrfIGwYM8y5f9z/hI1bR36HkUydR8+w8uN077uBsxmKzusYjERmSmKe7a39oatONJgXYgluSIqrsrYQ/KrJ7v2+ijUMtdKFra7KLVV4UTicFSrIivzw7uuBG98GYf3QBxSEpGUWMZOnzbsh1AfKvFvYoZk96gT7CZY6Qtx8Uc1b7xtnR7fkpSCXBdTarqZ+IVFAMKKwV6QV0QU4zD5cl9uekZBltVrgsUYhLMP7rexek+MbehGvLQb4LAkJLtk+rPM6Q/6HqxyPyvKxKmdWkntIeMAVj7vMaM0bSsGx5rFJEvYhcsRIhVoJxgOIS/+wQU+yDMaMV/jm1Sua3xJurrXCAoxnoguQpCPHBGAgiHEqiBHluxI8F+Gf5rW7Tojz/lmIGuiBFyTP6aY4/ZAK6IH5G8lAcjgZwJEKuPxoO2+D24fETdFvDxwyRuARjoBiFW1Fpphk9bShxs5mshbISyuCzyQ+3vKmhiI14nRm2KZ53Zn0R1Sw9TpuNdp57alConupe3fNR5uNX/eUfkoAxgMuc0/YLuSbrwc49NkfNKBwi1CftELL+fX3X01593flMz3hxMeWLdB9Ccbm8vvpuVZ8Kql8YvLHqkkgHq6jN6Oqpcv3SVvPxlXj412JaDYsdsRxOrtXY3i22/NTwwqsOdaHJLsaSL4xV6mBT20/EuWLmnSSbQa83Ia92Z7W9eZvUmq32Ieb9W54g3uFCk6j1m4+fcxS/7y/ydFgrX/sZEPxcB+8y/aecb8Bb13GP7i853hfMvwzpZFuVFb0R/tzJuLu02ITigr9550i/QRmKIVQFXujz9drZW+Dx+N4FeYxYkNEEjEGZuAh0Ac2q1sN6GmS/qaTInD7ZhlbbdoxKJn/OxY4kuGQoydvpHcKRwElQfPvLpFk+R2XUMjDry0kFHn8DK5jX12UHAAA=',

  newsletterJid: '120363161518@newsletter',
  updateZipUrl:  'https://github.com/dev-modder/Ladybug-Mini/archive/refs/heads/main.zip',

  // ────────────────────────────────────────────
  // 🗺️ TIMEZONE & LOCALE
  // ────────────────────────────────────────────
  timezone: 'Africa/Harare', // CAT (UTC+2) — Zimbabwe

  // ────────────────────────────────────────────
  // 🎨 STICKER CONFIGURATION
  // ────────────────────────────────────────────
  packname:   'Ladybug Bot V5',
  authorname: 'Dev-Ntando',

  // ────────────────────────────────────────────
  // ⚙️ BOT BEHAVIOUR
  // ────────────────────────────────────────────
  selfMode:       false,  // true = only owner can use commands
  autoRead:       true,   // Auto-read incoming messages
  autoTyping:     true,   // Show typing indicator while processing
  autoBio:        true,   // Auto-update bot bio on connect
  autoSticker:    true,   // Auto-convert images/videos to stickers
  autoReact:      true,   // Auto-react to messages
  autoReactMode:  'bot',  // 'bot' = react to bot commands only | 'all' = all messages
  autoDownload:   true,   // Auto-download media

  // ────────────────────────────────────────────
  // 📡 AUTO STATUS CONFIGURATION
  // ────────────────────────────────────────────
  autoStatus: {
    enabled:         true,
    intervalMinutes: 120,     // How often to post a status (minutes)
    mode:            'cycle', // 'cycle' = in order | 'random' = random quote
    timezone:        'Africa/Harare',
  },

  // ────────────────────────────────────────────
  // 👥 GROUP SETTINGS DEFAULTS
  // Applied when a group is first seen by the bot.
  // Each setting can be toggled per-group via commands.
  // ────────────────────────────────────────────
  defaultGroupSettings: {

    // ── Existing protections ──
    antilink:              true,
    antilinkAction:        'delete',   // 'delete' | 'kick'
    antitag:               true,
    antitagAction:         'delete',   // 'delete' | 'kick'
    antiall:               true,
    antiviewonce:          true,
    antibot:               true,
    anticall:              true,
    antigroupmention:      true,
    antigroupmentionAction:'delete',   // 'delete' | 'kick'
    antidelete:            true,
    nsfw:                  true,
    detect:                true,
    chatbot:               true,
    autosticker:           true,

    // ── V5: Anti-Spam ──────────────────────────
    antispam:              true,       // Enable spam detection
    antispamLimit:         5,          // Messages per 5 seconds before action
    antispamAction:        'warn',     // 'warn' | 'kick'

    // ── V5: Word Filter ────────────────────────
    wordfilter:            true,      // Off by default — add words first
    wordfilterAction:      'delete',   // 'delete' | 'warn' | 'kick'

    // ── V5: Poll Logging ───────────────────────
    logPolls:              true,       // Log poll create/vote events to cmdlog.json

    // ── Welcome / Goodbye ──
    welcome:        true,
    welcomeMessage: [
      '╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮',
      '┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @user 👋',
      '┃Member count: #memberCount',
      '┃𝚃𝙸𝙼𝙴: time⏰',
      '╰━━━━━━━━━━━━━━━╯',
      '',
      '*@user* Welcome to *@group*! 🎉',
      '*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*',
      'groupDesc',
      '',
      '> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ Ladybug Bot V5*',
    ].join('\n'),

    goodbye:        true,
    goodbyeMessage: 'Goodbye @user 👋 We will miss you!',
  },

  // ────────────────────────────────────────────
  // 🔑 API KEYS
  // ────────────────────────────────────────────
  apiKeys: {
    openai:    process.env.OPENAI_API_KEY    || '',
    deepai:    process.env.DEEPAI_API_KEY    || '',
    remove_bg: process.env.REMOVE_BG_API_KEY || '',
  },

  // ────────────────────────────────────────────
  // 💬 DEFAULT MESSAGES
  // ────────────────────────────────────────────
  messages: {
    wait:           '⏳ Please wait...',
    success:        '✅ Success!',
    error:          '❌ Error occurred!',
    ownerOnly:      '👑 This command is only for the bot owner!',
    adminOnly:      '🛡️ This command is only for group admins!',
    groupOnly:      '👥 This command can only be used in groups!',
    privateOnly:    '💬 This command can only be used in private chat!',
    botAdminNeeded: '🤖 I need to be an admin to execute this command!',
    invalidCommand: '❓ Invalid command! Type .menu for help.',
    cooldown:       '⏱️ Slow down! Please wait before using this command again.',
    maintenance:    '🔧 This feature is currently under maintenance. Try again later.',

    // ── V5 messages ──
    spamWarning:    '🚫 *Anti-Spam* | Slow down, you\'re sending too many messages!',
    wordBlocked:    '🚫 *Word Filter* | That word is not allowed in this group.',
  },

  // ────────────────────────────────────────────
  // 🚨 LIMITS & SAFETY
  // ────────────────────────────────────────────
  maxWarnings:       3,   // Warnings before auto-kick
  spamLimit:         5,   // Messages per 5s before spam detected (global fallback)
  maxStickersPerMin: 10,  // Sticker rate limit

  // ── V5: Command Logger ──
  cmdLog: {
    enabled:  true,   // Set false to disable all command logging
    maxEntries: 500,  // Max log entries kept in cmdlog.json
  },

  // ────────────────────────────────────────────
  // 🌐 SOCIAL LINKS
  // ────────────────────────────────────────────
  social: {
    github:    'https://github.com/mrntandodev',
    instagram: 'https://instagram.com/yourusername',
    youtube:   'http://youtube.com/@mr_ntando_ofc',
  },

};
