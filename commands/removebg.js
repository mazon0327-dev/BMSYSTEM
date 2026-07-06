const axios = require("axios");
const { sendMessage } = require("../handles/message");

module.exports = {
  name: "removebg",
  description: "Removes background from an image.",
  role: 1,
  author: "kaizenega",

  async execute(bot, args, authToken, event) {
    if (!event?.sender?.id) {
      console.error("Missing sender ID.");
      sendMessage(bot, { text: "Error: Missing sender ID." }, authToken);
      return;
    }

    const senderId = event.sender.id;

    try {
      const imageUrl = await extractImageUrl(event, authToken);
      if (!imageUrl) {
        sendMessage(bot, { text: "No image found. Please reply to an image or send an image directly. 😂" }, authToken);
        return;
      }

      const removeBgUrl = `https://kaiz-apis.gleeze.com/api/removebgv2?url=${encodeURIComponent(imageUrl)}&stream=True&apikey=ec7d563d-adae-4048-af08-0a5252f336d1`;
      const uploadApiUrl = `https://kaiz-apis.gleeze.com/api/imgur?url=${encodeURIComponent(removeBgUrl)}&apikey=ec7d563d-adae-4048-af08-0a5252f336d1`;

      const response = await axios.get(uploadApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
        }
      });

      const imgurData = response.data;

      if (imgurData.uploaded && imgurData.uploaded.status === 'success') {
        const imgurLink = imgurData.uploaded.image;
        await sendMessage(bot, {
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'image',
              payload: { url: imgurLink }
            }
          }
        }, authToken);
      } else {
        sendMessage(bot, { text: "Failed to upload processed image. 🥲" }, authToken);
      }
    } catch (err) {
      console.error("Removebg command error:", err);
      sendMessage(bot, { text: `Error: ${err.message || "Something went wrong."}` }, authToken);
    }
  }
};

async function extractImageUrl(event, authToken) {
  try {
    if (event.message?.reply_to?.mid) {
      return await getRepliedImage(event.message.reply_to.mid, authToken);
    } else if (event.message?.attachments?.[0]?.type === "image") {
      return event.message.attachments[0].payload.url;
    }
  } catch (err) {
    console.error("Image extraction failed:", err);
  }
  return "";
}

async function getRepliedImage(mid, authToken) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: authToken }
    });
    return data?.data?.[0]?.image_data?.url || "";
  } catch (err) {
    console.error("Failed to retrieve replied image:", err);
    throw new Error("Failed to retrieve replied image.");
  }
}
