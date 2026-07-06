const { login } = require('@neoaz07/nkxica');
const fs = require('fs');

async function test() {
    const cookies = fs.readFileSync('account.txt', 'utf8');
    const ig = await login(cookies);
    ig.listen((err, event) => {
        if (event) {
            console.log('Event received:', JSON.stringify(event, null, 2));
            process.exit(0);
        }
    });
}
// We can't really run this without human interaction or a message being sent.
// But we can check the library's typical output if we had documentation.
// Assuming event.messageReply is the structure based on other V2 bots.
