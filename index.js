const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
    });
    sock.ev.on('creds.update', saveCreds);

    async function mintaCode() {
        await new Promise(r => setTimeout(r, 3000));
        try {
            const code = await sock.requestPairingCode('601125615941');
            console.log('====================');
            console.log('PAIRING CODE KAU: ' + code);
            console.log('COPY PASTE JE, JANGAN TAIP SENDIRI. 1 tu nombor SATU, bukan I');
            console.log('====================');
        } catch (e) {
            console.log('Gagal minta code: ' + e.message);
        }
    }

    if (!sock.authState.creds.registered) {
        await mintaCode();
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('=== DAH CONNECT! BOT HIDUP! ===');
        }
        if (connection === 'close') {
            console.log('=== CONNECTION CLOSE, MINTA CODE BARU DALAM 5 SAAT ===');
            setTimeout(mintaCode, 5000);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const from = msg.key.remoteJid;
        if (text.toLowerCase() === 'hi') {
            await sock.sendMessage(from, { text: 'Hi! Bot dah hidup!' });
        }
    });

    // Bagi bot tak crash
    setInterval(() => {}, 10000);
}
start();
