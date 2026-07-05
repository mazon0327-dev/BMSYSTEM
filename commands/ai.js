const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const puppeteer = require('puppeteer');

module.exports = {
  name: 'ai',
  description: 'Chat with Teacher Arlene',
  usage: 'ai [message]',
  author: '0xcodex',

  async execute(senderId, args, token) {
    const prompt = args.join(' ').trim();

    // Default response for "ai" only (no question)
    if (!prompt || prompt.toLowerCase() === 'ai') {
      const helpResponse = 'Hello! I\'m Teacher Arlene! Created by GeoDevz69. How can I assist you today?';
      await sendMessage(senderId, { text: helpResponse }, token);
      return;
    }

    // Check for owner questions
    const ownerKeywords = [
      'who is your owner', 'who is your owner?', 'who owns you', 'who owns you?',
      'who created you', 'who created you?', 'who made you', 'who made you?',
      'sino gumawa sayo', 'sino gumawa sa iyo', 'sino gumawa', 'sino ang gumawa',
      'sino may ari sayo', 'sino may ari sa iyo', 'sino owner mo', 'sino owner',
      'owner mo', 'owner', 'creater', 'creator'
    ];

    const isOwnerQuestion = ownerKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isOwnerQuestion) {
      const ownerResponse = 'Wow! Nice question, well my boss GeoDevz69 created me, you can contact him here now\n\nhttps://www.facebook.com/geotechph.net';
      await sendMessage(senderId, { text: ownerResponse }, token);
      return;
    }

    // Check for user info questions (name, birthday, age, etc.)
    const userInfoKeywords = [
      'what is my name', 'ano pangalan ko', 'my name', 'pangalan ko',
      'whats my name', 'what\'s my name',
      'when is my birthday', 'kailan birthday ko', 'kelan birthday ko', 'my birthday', 'birthday ko',
      'how old am i', 'ilan taon naba ako', 'ilan taon na ako', 'my age', 'edad ko', 'age',
      'who am i', 'sino ako'
    ];

    const isUserInfoQuestion = userInfoKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isUserInfoQuestion) {
      try {
        // Get user info from Facebook public profile using Puppeteer
        const userInfo = await getUserInfoFromProfile(senderId);
        
        let response = '';
        
        // Check if asking for name
        if (prompt.toLowerCase().includes('name') || prompt.toLowerCase().includes('pangalan')) {
          if (userInfo.name) {
            response = `Your name is ${userInfo.name}.`;
          } else {
            response = 'I cannot see your name because it is set to private.';
          }
        }
        
        // Check if asking for birthday
        if (prompt.toLowerCase().includes('birthday') || prompt.toLowerCase().includes('birth') || prompt.toLowerCase().includes('kelan')) {
          if (userInfo.birthday) {
            response += `\nYour birthday is ${userInfo.birthday}.`;
            
            // Calculate age if birthday is available
            if (userInfo.age) {
              response += `\nYou are ${userInfo.age} years old.`;
            }
          } else {
            response += '\nI cannot see your birthday because it is set to private.';
          }
        }
        
        // Check if asking for age
        if (prompt.toLowerCase().includes('age') || prompt.toLowerCase().includes('old') || prompt.toLowerCase().includes('taon') || prompt.toLowerCase().includes('edad')) {
          if (userInfo.age) {
            response += `\nYou are ${userInfo.age} years old.`;
          } else if (userInfo.birthday) {
            const age = calculateAge(userInfo.birthday);
            if (age !== null) {
              response += `\nYou are ${age} years old.`;
            } else {
              response += '\nI cannot calculate your age because your birthday is not complete.';
            }
          } else {
            response += '\nI cannot see your age because your birthday is set to private.';
          }
        }
        
        // If no specific info asked, show all available public info
        if (!response) {
          const publicInfo = [];
          if (userInfo.name) publicInfo.push(`Name: ${userInfo.name}`);
          if (userInfo.birthday) publicInfo.push(`Birthday: ${userInfo.birthday}`);
          if (userInfo.age) publicInfo.push(`Age: ${userInfo.age}`);
          if (userInfo.gender) publicInfo.push(`Gender: ${userInfo.gender}`);
          if (userInfo.location) publicInfo.push(`Location: ${userInfo.location}`);
          if (userInfo.relationship) publicInfo.push(`Relationship: ${userInfo.relationship}`);
          
          if (publicInfo.length > 0) {
            response = `Here is your public information:\n${publicInfo.join('\n')}`;
          } else {
            response = 'I cannot see any public information on your account because it is set to private.';
          }
        }
        
        await sendMessage(senderId, { text: response }, token);
        return;
        
      } catch (error) {
        console.error(`[User Info] Failed: ${error.message}`);
        await sendMessage(senderId, {
          text: 'I cannot access your profile information at the moment. Please try again later.'
        }, token);
        return;
      }
    }

    // Process other queries with API
    try {
      const { data } = await axios.get(API_URL, {
        params: { 
          prompt: prompt,
          model: 'chatgpt4'
        },
        timeout: 15000
      });

      if (!data?.answer) {
        throw new Error('Invalid API response');
      }

      let aiResponse = data.answer.trim();
      
      // Convert **text** to Messenger bold format (*text*)
      aiResponse = aiResponse.replace(/\*\*(.+?)\*\*/g, '*$1*');
      aiResponse = aiResponse.replace(/\*/g, '');
      aiResponse = aiResponse.replace(/#{1,6}\s/g, '');
      aiResponse = aiResponse.replace(/---+/g, '');
      aiResponse = aiResponse.replace(/__/g, '');
      aiResponse = aiResponse.replace(/_/g, '');
      
      // Remove emojis
      aiResponse = aiResponse.replace(/[\u{1F000}-\u{1FFFF}]/gu, '');
      aiResponse = aiResponse.replace(/[\u{2600}-\u{27BF}]/gu, '');
      aiResponse = aiResponse.replace(/[\u{FE00}-\u{FEFF}]/gu, '');
      
      // Clean up
      aiResponse = aiResponse.replace(/\n{3,}/g, '\n\n');
      aiResponse = aiResponse.replace(/[ \t]+/g, ' ');
      aiResponse = aiResponse.trim();

      await sendChunks(senderId, aiResponse, token);

    } catch (error) {
      const reason = error.response
        ? `API error ${error.response.status}`
        : error.message ?? 'Unknown error';

      console.error(`[ai] Failed for sender ${senderId}: ${reason}`);
      await sendMessage(senderId, {
        text: 'Server error. Please try again later.'
      }, token);
    }
  }
};

// Function to get user info from Facebook public profile using Puppeteer
async function getUserInfoFromProfile(senderId) {
  let browser = null;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to profile
    const url = `https://www.facebook.com/profile.php?id=${senderId}`;
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Extract information
    const userInfo = await page.evaluate(() => {
      const info = {
        name: null,
        birthday: null,
        gender: null,
        location: null,
        relationship: null
      };
      
      // Get name from title
      const title = document.querySelector('title');
      if (title) {
        const titleText = title.textContent || '';
        const nameMatch = titleText.match(/^(.+?)\s*\|/);
        if (nameMatch) {
          info.name = nameMatch[1].trim();
        }
      }
      
      // Get all text content
      const allText = document.body.textContent || '';
      
      // Look for birthday
      const birthdayPatterns = [
        /Birthday\s*([A-Za-z]+\s+\d+,\s*\d{4})/i,
        /Birthday\s*([A-Za-z]+\s+\d+)/i,
        /Born\s*([A-Za-z]+\s+\d+,\s*\d{4})/i,
        /Born\s*([A-Za-z]+\s+\d+)/i
      ];
      
      for (const pattern of birthdayPatterns) {
        const match = allText.match(pattern);
        if (match) {
          info.birthday = match[1].trim();
          break;
        }
      }
      
      // Look for gender
      const genderMatch = allText.match(/Gender\s*([A-Za-z]+)/i);
      if (genderMatch) {
        info.gender = genderMatch[1].trim();
      }
      
      // Look for location
      const locationMatch = allText.match(/Lives in\s*([A-Za-z\s,]+)/i);
      if (locationMatch) {
        info.location = locationMatch[1].trim();
      }
      
      // Look for relationship
      const relationshipMatch = allText.match(/In a relationship with\s*([A-Za-z\s]+)/i);
      if (relationshipMatch) {
        info.relationship = relationshipMatch[1].trim();
      }
      
      return info;
    });
    
    // Calculate age
    let age = null;
    if (userInfo.birthday) {
      const yearMatch = userInfo.birthday.match(/\d{4}/);
      if (yearMatch) {
        const birthYear = parseInt(yearMatch[0]);
        const currentYear = new Date().getFullYear();
        age = currentYear - birthYear;
      }
    }
    
    await browser.close();
    
    return {
      name: userInfo.name,
      birthday: userInfo.birthday,
      age: age,
      gender: userInfo.gender,
      location: userInfo.location,
      relationship: userInfo.relationship
    };
    
  } catch (error) {
    console.error(`[Puppeteer] Error: ${error.message}`);
    if (browser) await browser.close();
    return {};
  }
}

// Function to calculate age from birthday
function calculateAge(birthday) {
  try {
    let birthDate;
    
    if (birthday.includes('/')) {
      const parts = birthday.split('/');
      birthDate = new Date(parts[2], parts[0] - 1, parts[1]);
    } else if (birthday.includes('-')) {
      const parts = birthday.split('-');
      birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else if (birthday.includes(' ')) {
      // Format: "December 14, 1999" or "December 14 1999"
      const cleaned = birthday.replace(/,/g, '');
      const parts = cleaned.split(' ');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
      if (monthIndex !== -1) {
        birthDate = new Date(parseInt(parts[2]), monthIndex, parseInt(parts[1]));
      }
    } else {
      return null;
    }
    
    if (isNaN(birthDate.getTime())) {
      return null;
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}

const API_URL = 'https://yin-api.vercel.app/ai/chatgptfree';
const MAX_CHUNK = 1900;

function splitMessage(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_CHUNK) {
    chunks.push(text.slice(i, i + MAX_CHUNK));
  }
  return chunks;
}

async function sendChunks(senderId, text, token) {
  const chunks = splitMessage(text);
  for (let i = 0; i < chunks.length; i++) {
    await sendMessage(senderId, { text: chunks[i] }, token);
  }
}
