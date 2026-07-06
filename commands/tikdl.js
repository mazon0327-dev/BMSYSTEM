const axios = require("axios");
const { sendMessage } = require("../handles/message");

console.log("sendMessage function:", sendMessage);

module.exports = {
  name: "tikdl",
  description: "TikTok Downloader",
  role: 1,
  author: "GeoDevz69",

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(" ");

    if (!prompt) {
      return sendMessage(senderId, {
        text: `Usage: tikdl [ URL ]`
      }, pageAccessToken);
    }

    try {
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/ytdlv5?url=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);

      console.log("API response:", response.data);

      const { status, title, downloadUrls } = response.data;

      if (status !== "success" || !Array.isArray(downloadUrls) || downloadUrls.length === 0) {
        return sendMessage(senderId, {
          text: `No downloadable video found. Please try a different URL.`
        }, pageAccessToken);
      }

      const videoUrl = downloadUrls[0];

      await sendMessage(senderId, {
        text: `Here is your downloaded video: ${title}`
      }, pageAccessToken);

      await sendMessage(senderId, {
        attachment: {
          type: "video",
          payload: {
            url: videoUrl
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
