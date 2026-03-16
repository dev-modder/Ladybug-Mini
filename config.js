/**
 * Global Configuration for WhatsApp MD Bot
 * Ladybug Bot Mini — by Dev-Ntando
 */

module.exports = {

  // ────────────────────────────────────────────
  // 👑 OWNER CONFIGURATION
  // ────────────────────────────────────────────
  ownerNumber: ['263786831091', '263777124998'], // Numbers without + or spaces
  ownerName:   ['Dev-Ntando', 'Mr Ntando Ofc'],   // Names matching ownerNumber order

  // ────────────────────────────────────────────
  // 🤖 BOT CONFIGURATION
  // ────────────────────────────────────────────
  botName:      'Ladybug Bot Mini',
  prefix:       '.',
  sessionName:  'session',
  sessionID:    process.env.SESSION_ID || 'KnightBot!H4sIAAAAAAAAA5VU25KiSBT8l3rVGOWmYkRHLCIKAiJewY19KKGEkqtUgcCE/76BPT3TD7uzvW91izx5MvPUd5BmmCAdNWD6HeQFriBF3ZI2OQJTMCuvV1SAPvAhhWAKeorOe8nsVgWaIp6w09Lb8pZOgoXPkGQ74qqzcGyQJo4d5Q08+yAvLzH2fgO4g3ix3UTQ1E+CHZINH8Rztac77jAxsIPGB3F4tJFZuRF5A88OEeICp4GShyhBBYx11GwgLr5G/7SKVVNZNsOHPKm3+wBFi5tlbduL7xOTV461ayFvxSdMLH2N/nLeOvNMTa6+Hjeqm8utYB1rxiEBe04nSbuKJt5gl2i4ld7pExykyNd8lFJMmy/rbquiG7bZtiecNcRYJ7MRtu3ENPhcKuIChezj+GDbcVyr5teIX+5cxF2OTqjl8oPnklErpg2JhvnKNLiyvnjHHc/idVvNlM/EN8VHVqL/o3smUzPVAibjzIc1Q2x6ppdobG7yh3vrZU4v4smcGdxnsvJF+kbm4pix75fCq10jMZjxitVnDlNU1WWPF60xEez7aDTg1E/0IS2L37GcDU4zIVEok3HnwCjNdW6P15F/q6qTJ9pmwe5piejKtgdZ25iZGxYls+WF4K6pSg0HA70yJp61s1r3vKf8apnkqzgM3l4dRajRfDBlnn1QoAATWkCKs7Q749g+gH61Q16B6EtdIEMnGT1cXJ2tclMVDhTLUYVMEsfL6iqsDh6/03sDXqyHwzfQB3mReYgQ5KuY0KxoTEQIDBAB0z//6oMU1fTdt1c1pg+uuCD0kJZ5nEH/w9SPS+h5WZnSXZN6crdABZgOfx0jSnEakE7GMoWFF+IKySGkBEyvMCboZ4OoQD6Y0qJEP4dWzvxOd+68tk/70xb0QfLyA/tgCtgRN56MJhwzFJkpw/9Bvj06WJjn31JEQR/Er2cMNxqLAieOuCEvjsfdy+7i+ZNhB+gjCnFMOiWtOW2NYKYYc1qbw+VSUgJJDiTwq6OPZLxLv6uNRxoPpWyg7UMuK29rGj4W0SnXmgN73yu3pWVFp5Rdc/zbP4CAKcDp4MommaU4rDePBe1gb1f3iH9kVlRqqhOLwU3ZMIvlYs/HhrTxYmG+cixTO/g3/rAPNghdJD6XTq7ulyxcxPIohbL01lXzUYU99LnY2bbaw+F4ttm6xZc72Tmy+NgOZMk4NHfRRwsTJkqrm+ocwaus5/JyvdOv157KNXs79IPUUdMkH9TiYuSSQ3wSLwMrtN8z+5qZ+MdfhV9x6rzqtleMXqOfws7B//bunXgXseGz/wnjx2fybwN5ILvJSvAlfdMovD8ysvbierPz4r4z4/U9qrX6dssXuXjze+D5/KsP8hjSa1YkYApg6hcZ9kEfFFnZZVZLr9lvisnSUJvZwa7rPIaESr/mYI8TRChMcjBlxmOOZRlBGL+/2hRZrkISdiIseSkpwfNv90gJoVQHAAA=',

  newsletterJid: '120363161518@newsletter',
  updateZipUrl:  'https://github.com/dev-modder/Ladybug-Mini/archive/refs/heads/main.zip',

  // ────────────────────────────────────────────
  // 🗺️ TIMEZONE & LOCALE
  // ────────────────────────────────────────────
  timezone: 'Africa/Harare', // Updated: CAT (UTC+2) — Zimbabwe

  // ────────────────────────────────────────────
  // 🎨 STICKER CONFIGURATION
  // ────────────────────────────────────────────
  packname:  'Ladybug Bot Mini',
  authorname: 'Dev-Ntando', // Sticker pack author tag

  // ────────────────────────────────────────────
  // ⚙️ BOT BEHAVIOUR
  // ────────────────────────────────────────────
  selfMode:       false,  // true = only owner can use commands
  autoRead:       true,   // Auto-read incoming messages
  autoTyping:     true,   // Show typing indicator while processing
  autoBio:        true,   // Auto-update bot bio
  autoSticker:    true,   // Auto-convert images/videos to stickers
  autoReact:      true,   // Auto-react to messages
  autoReactMode:  'bot',  // 'bot' = only to bot messages | 'all' = all messages
  autoDownload:   true,   // Auto-download media

  // ────────────────────────────────────────────
  // 📡 AUTO STATUS CONFIGURATION
  // ────────────────────────────────────────────
  autoStatus: {
    enabled:          true,  // Set true to enable on bot start
    intervalMinutes:  120,     // How often to post a status (in minutes)
    mode:             'cycle', // 'cycle' = in order | 'random' = random quote
    timezone:         'Africa/Harare', // Timezone shown in status timestamp
  },

  // ────────────────────────────────────────────
  // 👥 GROUP SETTINGS DEFAULTS
  // ────────────────────────────────────────────
  defaultGroupSettings: {
    antilink:              true,
    antilinkAction:        'delete',   // 'delete' | 'kick' | 'warn'
    antitag:               true,
    antitagAction:         'delete',
    antiall:               true,       // Block non-admin mass messages (owner only)
    antiviewonce:          true,
    antibot:               true,
    anticall:              true,
    antigroupmention:      true,
    antigroupmentionAction:'delete',   // 'delete' | 'kick'
    antiSpam:              true,
    antidelete:            true,
    nsfw:                  true,
    detect:                true,
    chatbot:               true,
    autosticker:           true,       // Auto-convert images/videos in group to stickers

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
      '> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ Ladybug Bot Mini*',
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
    wait:              '⏳ Please wait...',
    success:           '✅ Success!',
    error:             '❌ Error occurred!',
    ownerOnly:         '👑 This command is only for the bot owner!',
    adminOnly:         '🛡️ This command is only for group admins!',
    groupOnly:         '👥 This command can only be used in groups!',
    privateOnly:       '💬 This command can only be used in private chat!',
    botAdminNeeded:    '🤖 I need to be an admin to execute this command!',
    invalidCommand:    '❓ Invalid command! Type .menu for help.',
    cooldown:          '⏱️ Slow down! Please wait before using this command again.',
    maintenance:       '🔧 This feature is currently under maintenance. Try again later.',
  },

  // ────────────────────────────────────────────
  // 🚨 LIMITS & SAFETY
  // ────────────────────────────────────────────
  maxWarnings:      3,    // Warnings before kick
  spamLimit:        5,    // Messages per 10s before spam detected
  maxStickersPerMin:10,   // Sticker rate limit

  // ────────────────────────────────────────────
  // 🌐 SOCIAL LINKS
  // ────────────────────────────────────────────
  social: {
    github:    'https://github.com/mrntandodev',
    instagram: 'https://instagram.com/yourusername',
    youtube:   'http://youtube.com/@mr_ntando_ofc',
  },

};
