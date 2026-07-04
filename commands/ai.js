const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Cooldown system
const userCooldowns = new Map();
const userMessages = new Map(); // Store message IDs for editing
const COOLDOWN_TIME = 10;

module.exports = {
  name: 'ai',
  description: 'AI with inline countdown',
  usage: 'ai [message]',
  author: 'coffee',

  async execute(senderId, args, token) {
    const prompt = args.join(' ').trim() || 'Hello';

    try {
      // Check cooldown
      const cooldownCheck = checkCooldown(senderId);
      if (cooldownCheck.onCooldown) {
        // Update existing countdown message (not send new one)
        await updateCountdown(senderId, cooldownCheck.remaining, token);
        return;
      }

      // Process the request
      await processAIRequest(senderId, prompt, token);

    } catch (error) {
      console.error('[AI Error]:', error.message);
      await sendMessage(senderId, {
        text: '⚠️ Error. Try again.'
      }, token);
    }
  }
};

function checkCooldown(userId) {
  const lastRequest = userCooldowns.get(userId);
  if (!lastRequest) {
    return { onCooldown: false, remaining: 0 };
  }
  
  const elapsed = (Date.now() - lastRequest) / 1000;
  const remaining = Math.ceil(COOLDOWN_TIME - elapsed);
  
  if (remaining > 0) {
    return { onCooldown: true, remaining };
  }
  
  userCooldowns.delete(userId);
  return { onCooldown: false, remaining: 0 };
}

async function updateCountdown(userId, seconds, token) {
  const formatted = String(seconds).padStart(2, '0') + 's';
  
  // Check if we have a message ID to edit
  const messageId = userMessages.get(userId);
  
  if (messageId) {
    // Edit the existing message (update the number only)
    await sendMessage(userId, {
      text: `${formatted}`,
      edit: messageId // Edit existing message
    }, token);
  } else {
    // First time - send new message
    const sent = await sendMessage(userId, {
      text: `${formatted}`
    }, token);
    
    // Store message ID for future updates
    if (sent?.message_id) {
      userMessages.set(userId, sent.message_id);
    }
  }
}

async function processAIRequest(userId, prompt, token) {
  // Send typing indicator
  await sendMessage(userId, { typing: true }, token);

  // Get AI response
  const response = await getAIResponse(prompt, userId);
  
  // Set cooldown
  userCooldowns.set(userId, Date.now());
  
  // Send clean response
  if (response) {
    await sendMessage(userId, {
      text: response.slice(0, 2000)
    }, token);
  } else {
    await sendMessage(userId, {
      text: getFallbackResponse(prompt)
    }, token);
  }
  
  // Start countdown after response
  startCountdown(userId, token);
}

async function startCountdown(userId, token) {
  let remaining = COOLDOWN_TIME;
  
  // Send initial countdown message
  const formatted = String(remaining).padStart(2, '0') + 's';
  const sent = await sendMessage(userId, {
    text: `${formatted}`
  }, token);
  
  // Store message ID for editing
  if (sent?.message_id) {
    userMessages.set(userId, sent.message_id);
  }
  
  // Update countdown every second
  const timer = setInterval(async () => {
    remaining--;
    
    if (remaining <= 0) {
      clearInterval(timer);
      userMessages.delete(userId);
      
      // Update to ready state
      await sendMessage(userId, {
        text: `0.0s`,
        edit: userMessages.get(userId)
      }, token);
      return;
    }
    
    // Update the same message with new number
    const formatted = String(remaining).padStart(2, '0') + 's';
    const messageId = userMessages.get(userId);
    
    if (messageId) {
      await sendMessage(userId, {
        text: `${formatted}`,
        edit: messageId
      }, token);
    }
    
  }, 1000);
}

async function getAIResponse(prompt, userId) {
  const endpoints = [
    'https://api-library-kohi-production.up.railway.app/api/publicai',
    'https://api-library-kohi-production.up.railway.app/api/copilot?model=gpt-3.5'
  ];

  for (const url of endpoints) {
    try {
      const { data } = await axios.get(url, {
        params: { prompt, user: userId },
        timeout: 8000
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

function getFallbackResponse(prompt) {
  const lower = prompt.toLowerCase().trim();
  
  const responses = {
    'hello': 'Hello! 👋',
    'hi': 'Hi there! 😊',
    'kamusta': 'Okay naman! Ikaw?',
    'musta': 'Okay lang! Ikaw?',
    'thanks': 'You\'re welcome! 👍',
    'salamat': 'Walang anuman! 👍',
    'good morning': 'Good morning! ☀️',
    'good night': 'Good night! 🌙',
    'how are you': 'I\'m doing great! Thanks! 😊',
    'default': 'Hmm, interesting! Tell me more. 🤔'
  };
  
  for (const [key, response] of Object.entries(responses)) {
    if (lower.includes(key)) return response;
  }
  return responses.default;
}
