const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Cooldown system
const userCooldowns = new Map();
const COOLDOWN_TIME = 10; // 10 seconds

module.exports = {
  name: 'ai',
  description: 'AI with countdown timer',
  usage: 'ai [message]',
  author: 'coffee',

  async execute(senderId, args, token) {
    const prompt = args.join(' ').trim() || 'Hello';

    try {
      // Check cooldown muna bago mag-request
      const cooldownCheck = checkCooldown(senderId);
      if (cooldownCheck.onCooldown) {
        const formatted = String(cooldownCheck.remaining).padStart(2, '0') + 's';
        await sendMessage(senderId, {
          text: `⏳ ${formatted}`
        }, token);
        return;
      }

      // Process the AI request
      await processAIRequest(senderId, prompt, token);

    } catch (error) {
      console.error('[AI Error]:', error.message);
      
      // Set cooldown kahit nag-error para hindi ma-spam
      userCooldowns.set(senderId, Date.now());
      
      // Start countdown after error
      await startCountdown(senderId, token);
      
      // Send error message
      await sendMessage(senderId, {
        text: '❌ Request timed out. Please wait.'
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

async function processAIRequest(userId, prompt, token) {
  // Send typing indicator
  await sendMessage(userId, { typing: true }, token);

  try {
    // Try to get AI response with timeout
    const response = await getAIResponse(prompt, userId);
    
    // Set cooldown after successful response
    userCooldowns.set(userId, Date.now());
    
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
    await startCountdown(userId, token);
    
  } catch (error) {
    // If error, set cooldown and show countdown
    userCooldowns.set(userId, Date.now());
    await startCountdown(userId, token);
    throw error; // Re-throw para ma-handle ng outer catch
  }
}

async function startCountdown(userId, token) {
  let remaining = COOLDOWN_TIME;
  
  // Send initial countdown
  const formatted = String(remaining).padStart(2, '0') + 's';
  await sendMessage(userId, {
    text: `⏳ ${formatted}`
  }, token);
  
  // Update countdown every second (for 5 seconds lang to avoid spam)
  const timer = setInterval(async () => {
    remaining--;
    
    if (remaining <= 0) {
      clearInterval(timer);
      await sendMessage(userId, {
        text: `✅ 0.0s`
      }, token);
      return;
    }
    
    // Update countdown every 2 seconds para hindi masyadong spam
    if (remaining % 2 === 0 || remaining <= 3) {
      const formatted = String(remaining).padStart(2, '0') + 's';
      await sendMessage(userId, {
        text: `⏳ ${formatted}`
      }, token);
    }
    
  }, 1000);
}

async function getAIResponse(prompt, userId) {
  const endpoints = [
    'https://api-library-kohi-production.up.railway.app/api/publicai',
    'https://api-library-kohi-production.up.railway.app/api/copilot?model=gpt-3.5'
  ];

  // Try each endpoint with shorter timeout
  for (const url of endpoints) {
    try {
      const { data } = await axios.get(url, {
        params: { prompt, user: userId },
        timeout: 5000 // 5 seconds timeout
      });

      if (data?.data) {
        return typeof data.data === 'string' ? data.data : data.data.text;
      }
    } catch (error) {
      continue; // Try next endpoint
    }
  }
  
  // If all endpoints fail
  throw new Error('All endpoints failed');
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
