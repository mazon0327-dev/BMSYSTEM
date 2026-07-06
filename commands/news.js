const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'news',
  description: 'Fetch the latest news for a query',
  role: 1,
  author: 'GeoDevz69',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ').trim();

    if (!query) {
      return sendMessage(senderId, { text: 'Hello, I\'m Arlene News. How can I assist you today?' }, pageAccessToken);
    }

    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/news?q=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(apiUrl);
      const apiResponse = response.data.response;

      let formattedResponse;

      // If API returns an array of objects with 'title' and 'link'
      if (Array.isArray(apiResponse) && apiResponse.length > 0 && apiResponse[0].link) {
        formattedResponse = '📰 Here are some news articles:\n\n';
        apiResponse.forEach((item, index) => {
          formattedResponse += `${index + 1}. ${item.title ? item.title : 'No title'}\n${item.link}\n\n`;
        });
      } else if (typeof apiResponse === 'string') {
        // If it's just a string response
        formattedResponse = `📰 ${apiResponse}`;
      } else {
        // Fallback error message
        formattedResponse = 'Sorry, there was an error processing your request.';
      }

      await sendResponseInChunks(senderId, formattedResponse, pageAccessToken);
    } catch (error) {
      console.error('Error calling News API:', error);
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
