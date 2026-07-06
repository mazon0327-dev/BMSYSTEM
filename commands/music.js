const axios = require("axios");
const { sendMessage } = require('../handles/message'); // Ensure the path is correct

module.exports = {
  name: "music", // You can rename this to "soundcloud" if more appropriate
  description: "Search for a SoundCloud track using a keyword",
  role: 1,
  author: "GeoDevz69",

  async execute(senderId, args, pageAccessToken) {
    const searchQuery = args.join(" ");

    if (!searchQuery) {
      return sendMessage(senderId, {
        text: `Usage: spotify [music title]`
      }, pageAccessToken);
    }

    try {
      const res = await axios.get('https://betadash-api-swordslush-production.up.railway.app/SoundCloud', {
        params: { search: searchQuery }
      });

      const results = res?.data?.results;

      if (!results || results.length === 0) {
        throw new Error("No results found");
      }

      // Pick the first result
      const track = results[0];
      const { title, artist, duration, thumbnail, url } = track;

      // Use duration directly (format is already like "3:42")
      const formattedDuration = duration;

      // Send track info
      await sendMessage(senderId, {
        text: `🎶 Now playing: ${title}\n👤 Artist: ${artist}\n⏱ Duration: ${formattedDuration}`
      }, pageAccessToken);

      // Send album cover
      await sendMessage(senderId, {
        attachment: {
          type: "image",
          payload: {
            url: thumbnail
          }
        }
      }, pageAccessToken);

      // Send audio link as message
      await sendMessage(senderId, {
        text: `Listen here: ${url}`
      }, pageAccessToken);

    } catch (error) {
      console.error("Error retrieving the track:", error.message || error);
      await sendMessage(senderId, {
        text: `Error retrieving the track. Please try again later.`
      }, pageAccessToken);
    }
  }
};
