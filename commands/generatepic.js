const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'generatepic',
  description: 'Fetch images from Pinterest based on a query',
  author: 'GeoDevz69',
  role: 1,

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ').trim();

    if (!query) {
      await sendMessage(senderId, { text: 'Please provide a search query for Pinterest images.' }, pageAccessToken);
      return;
    }

    try {
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/image?search=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const images = response.data.images;

      if (images && images.length > 0) {
        // Limit to 20 images if available
        const limitedImages = images.slice(0, 20);
        for (const imageUrl of limitedImages) {
          const imageMessage = {
            attachment: {
              type: 'image',
              payload: {
                url: imageUrl,
                is_reusable: true
              }
            }
          };
          await sendMessage(senderId, imageMessage, pageAccessToken);
        }
      } else {
        await sendMessage(senderId, { text: 'No images found for your query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching Pinterest images:', error.message || error);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
