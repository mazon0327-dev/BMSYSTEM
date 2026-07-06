const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'paraphrase',
  description: 'Paraphrase your text to make it unique',
  author: 'Clarence',
  role: 1,
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/paraphrase?text=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);
      const text = response.data.response;


      await sendResponseInChunks(senderId, text, pageAccessToken, sendMessage);
    } catch (error) {
      console.error('Error calling Paraphrase API:', error);
      sendMessage(senderId, { text: 'An error occurred while paraphrasing your text.' }, pageAccessToken);
    }
  }
};

async function sendResponseInChunks(senderId, text, pageAccessToken, sendMessage) {
  const maxMessageLength = 2000;
  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  let chunk = '';
  const words = message.split(' ');

  for (const word of words) {
    if ((chunk + word).length > chunkSize) {
      chunks.push(chunk.trim());
      chunk = '';
    }
    chunk += `${word} `;
  }

  if (chunk) {
    chunks.push(chunk.trim());
  }

  return chunks;
}
