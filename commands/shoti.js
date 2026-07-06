const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: "shoti",
  description: "Send a random shoti video",
  author: "Mark and GeoDevz69",
  //yeyy working sya

  async execute(senderId, args, pageAccessToken) {
    try {
      const response = await axios.get('https://shotis.vercel.app');
      const { playUrl, title } = response.data;

      await sendMessage(senderId, {
        text: `🌸 title: ${title}\n🗯️\n\n🧛 Modder: GeoDevz69`
      }, pageAccessToken);

      await sendMessage(senderId, {
        attachment: {
          type: "video",
          payload: {
            url: playUrl
          }
        }
      }, pageAccessToken);
    } catch (error) {
      console.error("chat mo si Mark Martinez para ma fix or try again shoti:", error);
      sendMessage(senderId, {
        text: `Failed to fetch the Shoti video. Error: ${error.message || "Unknown error"}`
      }, pageAccessToken);
    }
  }
};
