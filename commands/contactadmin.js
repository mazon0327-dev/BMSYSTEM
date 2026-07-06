const { sendMessage } = require('../handles/message');
const config = require("../configure.json");

module.exports = {
  name: 'contactadmin',
  description: 'Send feedback or issues to the admin',
  usage: 'callad <message>',
  author: 'cliff',
  async execute(senderId, args, pageAccessToken) {
    try {
      // Validate input
      if (!args || args.length === 0) {
        await sendMessage(
          senderId,
          { text: '❗ Please provide a message to report to the admin.' },
          pageAccessToken
        );
        return;
      }

      const message = args.join(" ").trim();
      if (!message) {
        await sendMessage(
          senderId,
          { text: '❗ Please provide a valid message to report.' },
          pageAccessToken
        );
        return;
      }

      // Get all unique admin IDs with additional validation
      const allAdmins = [
  ...new Set([
    ...(config.adminId || []),
    ...(config.sessions || []).map((session) => session.adminid).filter(id => id && typeof id === 'string')
  ])
].filter(Boolean);

      console.log("Resolved Admin IDs:", allAdmins);

      if (allAdmins.length === 0) {
        console.error('No admin IDs found in configuration');
        throw new Error('No admins configured');
      }

      let atLeastOneSuccess = false;
      let errorCount = 0;

      // Send to all admins with better error tracking
      const adminPromises = allAdmins.map(async (adminId) => {
        try {
          await sendMessage(
            adminId,
            {
              text: `📥 𝗡𝗲𝘄 𝗙𝗲𝗲𝗱𝗯𝗮𝗰𝗸 𝗥𝗲𝗰𝗲𝗶𝘃𝗲𝗱:\n\n👤 𝗙𝗿𝗼𝗺 𝗦𝗲𝗻𝗱𝗲𝗿 𝗜𝗗: ${senderId}\n\n📑 𝗠𝗲𝘀𝘀𝗮𝗴𝗲: ${message}`
            },
            pageAccessToken
          );
          atLeastOneSuccess = true;
        } catch (e) {
          errorCount++;
          console.error(`Failed to send to admin ${adminId}:`, e.message);
        }
      });

      await Promise.all(adminPromises);

      if (!atLeastOneSuccess) {
        throw new Error(`Failed to send to all ${allAdmins.length} admins`);
      }

      if (errorCount > 0) {
        console.warn(`Successfully sent to ${allAdmins.length - errorCount}/${allAdmins.length} admins`);
      }

      await sendMessage(
        senderId,
        { text: '✅ Thank you for your feedback! Your message has been sent to the admin.' },
        pageAccessToken
      );
    } catch (error) {
      console.error('Error in callad command:', error.message);
      await sendMessage(
        senderId,
        { text: '❌ An error occurred while sending your feedback. Please try again later.' },
        pageAccessToken
      ).catch(e => console.error('Failed to send error message to user:', e));
    }
  }
};
