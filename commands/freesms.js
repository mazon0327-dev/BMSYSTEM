const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'freesms',
  description: 'Send a free SMS to a specified number.',
  usage: '-freesms phone-number | message',
  author: 'kenlie',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length < 2) {
      await sendMessage(senderId, { text: 'Please provide a phone number and message. Usage: -freesms phone-number | message 📱' }, pageAccessToken);
      return;
    }

    // Split the arguments into phone number and message parts
    const [phoneNumber, ...messageParts] = args.join(' ').split('|').map(part => part.trim());
    
    if (!phoneNumber || !messageParts.length) {
      await sendMessage(senderId, { text: 'Invalid format. Please use: -freesms phone-number | message 📱' }, pageAccessToken);
      return;
    }

    const message = messageParts.join(' ');

    try {
      const response = await axios.get(`https://api.kenliejugarap.com/freesmslbc/?number=${encodeURIComponent(phoneNumber)}&message=${encodeURIComponent(message)}`);
      
      if (response.data.status) {
        await sendMessage(senderId, {
          text: `SMS successfully sent to ${phoneNumber} 📤\n\nResponse: ${response.data.response}`
        }, pageAccessToken);
      } else {
        await sendMessage(senderId, { text: 'Failed to send SMS. Please try again later. ❌' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'An error occurred while sending the SMS. Please try again later. ⚠️' }, pageAccessToken);
    }
  }
};
