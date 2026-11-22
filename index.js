const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const fs = require('fs')

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, printQRInTerminal: true })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect, qr } = u
    if (qr) qrcode.generate(qr, { small: true })
    if (connection === 'open') console.log('BOT DAH CONNECT!')
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) start()
  })
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return
    const from = msg.key.remoteJid
    const video = msg.message.videoMessage
    if (video) {
      await sock.sendMessage(from, { text: 'Video diterima! Tunggu jap, saya buat HD...' })
      const stream = await downloadContentFromMessage(video, 'video')
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      fs.writeFileSync('video-hd.mp4', buffer)
      await sock.sendMessage(from, { document: fs.readFileSync('video-hd.mp4'), fileName: 'video-HD.mp4', mimetype: 'video/mp4', caption: 'Ni versi HD, save pastu post status!' })
    } else {
      await sock.sendMessage(from, { text: 'Hantar video kat saya, saya hantar balik HD untuk status!' })
    }
  })
}
start()
