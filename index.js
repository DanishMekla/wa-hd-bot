const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const express = require('express');
const app = express();
let qrImage = 'Belum ada QR, tunggu 10 saat lepas tu refresh';
app.get('/', (req, res) => { res.send(`<h1>Scan QR ni dengan WhatsApp kau</h1><img src="/qr" style="width:300px"><br><a href="/">Refresh</a>`); });
app.get('/qr', (req, res) => { res.send(`<img src="${qrImage}" style="width:300px">`); });
app.listen(process.env.PORT || 3000, () => console.log('Web hidup'));

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({ logger: pino({ level: 'silent' }), auth: state, printQRInTerminal: false });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        if (qr) { qrImage = await QRCode.toDataURL(qr); console.log('=== QR BARU DAH SIAP, BUKA LINK RAILWAY ==='); }
        if (connection === 'open') console.log('=== DAH CONNECT! BOT HIDUP! ===');
        if (connection === 'close') console.log('=== CLOSE, TUNGGU QR BARU ===');
    });
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (text.toLowerCase() === 'hi') await sock.sendMessage(msg.key.remoteJid, { text: 'Hi! Bot dah hidup!' });
    });
}
start();
