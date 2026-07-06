const axios = require("axios");
const { sendMessage } = require("../handles/message");

console.log("sendMessage function:", sendMessage);

module.exports = {
  name: "post",
  description: "Post a message to the Facebook Page",
  role: 1, // Required role for this command
  author: "GeoDevz69",

  async execute(senderId, args, pageAccessToken, userRole) {
    const ADMIN_ID = "9066345033442093"; // 👈 Put your actual senderId (PSID) here

    // Check if the user has the required role OR is the admin
    if (userRole !== 1 && senderId !== ADMIN_ID) {
      return sendMessage(senderId, {
        text: `❌ You do not have permission to use this command.`
      }, pageAccessToken);
    }

    const message = args.join(" ");

    if (!message) {
      return sendMessage(senderId, {
        text: `Usage: post [your message]`
      }, pageAccessToken);
    }

    try {
      const PAGE_ID = "1141547004152571"; // Your Facebook Page ID
      const apiUrl = `https://graph.facebook.com/v21.0/${PAGE_ID}/feed`;

      console.log("Posting to Facebook Page:", apiUrl);

      const response = await axios.post(
        apiUrl,
        { message },
        {
          headers: {
            Authorization: `Bearer ${pageAccessToken}`,
          },
        }
      );

      console.log("✅ Posted Successfully!", response.data);

      sendMessage(senderId, {
        text: `✅ Successfully Posted: "${message}"\n🔗 Post ID: ${response.data.id}`
      }, pageAccessToken);

    } catch (error) {
      console.error("❌ Error posting to Facebook:", error.response?.data || error.message);
      sendMessage(senderId, {
        text: `❌ Error posting to Facebook. Please try again later.`
      }, pageAccessToken);
    }
  }
};
