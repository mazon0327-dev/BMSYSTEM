const axios = require("axios");
const { sendMessage } = require('../handles/message');

module.exports = {
  name: "yts",
  description: "Get download links for a YouTube video URL",
  role: 1,
  author: "GeoDevz69",

  async execute(senderId, args, pageAccessToken) {
    try {
      const videoUrl = args.join(" ");
      if (!videoUrl || !videoUrl.startsWith("http")) {
        return sendMessage(senderId, {
          text: "Usage: yts <YouTube video URL>"
        }, pageAccessToken);
      }

      // Fetch download links from the new API
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/yt-down?url=${encodeURIComponent(videoUrl)}`);
      const result = response.data;

      if (!result || !result.response) {
        return sendMessage(senderId, { text: "No video found or download links unavailable." }, pageAccessToken);
      }

      const { author, response: videoResponse } = result;
      const { title: title360, download_url: url360 } = videoResponse["360p"];
      const { title: title720, download_url: url720 } = videoResponse["720p"];

      const message = `📹 YouTube Download Links:\n\n` +
                      `📝 Author: ${author}\n` +
                      `🎬 Title (360p): ${title360}\n` +
                      `🔗 360p Download: ${url360}\n\n` +
                      `🎬 Title (720p): ${title720}\n` +
                      `🔗 720p Download: ${url720}`;

      // Send the details
      await sendMessage(senderId, { text: message }, pageAccessToken);

    } catch (error) {
      console.error('Error:', error.message);
      sendMessage(senderId, { text: "An error occurred while processing the request." }, pageAccessToken);
    }
  }
};
