const axios = require('axios');
const fs = require('fs');

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";

async function test() {
    const text = "hi";
    const lang = "en";
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;

    console.log("Testing URL:", url);
    try {
        const response = await axios({
            method: "get",
            url: url,
            responseType: "arraybuffer",
            headers: {
                "User-Agent": UA
            }
        });
        console.log("Status:", response.status);
        console.log("Data length:", response.data.length);
        fs.writeFileSync('test_tts.mp3', Buffer.from(response.data));
        console.log("File saved to test_tts.mp3");
    } catch (e) {
        console.error("Error status:", e.response ? e.response.status : 'N/A');
        console.error("Error data:", e.response ? e.response.data.toString() : e.message);
    }
}
test();
