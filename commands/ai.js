const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ai',
  description: 'Chat with AI',
  usage: 'ai [message]',
  author: 'coffee',

  async execute(senderId, args, token) {
    const prompt = args.join(' ').trim() || 'Hello';

    try {
      // Tama na ang SimSimi API gamit ang documentation
      const response = await axios.get('https://simsimi.ooguy.com/sim', {
        params: {
          query: prompt,
          apikey: '58b32bc20a9f46f98dc3ac182355aa1011017708',
          safe: true // Enable safety filter (default: true)
        },
        timeout: 15000
      });

      console.log('[ai] Response:', response.data);

      // Extract ang "respond" field from JSON response
      let aiResponse = '';
      
      if (response.data?.respond) {
        aiResponse = response.data.respond; // ✅ Eto ang tamang field!
      } else if (typeof response.data === 'string') {
        aiResponse = response.data;
      } else {
        aiResponse = JSON.stringify(response.data);
      }

      if (!aiResponse || aiResponse.length < 1) {
        throw new Error('Empty response from API');
      }

      const formattedResponse = makeBold(aiResponse.trim());
      await sendChunks(senderId, formattedResponse, token);

    } catch (error) {
      let errorMsg = '❌ Something went wrong. Please try again.';
      
      if (error.response) {
        console.error('[ai] API Error:', error.response.status, error.response.data);
        
        if (error.response.status === 404) {
          errorMsg = '❌ API endpoint not found. Please check the URL.';
        } else if (error.response.status === 403) {
          errorMsg = '❌ Invalid API key or forbidden access.';
        } else if (error.response.status === 400) {
          errorMsg = '❌ Bad request. Please check your message.';
        } else {
          errorMsg = `❌ API Error ${error.response.status}`;
        }
      } else if (error.request) {
        console.error('[ai] No response from API');
        errorMsg = '❌ No response from API. Please check connection.';
      } else {
        console.error('[ai] Error:', error.message);
        errorMsg = `❌ Error: ${error.message}`;
      }

      await sendMessage(senderId, {
        text: HEADER + errorMsg + FOOTER
      }, token);
    }
  }
};

const MAX_CHUNK = 1900;

const HEADER = '💬 | C0D3X ASSISTANT\n・────────────・\n';
const FOOTER = '\n・──── >ᴗ< ─────・';

function makeBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, (_, word) =>
    [...word].map(char => {
      if (char >= 'a' && char <= 'z') return String.fromCharCode(char.charCodeAt(0) + 0x1D41A - 97);
      if (char >= 'A' && char <= 'Z') return String.fromCharCode(char.charCodeAt(0) + 0x1D400 - 65);
      if (char >= '0' && char <= '9') return String.fromCharCode(char.charCodeAt(0) + 0x1D7CE - 48);
      return char;
    }).join('')
  );
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
