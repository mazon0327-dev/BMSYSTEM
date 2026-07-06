const { sendMessage } = require('../handles/message'); // Adjust the path as needed

module.exports = {
  name: 'id',
  description: 'Show sender ID',
  author: 'System',
  role: 1,
  async execute(senderId, args, pageAccessToken) {
 
    const response = `senderId: ${senderId}`;
    

    try {
      await sendMessage(senderId, { text: response }, pageAccessToken);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
};
