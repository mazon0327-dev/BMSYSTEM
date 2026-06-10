const axios = require('axios');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

const API_URL = 'https://api-library-kohi-production.up.railway.app/api/pollinations';

module.exports = {
  name: 'imagegen',
  description: 'Generate images via prompt using Flux.',
  usage: '-imagegen [prompt]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: 'Please provide a prompt.' }, pageAccessToken);
    }

    const prompt = args.join(' ').trim();

    await sendMessage(senderId, {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: '🎨🖌️ Generating your image...',
            subtitle: 'Please wait a moment.'
          }]
        }
      }
    }, pageAccessToken);

    try {
      const { data } = await axios.get(API_URL, {
        params: { prompt, model: 'flux' },
        timeout: 30000
      });

      if (!data?.status || typeof data.data !== 'string') {
        throw new Error('Invalid API response');
      }

      const base64Data = data.data.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Upload buffer directly to Facebook as a file stream
      const form = new FormData();
      form.append('message', JSON.stringify({
        attachment: { type: 'image', payload: { is_reusable: true } }
      }));
      form.append('filedata', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      const { data: uploadData } = await axios.post(
        `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

      await axios.post(
        `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'image',
              payload: { attachment_id: uploadData.attachment_id }
            }
          }
        }
      );

    } catch (error) {
      const reason = error.response
        ? `API error ${error.response.status}`
        : error.message ?? 'Unknown error';

      console.error(`[imagegen] Failed for sender ${senderId}: ${reason}`);
      await sendMessage(senderId, {
        text: '❎ | Failed to generate image. Please try again.'
      }, pageAccessToken);
    }
  }
};