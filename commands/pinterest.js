const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'pinterest',
  description: 'Search Pinterest for images.',
  usage: '-pinterest prompt -number',
  author: 'joncll',

  async execute(senderId, args, pageAccessToken) {
    // Ensure args is defined and is an array, default to an empty string if not
    if (!args || !Array.isArray(args) || args.length === 0) {
      await sendMessage(senderId, { text: 'Please provide a search query.' }, pageAccessToken);
      return;
    }

    // Handle the case where user provides a search query and optional number of images
    const match = args.join(' ').match(/(.+)-(\d+)$/);
    const searchQuery = match ? match[1].trim() : args.join(' ');
    let imageCount = match ? parseInt(match[2], 10) : 5;

    // Ensure the user-requested count is within 1 to 20
    imageCount = Math.max(1, Math.min(imageCount, 20));

    try {
      // Fetch the images from the new API endpoint
      const { data } = await axios.get(`https://ccprojectapis.ddns.net/api/pin?title=${encodeURIComponent(searchQuery)}&count=${imageCount}`);

      // Check if data was returned and has images
      if (data && data.count > 0 && Array.isArray(data.data) && data.data.length > 0) {
        const selectedImages = data.data.slice(0, imageCount);

        // Send each image in a separate message
        for (const url of selectedImages) {
          const attachment = {
            type: 'image',
            payload: { url }
          };
          await sendMessage(senderId, { attachment }, pageAccessToken);
        }
      } else {
        await sendMessage(senderId, { text: `No images found for "${searchQuery}".` }, pageAccessToken);
      }

    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Error: Could not fetch images.' }, pageAccessToken);
    }
  }
};
