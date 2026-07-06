const axios = require("axios");
const { sendMessage } = require("../handles/message");

console.log("sendMessage function:", sendMessage);

module.exports = {
  name: "fbdl",
  description: "Facebook Video Downloader",
  role: 1,
  author: "GeoDevz69",

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(" ");

    if (!prompt) {
      return sendMessage(senderId, {
        text: `Usage: fbdl [ Facebook Video URL ]`
      }, pageAccessToken);
    }

    try {
      const apiUrl = `https://zen-api.gleeze.com/api/fbdl?url=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);

      console.log("API response:", response.data);

      const { creator, result } = response.data;

      if (!result || typeof result !== "string") {
        return sendMessage(senderId, {
          text: `No downloadable video found. Please try a different Facebook video URL.`
        }, pageAccessToken);
      }

      await sendMessage(senderId, {
        text: `Here is your downloaded Facebook video by ${creator || "unknown creator"}:`
      }, pageAccessToken);

      await sendMessage(senderId, {
        attachment: {
          type: "video",
          payload: {
            url: result
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
