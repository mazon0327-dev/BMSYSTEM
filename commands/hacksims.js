const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'hacksims',
  description: 'SMS spam',
  author: 'Clarence',
  role: 1,
  async execute(senderId, args, pageAccessToken) {
    if (args.length < 3) {
      sendMessage(senderId, { text: 'Usage: sms <phone> <count> <interval>' }, pageAccessToken);
      return;
    }

    const [phone, count, interval] = args;

    if (isNaN(count) || isNaN(interval)) {
      sendMessage(senderId, { text: 'Count and interval must be numbers.' }, pageAccessToken);
      return;
    }

    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/spamsms?phone=${encodeURIComponent(phone)}&count=${count}&interval=${interval}`;
      const response = await axios.get(apiUrl);

      if (response.data.success) {
        const resultText = response.data.result
          .map((item) => `Message #${item.messageNumber}: ${item.result}`)
          .join('\n');
        
        sendMessage(
          senderId,
          {
            text: `SMS spam initiated!\n\nTarget Number: ${response.data.target_number}\nCount: ${response.data.count}\nInterval: ${response.data.interval} sec(s)\n\nResults:\n${resultText}`,
          },
          pageAccessToken
        );
      } else {
        sendMessage(senderId, { text: 'Failed to initiate SMS spam. Please try again.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error initiating SMS spam:', error);
      sendMessage(senderId, { text: 'An error occurred while processing your request.' }, pageAccessToken);
    }
  },
};
