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

    if (!sock.authState.creds.registered) {
        console.log('=== BOT START, TUNGGU CODE ===');
        await new Promise(r => setTimeout(r, 3000));
        try {
            const code = await sock.requestPairingCode('601125615941');
            console.log('====================');
            console.log('PAIRING CODE KAU: ' + code);
            console.log('====================');
            console.log('CODE NI HIDUP LAMA, JANGAN RISAU, MASUKKAN PELAN-PELAN');
        } catch (e) {
            console.log('Gagal minta code: ' + e.message);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('=== DAH CONNECT! BOT HIDUP! ===');
        }
        if (connection === 'close') {
            console.log('=== CONNECTION CLOSE, TAPI JANGAN RESTART, TUNGGU ===');
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
}
start();
