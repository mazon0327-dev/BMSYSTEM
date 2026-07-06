const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'assistant',
  description: 'Ask a question to the Mixtral AI',
  role: 1,
  author: 'GeoDevz69',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ').trim();
    
    if (!query) {
      return sendMessage(senderId, { text: 'Hello I\'m Mixtral AI, how can I assist you today?' }, pageAccessToken);
    }

    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/assistant?chat=${encodeURIComponent(query)}`;


    try {
      const response = await axios.get(apiUrl);
      const urlresponse = response.data.response;
      
      if (urlresponse) { 
        const formattedResponse = `🧑‍💻 RESEARCHERS AI:\n\n${urlresponse}`;
        await sendResponseInChunks(senderId, formattedResponse, pageAccessToken);
      } else {
        await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error calling Mixtral API:', error);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

async function sendResponseInChunks(senderId, text, pageAccessToken) {
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
