const axios = require("axios");
const { sendMessage } = require('../handles/message');

module.exports = {
  name: "ytsearch",
  description: "Search for YouTube videos",
  role: 1,
  author: "GeoDevz69",

  async execute(senderId, args, pageAccessToken) {
    try {
      const searchQuery = args.join(" ");
      if (!searchQuery) {
        return sendMessage(senderId, { text: "Usage: tiksearch <search text>" }, pageAccessToken);
      }

      const response = await axios.get(`https://zen-api.gleeze.com/api/ytsearch?query=${encodeURIComponent(searchQuery)}`);
      const result = response.data;

      if (!result || !Array.isArray(result.data) || result.data.length === 0) {
        return sendMessage(senderId, { text: "No video found for the given search query." }, pageAccessToken);
      }

      const firstVideo = result.data[0]; // use the first search result

      const message = `📹 YouTube Search Result:\n\n` +
                      `📝 Title: ${firstVideo.title}\n` +
                      `⏱ Duration: ${firstVideo.duration}\n` +
                      `👁 Views: ${firstVideo.views}\n` +
                      `🔗 Link: ${firstVideo.url}`;

      // Send text message with video details
      await sendMessage(senderId, { text: message }, pageAccessToken);

      // Send video thumbnail
      if (firstVideo.imgSrc) {
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: {
              url: firstVideo.imgSrc,
              is_reusable: true
            }
          }
        }, pageAccessToken);
      }

    } catch (error) {
      console.error('Error:', error.message);
      sendMessage(senderId, { text: "An error occurred while processing the request." }, pageAccessToken);
    }
  }
};
