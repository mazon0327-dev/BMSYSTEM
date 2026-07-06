const axios = require("axios");
const { sendMessage } = require("../handles/message");

module.exports = {
  name: "remini",
  description: "Enhance images to 4K resolution.",
  role: 1,
  author: "GeoDevz69",

  async execute(bot, args, authToken, event) {
    if (!event?.sender?.id) {
      console.error("Missing sender ID.");
      await sendMessage(bot, { text: "❌| Error: Missing sender ID." }, authToken);
      return;
    }

    try {
      // Extract image URL
      const imageUrl = await extractImageUrl(event, authToken);

      if (!imageUrl) {
        await sendMessage(bot, { text: "❌| No image found. Please reply to an image or send an image directly." }, authToken);
        return;
      }

      // Notify user about processing
      const processingMsg = await sendMessage(bot, { text: "🔄| Processing... Please wait a moment." }, authToken);

      // Make the API request to Remini
      const upscaleUrl = `https://kaiz-apis.gleeze.com/api/remini?url=${encodeURIComponent(imageUrl)}`;
      let response;

      try {
        response = await axios.get(upscaleUrl);
      } catch (err) {
        console.error("API request failed:", err.response?.data || err.message);
        throw new Error(`Failed to process image (status code: ${err.response?.status || "unknown"})`);
      }

      const data = response.data;

      if (data?.response) {
        // Send the enhanced image
        await sendMessage(
          bot,
          {
            text: "✅| Here is your enhanced image:",
            attachment: {
              type: "image",
              payload: { url: data.response }
            }
          },
          authToken
        );
      } else {
        console.error("Unexpected API response:", data);
        await sendMessage(bot, { text: "❌| Failed to get the upscaled image." }, authToken);
      }

      // Remove the processing message
      if (processingMsg?.message_id) {
        await bot.unsendMessage(processingMsg.message_id, authToken);
      }

    } catch (error) {
      console.error("Remini command error:", error);
      await sendMessage(bot, { text: `❌| Error: ${error.message || "Something went wrong."}` }, authToken);
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
    return data?.data[0]?.image_data?.url || "";
  } catch (err) {
    console.error("Failed to retrieve replied image:", err.response?.data || err.message);
    throw new Error("Failed to retrieve replied image.");
  }
}
