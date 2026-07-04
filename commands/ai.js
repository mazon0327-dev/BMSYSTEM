const axios = require('axios');
const crypto = require('crypto');

// Font mapping for bold text conversion
const fontMapping = {
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
  0: "𝟬", 1: "𝟭", 2: "𝟮", 3: "𝟯", 4: "𝟰", 5: "𝟱", 6: "𝟲", 7: "𝟳", 8: "𝟴", 9: "𝟵"
};

const HEADER = '\n';
const FOOTER = '';
const MAX_CHUNK = 1900;

function chunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}

function convertToBold(text) {
  return text.replace(/(?:\*\*(.*?)\*\*|## (.*?)|### (.*?))/g, (match, boldText, h2Text, h3Text) => {
    const targetText = boldText || h2Text || h3Text;
    return [...targetText].map(char => fontMapping[char] || char).join('');
  });
}

function agent() {
  const chromeVersion = `${Math.floor(Math.random() * 6) + 130}.0.0.0`;
  const oprVersion = `${Math.floor(Math.random() * 5) + 86}.0.0.0`;
  return `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36 OPR/${oprVersion}`;
}

function splitMessage(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_CHUNK) {
    chunks.push(text.slice(i, i + MAX_CHUNK));
  }
  return chunks;
}

async function sendChunks(senderId, text, token) {
  const chunks = splitMessage(text);
  for (let i = 0; i < chunks.length; i++) {
    let msg = chunks[i];
    if (i === 0) msg = HEADER + msg;
    if (i === chunks.length - 1) msg += FOOTER;
    await sendMessage(senderId, { text: msg }, token);
  }
}

module.exports = {
  name: 'ai',
  aliases: ["Aria", "aria"],
  description: 'Ask a question to Aria AI',
  author: 'Cliff (rest api)',
  usage: '{p}{n} Ask question',

  async execute(senderId, args, token, sendMessage) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      sendMessage(senderId, { text: '𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚚𝚞𝚎𝚜𝚝𝚒𝚘𝚗 𝚏𝚒𝚛𝚜𝚝' }, token);
      return;
    }

    try {
      // Send thinking message
      await sendMessage(senderId, { text: '' }, token);

      // Get token from Opera API
      const t = new URLSearchParams({
        client_id: 'ofa',
        grant_type: 'refresh_token',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI5ODY3MTgyMTgiLCJjaWQiOiJvZmEiLCJ2ZXIiOiIyIiwiaWF0IjoxNzM1NTQ0MzAzLCJqdGkiOiJiOGRoV0Z4TTc3MTczNTU0NDMwMyJ9.EAJrJflcetOzXUdCfQve306QTe_h3Zac76XxjS5Xg1c',
        scope: 'shodan:aria user:read'
      }).toString();

      const tResponse = await axios.request({
        method: 'POST',
        url: 'https://oauth2.opera-api.com/oauth2/v1/token/',
        headers: {
          'User-Agent': agent(),
          'Content-Type': 'application/x-www-form-urlencoded',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Dest': 'empty',
          'origin': 'opera-aria://ui',
        },
        data: t,
      });

      const accesstoken = tResponse.data.access_token;
      const k = crypto.randomBytes(32).toString('base64');

      // Send request to Aria AI
      const rData = JSON.stringify({
        query: prompt,
        convertational_id: senderId,
        stream: false,
        linkify: true,
        linkify_version: 3,
        sia: true,
        supported_commands: [],
        media_attachments: [],
        encryption: { key: k },
      });

      const r = await axios.request({
        method: 'POST',
        url: 'https://composer.opera-api.com/api/v1/a-chat',
        headers: {
          'User-Agent': agent(),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          authorization: `Bearer ${accesstoken}`,
          'x-opera-ui-language': 'en, tl',
          'accept-language': 'en-US, tl-PH;q=0.9, *;q=0',
          'sec-ch-ua': '"OperaMobile";v="86", ";Not A Brand";v="99", "Opera";v="115", "Chromium";v="130"',
          'sec-ch-ua-mobile': '?1',
          'x-opera-timezone': '+08:00',
          origin: 'opera-aria://ui',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          priority: 'u=1, i',
        },
        data: rData,
      });

      const response = r.data.message;

      if (response && response.trim()) {
        // Convert to bold and send in chunks with header/footer
        const boldText = convertToBold(response.trim());
        await sendChunks(senderId, boldText, token);
      } else {
        await sendMessage(senderId, { 
          text: 'U have reached your daily request limit. Please come back tomorrow.' 
        }, token);
      }

    } catch (err) {
      console.error(`[ai] Failed for sender ${senderId}:`, err.message);
      await sendMessage(senderId, { 
        text: 'U have reached your daily request limit. Please come back tomorrow.' 
      }, token);
    }
  }
};
