const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'shoti',
  description: 'Generate a random TikTok video.',
  author: 'Jerome',

  async execute(senderId, args, pageAccessToken) {
    try {
      const apiUrl = 'https://shoti.kenliejugarap.com/getvideo.php?apikey=shoti-5ba14cf02b7b8eb43e6c6ccf0739ada50ab5ca8325e5c41971080d5877a67d23753d10fa9e5cd51b61a6c98315221ad47adf3f51d740ea9f6982a56c1536e0ef010b7e8a02035f28f57914d064641785a12bc7024c';
      const response = await axios.get(apiUrl);

      if (response.data && response.data.videoDownloadLink) {
        const videoUrl = response.data.videoDownloadLink;

        // Send video attachment only
        const videoMessage = {
          attachment: {
            type: 'video',
            payload: {
              url: videoUrl,
            },
          },
        };
        await sendMessage(senderId, videoMessage, pageAccessToken);
      } else {
        await sendMessage(senderId, {
          text: '⚠️ No video found. Please try again later.',
        }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching TikTok video:', error.message);
      await sendMessage(senderId, {
        text: '⚠️ Sorry, there was an error generating the video. Please try again later.',
      }, pageAccessToken);
    }
  },
};
