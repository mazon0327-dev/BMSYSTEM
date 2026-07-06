const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'gmage',
  description: 'Generate an image based on a prompt.',
  role: 1,
  author: 'Mark and GeoDevz69',
  
  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: 'Please provide a prompt.\n\nUsage:\nExample: gen cat or dog'
      }, pageAccessToken);
      return;
    }

    const prompt = args.join(' ');
    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/image?search=${encodeURIComponent(prompt)}`;
    
    try {
      const response = await axios.get(apiUrl);
      const images = response.data.images;

      if (!images || images.length === 0) {
        await sendMessage(senderId, {
          text: 'No images were returned. Please try a different prompt.'
        }, pageAccessToken);
        return;
      }

      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: images[0]  // Sends the first image
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Error generating image:', error.message || error);
      await sendMessage(senderId, {
        text: 'An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
