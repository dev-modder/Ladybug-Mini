/**
 * Menu Command â ð» HACKER TERMINAL Design ð»  V(5)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  â¦ Code/matrix aesthetic â monospace blocks, terminal style
 *  â¦ Android â interactive buttons + list
 *  â¦ iOS     â clean plain-text fallback
 *  â¦ Indonesian greetings
 *  â¦ Version: V(5)
 */

'use strict';

const config  = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons, sendList } = require('gifted-btns');
const fs   = require('fs');
const path = require('path');

function detectPlatform(msg) {
  try {
    const keyId=msg?.key?.id||'';
    if(/^[A-F0-9]{16}$/.test(keyId)) return 'ios';
    if(msg?.message?.interactiveResponseMessage) return 'android';
    return 'android';
  } catch { return 'android'; }
}

function formatUptime(sec) {
  const d=Math.floor(sec/86400),h=Math.floor((sec%86400)/3600),
        m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);
  const p=[];
  if(d)p.push(`${d}h`);if(h)p.push(`${h}j`);
  if(m)p.push(`${m}m`);if(s||!p.length)p.push(`${s}d`);
  return p.join(' ');
}

function getNow() {
  return new Date().toLocaleString('id-ID',{
    timeZone:config.timezone||'Africa/Harare', hour12:false,
    weekday:'long', year:'numeric', month:'long', day:'numeric',
    hour:'2-digit', minute:'2-digit',
  });
}

function getRam() { return `${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)} MB`; }

function getGreeting() {
  const h=parseInt(new Date().toLocaleString('id-ID',{ timeZone:config.timezone||'Africa/Harare', hour:'2-digit', hour12:false }),10);
  if(h>=4&&h<11)  return 'Selamat Pagi';
  if(h>=11&&h<15) return 'Selamat Siang';
  if(h>=15&&h<18) return 'Selamat Sore';
  return 'Selamat Malam';
}

const CAT = {
  general:     { icon: '[GEN]',  label: 'UMUM'              },
  ai:          { icon: '[AI_]',  label: 'AI & KECERDASAN'   },
  group:       { icon: '[GRP]',  label: 'MANAJEMEN GRUP'    },
  admin:       { icon: '[ADM]',  label: 'ALAT ADMIN'        },
  owner:       { icon: '[OWN]',  label: 'KHUSUS OWNER'      },
  media:       { icon: '[MED]',  label: 'MEDIA & UNDUHAN'   },
  fun:         { icon: '[FUN]',  label: 'FUN & PERMAINAN'   },
  utility:     { icon: '[UTL]',  label: 'ALAT UTILITAS'     },
  anime:       { icon: '[ANI]',  label: 'ANIME'             },
  textmaker:   { icon: '[TXT]',  label: 'PEMBUAT TEKS'      },
  statustools: { icon: '[STS]',  label: 'STATUS VIEW & LIKE'},
};

const ORDER = ['general','ai','media','fun','utility','group','admin','owner','anime','textmaker','statustools'];

function buildSection(key, cmds) {
  if (!cmds?.length) return '';
  const { icon, label } = CAT[key] ?? { icon:'[???]', label:key.toUpperCase() };
  const names = cmds.map(c=>`${config.prefix}${c.name}`);
  const COL = 20;
  const rows = [];
  for (let i=0;i<names.length;i+=2) {
    rows.push(`  >  ${names[i].padEnd(COL)}${names[i+1]??''}`);
  }
  return [
    `  +--[ ${icon} ${label}  // ${cmds.length} cmd ]`,
    ...rows,
    `  +${'â'.repeat(40)}`,
    ''
  ].join('\n');
}

function buildLoadingMsg(sender) {
  return (
    `\`\`\`\n` +
    `[LADYBUG_BOT] v5.0.0 â BOOT SEQUENCE\n` +
    `> Initializing system...\n` +
    `> Loading modules...\n` +
    `> Auth: @${sender} [OK]\n` +
    `> Fetching commands...\n` +
    `> Building sections...\n` +
    `> Rendering output...\n` +
    `> STATUS: READY\n` +
    `\`\`\`\n` +
    `_â¡ Didukung oleh LadybugNodes_`
  );
}

function buildMenuText(commands, categories, sender) {
  const ownerName=Array.isArray(config.ownerName)?config.ownerName[0]:config.ownerName;
  const uptime=formatUptime(Math.floor(process.uptime()));
  const now=getNow(), ram=getRam(), totalCmds=commands.size;
  const greeting=getGreeting();
  const pid=Math.floor(Math.random()*9000)+1000;

  let txt = `\n`;
  txt += `/*ââââââââââââââââââââââââââââââââââââââââââ*/\n`;
  txt += `/*  ð»  LADYBUG BOT MINI â TERMINAL V(5)   */\n`;
  txt += `/*      by Dev-Ntando  //  LadybugNodes     */\n`;
  txt += `/*ââââââââââââââââââââââââââââââââââââââââââ*/\n`;
  txt += `\n`;
  txt += `> ${greeting}, @${sender}!\n`;
  txt += `> Bot aktif dan siap dieksekusi. ð»\n`;
  txt += `> Ketik perintah dengan awalan: *${config.prefix}*\n`;
  txt += `\n`;
  txt += `> ${now}\n`;
  txt += `\n`;
  txt += `/*ââââââââ SYSTEM INFO âââââââââââââââââââââ*/\n`;
  txt += `\n`;
  txt += `  PID      : ${pid}\n`;
  txt += `  UPTIME   : ${uptime}\n`;
  txt += `  MEMORY   : ${ram}\n`;
  txt += `  COMMANDS : ${totalCmds} loaded\n`;
  txt += `  PREFIX   : ${config.prefix}\n`;
  txt += `  OWNER    : ${ownerName}\n`;
  txt += `  HOST     : LadybugNodes\n`;
  txt += `  STATUS   : [ONLINE] â\n`;
  txt += `  VERSION  : V(5) Hacker Terminal\n`;
  txt += `\n`;
  txt += `/*ââââââââââââââââââââââââââââââââââââââââââ*/\n`;
  txt += `\n`;
  txt += `/*ââââââââ COMMAND INDEX âââââââââââââââââââ*/\n\n`;

  for (const key of ORDER) txt += buildSection(key, categories[key]);
  for (const [key,cmds] of Object.entries(categories)) {
    if(!ORDER.includes(key)) txt += buildSection(key, cmds);
  }

  txt += `/*ââââââââ QUICK HELP ââââââââââââââââââââââ*/\n`;
  txt += `\n`;
  txt += `  $ *${config.prefix}help [cmd]*         // info perintah\n`;
  txt += `  $ *${config.prefix}ping*               // cek latensi\n`;
  txt += `  $ *${config.prefix}autostatusview on*  // auto-lihat status\n`;
  txt += `  $ *${config.prefix}autostatuslike on*  // auto-like status\n`;
  txt += `\n`;
  txt += `/*ââââââââââââââââââââââââââââââââââââââââââ*/\n`;
  txt += `  // Dibuat oleh Mr Ntando Ofc\n`;
  txt += `  // Dibuat dengan â¤ï¸ di Zimbabwe ð¿ð¼\n`;
  txt += `  // Ladybug Terminal V(5) â Hack The Planet\n`;
  txt += `/*ââââââââââââââââââââââââââââââââââââââââââ*/`;
  return txt;
}

function buildListSections(categories) {
  const sections=[];
  const renderKey=[...ORDER,...Object.keys(categories).filter(k=>!ORDER.includes(k))];
  for (const key of renderKey) {
    const cmds=categories[key]; if(!cmds?.length) continue;
    const { icon, label }=CAT[key]??{ icon:'[???]', label:key.toUpperCase() };
    sections.push({ title:`${icon} ${label}`, rows:cmds.map(cmd=>({
      title:`${config.prefix}${cmd.name}`, description:cmd.description||'', id:`cmd_${cmd.name}`,
    }))});
  }
  return sections;
}

function buildHeaderText(commands, sender) {
  const greeting=getGreeting();
  const pid=Math.floor(Math.random()*9000)+1000;
  return (
    `ð» *LADYBUG TERMINAL V(5)*\n` +
    `/*ââââââââââââââââââââââââââââ*/\n` +
    `> ${greeting}, @${sender}!\n` +
    `> System boot complete â\n` +
    `/*ââââââââââââââââââââââââââââ*/\n` +
    `  PID      : ${pid}\n` +
    `  UPTIME   : ${formatUptime(Math.floor(process.uptime()))}\n` +
    `  MEMORY   : ${getRam()}\n` +
    `  COMMANDS : ${commands.size} loaded\n` +
    `  PREFIX   : ${config.prefix}\n` +
    `  HOST     : LadybugNodes\n` +
    `/*ââââââââââââââââââââââââââââ*/\n` +
    `_Ketuk modul di bawah ð_`
  );
}

const BUTTONS = [
  { name:'quick_reply', buttonParamsJson:JSON.stringify({ display_text:'[GEN] Umum',       id:'cat_general'     }) },
  { name:'quick_reply', buttonParamsJson:JSON.stringify({ display_text:'[MED] Media',      id:'cat_media'       }) },
  { name:'quick_reply', buttonParamsJson:JSON.stringify({ display_text:'[AI_] AI',         id:'cat_ai'          }) },
  { name:'quick_reply', buttonParamsJson:JSON.stringify({ display_text:'[FUN] Fun',        id:'cat_fun'         }) },
  { name:'quick_reply', buttonParamsJson:JSON.stringify({ display_text:'[STS] Status',     id:'cat_statustools' }) },
  { name:'cta_url',     buttonParamsJson:JSON.stringify({ display_text:'ðº YouTube', url:(config.social?.youtube)||`https://wa.me/${(config.newsletterJid||'120363161518@newsletter').split('@')[0]}` }) },
  { name:'cta_url',     buttonParamsJson:JSON.stringify({ display_text:'ð» GitHub',  url:(config.social?.github)  ||`https://wa.me/${(config.newsletterJid||'120363161518@newsletter').split('@')[0]}` }) },
];

async function sendAndroidMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath=path.join(__dirname,'../../utils/bot_image.jpg');
  const hasImage=fs.existsSync(imagePath);
  const greeting=getGreeting();
  try {
    if(hasImage) await sock.sendMessage(extra.from,{
      image:fs.readFileSync(imagePath), mentions:[extra.sender],
      caption:`ð» *Ladybug Terminal V(5)* â by Dev-Ntando\n> _${greeting}, @${sender}. System ready._ â`,
      contextInfo:{ forwardingScore:1, isForwarded:true,
        forwardedNewsletterMessageInfo:{ newsletterJid:config.newsletterJid||'120363161518@newsletter', newsletterName:config.botName, serverMessageId:-1 }},
    },{ quoted:msg });

    await sendList(sock, extra.from, {
      title:'ð» Ladybug Terminal V(5)', text:buildHeaderText(commands,sender),
      footer:`> // Run by ${config.botName}`, buttonText:'> ls commands',
      sections:buildListSections(categories), mentions:[extra.sender],
    },{ quoted:hasImage?undefined:msg });

    await sendButtons(sock, extra.from, {
      title:'', footer:`> *Terminal V(5)* Â· LadybugNodes`,
      text:
        `ð» *Module Selector*\n` +
        `[GEN] [MED] [AI_] [FUN] [STS]\n\n` +
        `  $ *${config.prefix}help [cmd]*         // info\n` +
        `  $ *${config.prefix}autostatusview on*  // auto-lihat\n` +
        `  $ *${config.prefix}autostatuslike on*  // auto-like`,
      buttons:BUTTONS,
    },{ quoted:undefined });
  } catch(err) {
    console.warn('[Menu Terminal] Fallback:',err.message);
    await sendPlainMenu(sock,msg,extra,commands,categories,sender);
  }
}

async function sendPlainMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath=path.join(__dirname,'../../utils/bot_image.jpg');
  const hasImage=fs.existsSync(imagePath);
  const menuText=buildMenuText(commands,categories,sender);
  const payload=hasImage
    ?{ image:fs.readFileSync(imagePath), caption:menuText, mentions:[extra.sender],
       contextInfo:{ forwardingScore:1, isForwarded:true,
         forwardedNewsletterMessageInfo:{ newsletterJid:config.newsletterJid||'120363161518@newsletter', newsletterName:config.botName, serverMessageId:-1 }}}
    :{ text:menuText, mentions:[extra.sender] };
  await sock.sendMessage(extra.from, payload, { quoted:msg });
}

module.exports = {
  name:'menu', aliases:['help','start','cmds','commands'],
  description:'Tampilkan semua perintah bot', usage:'.menu', category:'general',

  async execute(sock, msg, args, extra) {
    try {
      const sender=extra.sender.split('@')[0];
      const platform=detectPlatform(msg);
      const commands=loadCommands();
      const categories={};
      commands.forEach((cmd,name)=>{ if(cmd.name===name){ const cat=(cmd.category||'other').toLowerCase(); if(!categories[cat])categories[cat]=[]; categories[cat].push(cmd); }});

      let loadMsg;
      try { loadMsg=await sock.sendMessage(extra.from,{ text:buildLoadingMsg(sender), mentions:[extra.sender] },{ quoted:msg }); } catch(_){}
      await new Promise(r=>setTimeout(r,1200));
      if(loadMsg?.key){ try{ await sock.sendMessage(extra.from,{ delete:loadMsg.key }); }catch(_){} }

      if(platform==='ios') await sendPlainMenu(sock,msg,extra,commands,categories,sender);
      else                  await sendAndroidMenu(sock,msg,extra,commands,categories,sender);
    } catch(err) {
      console.error('[Menu Terminal V5]',err);
      await extra.reply('â Gagal memuat menu. Coba lagi.');
    }
  },
};
