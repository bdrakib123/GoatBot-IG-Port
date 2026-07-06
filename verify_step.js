const fs = require('fs');

function verify() {
    const sayContent = fs.readFileSync('commands/say.js', 'utf-8');
    const botContent = fs.readFileSync('bot/InstagramBot.js', 'utf-8');

    if (sayContent.includes('os.tmpdir()') && sayContent.includes('translate.googleapis.com') && sayContent.includes('stream.name =')) {
        console.log("say.js: OK");
    } else {
        console.log("say.js: FAIL");
    }

    if (botContent.includes('item.path ? path.extname(item.path)')) {
        console.log("InstagramBot.js: OK");
    } else {
        console.log("InstagramBot.js: FAIL");
    }
}
verify();
