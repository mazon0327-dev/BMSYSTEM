const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'meta',
  description: 'Ask a question to the Meta Ai 5.0',
  role: 1,
  author: 'Mark Martinez and GeoDevz69',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();

    
    if (!prompt) {
      return sendMessage(senderId, {
        text: 'Hello! I am Meta Ai 5.0, how can I help you?'
      }, pageAccessToken);
    }

    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/okeyai?ask=${encodeURIComponent(prompt)}`;

    try {
      const response = await axios.get(apiUrl);
      const reply = response.data.response;

      if (reply) {
        
        const formattedResponse = `Meta Ai 5.0:\n\n${reply}`;
        
        
        const maxLength = 2000;

        
        if (formattedResponse.length > maxLength) {
          const chunks = [];
          let remainingText = formattedResponse;

          while (remainingText.length > 0) {
            chunks.push(remainingText.substring(0, maxLength));
            remainingText = remainingText.substring(maxLength);
          }

          
          for (const chunk of chunks) {
            await sendMessage(senderId, { text: chunk }, pageAccessToken);
          }
        } else {
          
          await sendMessage(senderId, { text: formattedResponse }, pageAccessToken);
        }
      } else {
        
        await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error calling Blackbox API:', error);

      
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
