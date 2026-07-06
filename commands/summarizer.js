const axios = require('axios');
const { sendMessage } = require('../handles/message');

module.exports = {
  name: 'summarizer',
  description: 'Ask a question to the Blackbox AI',
  role: 1,
  author: 'Mark Martinez and GeoDevz69',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();

    
    if (!prompt) {
      return sendMessage(senderId, {
        text: 'Hello! I am Text Summarizer, how can I help you?'
      }, pageAccessToken);
    }
     //api
    //https://kaiz-apis.gleeze.com/api/blackbox?q=&uid=1

   //before 
    //const apiUrl = `https://clarence-rest-apiv1.onrender.com/api/blackbox?message=${encodeURIComponent(prompt)}`;
    
    //after
     const apiUrl = `https://kaiz-apis.gleeze.com/api/summarizer?text=${encodeURIComponent(prompt)}`;
     
     //tignan mo yung pinag kaiba ng before and after tas pag may uid sa dulo i dudugtong molang din yon katulad ng after 
     
     //pag ang api mo ay iba ang response 
     //result ang naka lagay yung sa response data babaguhin mo
     //example 
     //eto yung nauna 
     // response.data.response
     // tas eto naman pag ang api mo ay may naka lagay na result yung response nya
     //response.data.result
    

    try {
      const response = await axios.get(apiUrl);
      const reply = response.data.summary;

      if (reply) {
        
        const formattedResponse = `TEXT SUMMARIZER:\n\n${reply}`;
        
        
        const maxLength = 2000;

        
        if (formattedResponse.length > maxLength) {
          const chunks = [];
          let remainingText = formattedResponse;

          while (remainingText.length > 0) {
            chunks.push(remainingText.substring(0, maxLength));
            remainingText = remainingText.substring(maxLength);
          }

          
          for (const chunk of chunks) {
            await sendMessage(senderId, { text: chunk }, pageAccessToken);
          }
        } else {
          
          await sendMessage(senderId, { text: formattedResponse }, pageAccessToken);
        }
      } else {
        
        await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error calling Blackbox API:', error);

      
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
