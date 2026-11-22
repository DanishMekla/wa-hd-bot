const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    // PAIRING CODE - Kalau belum link lagi
    if (!sock.authState.creds.registered) {
        const phoneNumber = '601125615941';
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log('====================================');
                console.log('PAIRING CODE KAU: ' + code);
                console.log('Pergi WhatsApp > Linked Devices > Link a device > Link with phone number');
                console.log('Masukkan code ni: ' + code);
                console.log('====================================');
            } catch (e) {
                console.log('Gagal minta pairing code:', e.message);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log('BOT DAH ONLINE! - 01125615941');
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnect:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        }
    });

    // HD VIDEO - Bila orang hantar video, bot hantar balik HD
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            const from = msg.key.remoteJid;

            const videoMsg = msg.message.videoMessage;
            if (videoMsg) {
                console.log('Dapat video, tengah download...');
                const stream = await downloadContentFromMessage(videoMsg, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                console.log('Download siap, hantar balik HD...');
                await sock.sendMessage(from, {
                    video: buffer,
                    caption: 'Ni video HD kau ✅',
                    gifPlayback: false
                }, { quoted: msg });
            }
        } catch (e) {
            console.log('Error messages:', e.message);
        }
    });
}

startBot();
