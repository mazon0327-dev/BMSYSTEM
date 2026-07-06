const axios = require("axios");
const { sendMessage } = require('../handles/message');

module.exports = {
  name: "tiksearch",
  description: "Search for TikTok videos",
  role: 1,
  author: "French Clarence Mangigo",

  async execute(senderId, args, pageAccessToken) {
    try {
      const searchQuery = args.join(" ");
      if (!searchQuery) {
        return sendMessage(senderId, { text: "Usage: tiksearch <search text>" }, pageAccessToken);
      }

      const response = await axios.get(`https://zen-api.gleeze.com/api/tiktok?query=${encodeURIComponent(searchQuery)}`);
      const videoData = response.data;

      if (!videoData || !videoData.no_watermark) {
        return sendMessage(senderId, { text: "No video found for the given search query." }, pageAccessToken);
      }

      const videoUrl = videoData.no_watermark;

      const message = `📹 Tiksearch Result:\n\n👤 Creator: ${videoData.creator}\n\n📝 Title: ${videoData.title}`;

      // Send text message
      await sendMessage(senderId, { text: message }, pageAccessToken);

      // Send video
      await sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: videoUrl,
            is_reusable: true
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Error:', error);
      sendMessage(senderId, { text: "An error occurred while processing the request." }, pageAccessToken);
    }
  }
};
