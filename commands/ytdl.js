const axios = require("axios");
const { sendMessage } = require("../handles/message");

console.log("sendMessage function:", sendMessage);

module.exports = {
  name: "ytdl",
  description: "YouTube Video Downloader (using new API endpoint)",
  role: 1,
  author: "GeoDevz69",

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(" ");

    if (!prompt) {
      return sendMessage(senderId, {
        text: `Usage: ytdl [ YouTube Video Downloader ]`
      }, pageAccessToken);
    }

    try {
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/ytdlv3?url=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);

      console.log("API response:", response.data);

      const { success, download_url } = response.data;

      if (!success || !download_url) {
        return sendMessage(senderId, {
          text: `No downloadable video found. Please try a different video URL.`
        }, pageAccessToken);
      }

      await sendMessage(senderId, {
        text: `Here is your downloaded video link:`
      }, pageAccessToken);

      await sendMessage(senderId, {
        attachment: {
          type: "video",
          payload: {
            url: download_url
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error("Error occurred:", error.message);
      sendMessage(senderId, {
        text: `An error occurred while processing your request. Please try again later.`
      }, pageAccessToken);
    }
  }
};
