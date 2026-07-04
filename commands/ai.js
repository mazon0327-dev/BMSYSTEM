const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Queue system para sa sunod-sunod na requests
const requestQueue = [];
let isProcessing = false;
const userRequests = new Map(); // Track per user

module.exports = {
  name: 'ai',
  description: 'Smart AI with Queue System',
  usage: 'ai [message]',
  author: 'coffee',

  async execute(senderId, args, token) {
    const prompt = args.join(' ').trim() || 'Hello';

    // Add to queue
    requestQueue.push({
      senderId,
      prompt,
      token,
      timestamp: Date.now()
    });

    // Start processing if not already
    if (!isProcessing) {
      processQueue();
    }

    // Send initial response na nagpro-process
    await sendMessage(senderId, {
      text: '⏳ Processing your request...'
    }, token);
  }
};

async function processQueue() {
  if (requestQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const request = requestQueue.shift(); // Get first request

  try {
    // Process the request
    await processAIRequest(request.senderId, request.prompt, request.token);
  } catch (error) {
    console.error('Queue Error:', error.message);
    await sendMessage(request.senderId, {
      text: getSmartReply(request.prompt)
    }, request.token);
  }

  // Process next in queue after 500ms delay
  setTimeout(processQueue, 500);
}

async function processAIRequest(senderId, prompt, token) {
  try {
    // Try multiple endpoints
    const response = await getAIResponse(prompt, senderId);
    
    if (response) {
      await sendMessage(senderId, {
        text: response.slice(0, 2000)
      }, token);
    } else {
      await sendMessage(senderId, {
        text: getSmartReply(prompt)
      }, token);
    }
  } catch (error) {
    // Fallback
    await sendMessage(senderId, {
      text: getSmartReply(prompt)
    }, token);
  }
}

async function getAIResponse(prompt, userId) {
  const endpoints = [
    {
      url: 'https://api-library-kohi-production.up.railway.app/api/publicai',
      timeout: 3000,
      getParams: () => ({ prompt, user: userId })
    },
    {
      url: 'https://api-library-kohi-production.up.railway.app/api/pollination-ai',
      timeout: 4000,
      getParams: () => ({ prompt, model: 'openai-large', user: userId })
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await axios.get(endpoint.url, {
        params: endpoint.getParams(),
        timeout: endpoint.timeout
      });

      if (data?.data) {
        return typeof data.data === 'string' ? data.data : data.data.text;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function getSmartReply(prompt) {
  const lower = prompt.toLowerCase().trim();
  
  // More intelligent fallbacks for serious questions
  const replies = {
    'what is': 'Interesting question! Let me think... 🤔',
    'ano ang': 'Interesting question! Let me think... 🤔',
    'how to': 'Great question! Let me analyze... 🤔',
    'paano': 'Great question! Let me analyze... 🤔',
    'why': 'That\'s a deep question! Let me reflect... 🤔',
    'bakit': 'That\'s a deep question! Let me reflect... 🤔',
    'who': 'Let me consider that... 🤔',
    'sino': 'Let me consider that... 🤔',
    'default': 'Hmm, interesting! Tell me more. 🤔'
  };
  
  for (const [key, reply] of Object.entries(replies)) {
    if (lower.includes(key)) return reply;
  }
  return replies.default;
}
