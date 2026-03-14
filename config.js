/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['91xxxxxxxxxxx','2637868310191'], // Add your number without + or spaces (e.g., 919876543210)
    ownerName: ['Ladybug Bot Mini', 'Professor'], // Owner names corresponding to ownerNumber array
    
    // Bot Configuration
    botName: 'Ladybug Bot Mini',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || 'KnightBot!H4sIAAAAAAAAA5VU25KiSBT8l3rVGOWmYkRHLCIKAiJewY19KKGEkqtUgcCE/76BPT3TD7uzvW91izx5MvPUd5BmmCAdNWD6HeQFriBF3ZI2OQJTMCuvV1SAPvAhhWAKeorOe8nsVgWaIp6w09Lb8pZOgoXPkGQ74qqzcGyQJo4d5Q08+yAvLzH2fgO4g3ix3UTQ1E+CHZINH8Rztac77jAxsIPGB3F4tJFZuRF5A88OEeICp4GShyhBBYx11GwgLr5G/7SKVVNZNsOHPKm3+wBFi5tlbduL7xOTV461ayFvxSdMLH2N/nLeOvNMTa6+Hjeqm8utYB1rxiEBe04nSbuKJt5gl2i4ld7pExykyNd8lFJMmy/rbquiG7bZtiecNcRYJ7MRtu3ENPhcKuIChezj+GDbcVyr5teIX+5cxF2OTqjl8oPnklErpg2JhvnKNLiyvnjHHc/idVvNlM/EN8VHVqL/o3smUzPVAibjzIc1Q2x6ppdobG7yh3vrZU4v4smcGdxnsvJF+kbm4pix75fCq10jMZjxitVnDlNU1WWPF60xEez7aDTg1E/0IS2L37GcDU4zIVEok3HnwCjNdW6P15F/q6qTJ9pmwe5piejKtgdZ25iZGxYls+WF4K6pSg0HA70yJp61s1r3vKf8apnkqzgM3l4dRajRfDBlnn1QoAATWkCKs7Q749g+gH61Q16B6EtdIEMnGT1cXJ2tclMVDhTLUYVMEsfL6iqsDh6/03sDXqyHwzfQB3mReYgQ5KuY0KxoTEQIDBAB0z//6oMU1fTdt1c1pg+uuCD0kJZ5nEH/w9SPS+h5WZnSXZN6crdABZgOfx0jSnEakE7GMoWFF+IKySGkBEyvMCboZ4OoQD6Y0qJEP4dWzvxOd+68tk/70xb0QfLyA/tgCtgRN56MJhwzFJkpw/9Bvj06WJjn31JEQR/Er2cMNxqLAieOuCEvjsfdy+7i+ZNhB+gjCnFMOiWtOW2NYKYYc1qbw+VSUgJJDiTwq6OPZLxLv6uNRxoPpWyg7UMuK29rGj4W0SnXmgN73yu3pWVFp5Rdc/zbP4CAKcDp4MommaU4rDePBe1gb1f3iH9kVlRqqhOLwU3ZMIvlYs/HhrTxYmG+cixTO/g3/rAPNghdJD6XTq7ulyxcxPIohbL01lXzUYU99LnY2bbaw+F4ttm6xZc72Tmy+NgOZMk4NHfRRwsTJkqrm+ocwaus5/JyvdOv157KNXs79IPUUdMkH9TiYuSSQ3wSLwMrtN8z+5qZ+MdfhV9x6rzqtleMXqOfws7B//bunXgXseGz/wnjx2fybwN5ILvJSvAlfdMovD8ysvbierPz4r4z4/U9qrX6dssXuXjze+D5/KsP8hjSa1YkYApg6hcZ9kEfFFnZZVZLr9lvisnSUJvZwa7rPIaESr/mYI8TRChMcjBlxmOOZRlBGL+/2hRZrkISdiIseSkpwfNv90gJoVQHAAA=',
    newsletterJid: '120363161518@newsletter', // Newsletter JID for menu forwarding
    updateZipUrl: 'https://github.com/dev-modder/Ladybug-Mini/archive/refs/heads/main.zip', // URL to latest code zip for .update command
    
    // Sticker Configuration
    packname: 'Ladybug Bot Mini',
    
    // Bot Behavior
    selfMode: false, // Private mode - only owner can use commands
    autoRead: true,
    autoTyping: true,
    autoBio: true,
    autoSticker: true,
    autoReact: true,
    autoReactMode: 'bot', // set bot or all via cmd
    autoDownload: true,
    
    // Group Settings Defaults
    defaultGroupSettings: {
      antilink: true,
      antilinkAction: 'delete', // 'delete', 'kick', 'warn'
      antitag: true,
      antitagAction: 'delete',
      antiall: true, // Owner only - blocks all messages from non-admins
      antiviewonce: true,
      antibot: true,
      anticall: true, // Anti-call feature
      antigroupmention: true, // Anti-group mention feature
      antigroupmentionAction: 'delete', // 'delete', 'kick'
      welcome: false,
      welcomeMessage: '╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @user 👋\n┃Member count: #memberCount\n┃𝚃𝙸𝙼𝙴: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Welcome to *@group*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\ngroupDesc\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ botName*',
      goodbye: false,
      goodbyeMessage: 'Goodbye @user 👋 We will never miss you!',
      antiSpam: true,
      antidelete: true,
      nsfw: true,
      detect: true,
      chatbot: true,
      autosticker: true // Auto-convert images/videos to stickers
    },
    
    // API Keys (add your own)
    apiKeys: {
      // Add API keys here if needed
      openai: '',
      deepai: '',
      remove_bg: ''
    },
    
    // Message Configuration
    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for bot owner!',
      adminOnly: '🛡️ This command is only for group admins!',
      groupOnly: '👥 This command can only be used in groups!',
      privateOnly: '💬 This command can only be used in private chat!',
      botAdminNeeded: '🤖 Bot needs to be admin to execute this command!',
      invalidCommand: '❓ Invalid command! Type .menu for help'
    },
    
    // Timezone
    timezone: 'Asia/Kolkata',
    
    // Limits
    maxWarnings: 3,
    
    // Social Links (optional)
    social: {
      github: 'https://github.com/mruniquehacker',
      instagram: 'https://instagram.com/yourusername',
      youtube: 'http://youtube.com/@mr_unique_hacker'
    }
};
  
