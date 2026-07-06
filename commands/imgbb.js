const axios = require("axios");
const { sendMessage } = require("../handles/message");

module.exports = {
  name: "imgbb",
  description: "Uploads an image to imgbb using Kaiz API.",
  role: 1,
  author: "GeoDevz69",

  async execute(bot, args, authToken, event) {
    if (!event?.sender?.id) {
      console.error("Invalid event object: Missing sender ID.");
      await sendMessage(bot, { text: "❌ Error: Missing sender ID." }, authToken);
      return;
    }

    try {
      const imageUrl = await extractImageUrl(event, authToken);
      console.log("Extracted Image URL:", imageUrl);

      if (!imageUrl) {
        await sendMessage(
          bot,
          { text: "❌ Please reply to an image or send an image with the command to upload it to imgbb." },
          authToken
        );
        return;
      }

      const imgbbResponse = await uploadToImgbb(imageUrl);
      console.log("Kaiz API imgbb response:", imgbbResponse);

      if (imgbbResponse && imgbbResponse.success) {
        const imgbbLink = imgbbResponse.link;
        await sendMessage(bot, { text: `✅ Image uploaded to imgbb:\n${imgbbLink}` }, authToken);
      } else {
        await sendMessage(bot, { text: "❌ Failed to upload the image to imgbb." }, authToken);
      }
    } catch (error) {
      console.error("Error in imgbb command:", error);
      await sendMessage(
        bot,
        { text: `❌ Error: ${error.message || "Something went wrong."}` },
        authToken
      );
    }
  },
};

async function extractImageUrl(event, authToken) {
  try {
    // If replying to an image
    if (event.message?.reply_to?.mid) {
      return await getRepliedImage(event.message.reply_to.mid, authToken);
    }

    // If sending an image directly
    if (event.message?.attachments?.[0]?.type === "image") {
      return event.message.attachments[0].payload.url;
    }
  } catch (error) {
    console.error("Failed to extract image URL:", error);
  }

  return "";
}

async function getRepliedImage(mid, authToken) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: authToken },
    });
    console.log("Replied image data:", data);
    return data?.data?.[0]?.image_data?.url || "";
  } catch (error) {
    console.error("Failed to retrieve replied image:", error);
    throw new Error("❌ Failed to retrieve replied image.");
  }
}

async function uploadToImgbb(imageUrl) {
  try {
    const apiUrl = `https://kaiz-apis.gleeze.com/api/imgbb?url=${encodeURIComponent(
      imageUrl
    )}&apikey=ec7d563d-adae-4048-af08-0a5252f336d1`;

    const { data } = await axios.get(apiUrl);
    console.log("Kaiz API data:", data);

    // Validate the expected response
    if (data && data.success && data.link) {
      return data;
    }

    return { success: false };
  } catch (error) {
    console.error("Failed to upload to imgbb via Kaiz API:", error);
    return { success: false };
  }
}
