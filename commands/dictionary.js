const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'dictionary',
  description: 'Search words dictionary',
  author: 'French Clarence Mangigo',
  role: 1,

  async execute(senderId, args, pageAccessToken) {
    const input = args.join(' ').trim();

    if (!input) {
      await sendMessage(senderId, { text: 'Please provide a word to search for.' }, pageAccessToken);
      return;
    }

    try {
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(input)}`);
      const data = response.data[0];
      
      const phonetics = data.phonetics
        .map(item => item.text ? `\n    /${item.text}/` : "")
        .join('');

      const meanings = data.meanings
        .map(item => {
          const definition = item.definitions[0]?.definition;
          const example = item.definitions[0]?.example 
            ? `\n*example:\n "${item.definitions[0].example.charAt(0).toUpperCase() + item.definitions[0].example.slice(1)}"`
            : "";
          return `\n• ${item.partOfSpeech}\n ${definition ? definition.charAt(0).toUpperCase() + definition.slice(1) : "Definition not available"}${example}`;
        })
        .join('');

      const msg = `❰ ❝ ${data.word} ❞ ❱${phonetics}${meanings}`;
      await sendMessage(senderId, { text: msg }, pageAccessToken);
    } catch (error) {
      if (error.response?.status === 404) {
        await sendMessage(senderId, { text: `No definitions found for '${input}'.` }, pageAccessToken);
      } else {
        console.error('Error fetching definition:', error);
        await sendMessage(senderId, { text: 'An error occurred while fetching the definition. Please try again later.' }, pageAccessToken);
      }
    }
  }
};
                                               
