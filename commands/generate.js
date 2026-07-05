const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'generate',
  description: 'Generate Images',
  usage: 'generate <search term> [number]',
  author: '0xcodex',

  async execute(senderId, args, token) {
    if (args.length === 0) {
      return sendMessage(senderId, { text: 'Please provide a search term!' }, token);
    }

    let searchTerm = '';
    let imageCount = 30;

    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg) && lastArg > 0) {
      imageCount = parseInt(lastArg);
      searchTerm = args.slice(0, -1).join(' ');
    } else {
      searchTerm = args.join(' ');
    }

    if (imageCount > 30) imageCount = 30;
    if (imageCount < 1) imageCount = 1;

    try {
      const response = await axios.get('https://hiroshi-api.onrender.com/image/pinterest', {
        params: { 
          search: searchTerm,
          limit: 100
        }
      });

      let imageList = response.data?.data || [];
      
      const cleanSearch = searchTerm.toLowerCase().trim();
      const searchWords = cleanSearch.split(/\s+/);
      
      const filteredImages = imageList.filter(url => {
        if (!url) return false;
        const decodedUrl = decodeURIComponent(url).toLowerCase();
        
        const exactMatch = decodedUrl.includes(cleanSearch);
        const dashMatch = decodedUrl.includes(cleanSearch.replace(/\s+/g, '-'));
        const underscoreMatch = decodedUrl.includes(cleanSearch.replace(/\s+/g, '_'));
        const allWordsMatch = searchWords.every(word => {
          if (word.length < 2) return true;
          return decodedUrl.includes(word);
        });
        
        let matchCount = 0;
        if (exactMatch) matchCount++;
        if (dashMatch) matchCount++;
        if (underscoreMatch) matchCount++;
        if (allWordsMatch) matchCount++;
        
        return matchCount >= 2;
      });

      let finalImages = filteredImages;
      
      if (finalImages.length < imageCount) {
        const fallbackImages = imageList.filter(url => {
          if (!url) return false;
          const decodedUrl = decodeURIComponent(url).toLowerCase();
          return searchWords.some(word => {
            if (word.length < 2) return false;
            return decodedUrl.includes(word);
          });
        });
        finalImages = [...filteredImages, ...fallbackImages];
      }

      const uniqueImages = [];
      const seenUrls = new Set();
      
      for (const url of finalImages) {
        if (!seenUrls.has(url) && isValidUrl(url)) {
          uniqueImages.push(url);
          seenUrls.add(url);
        }
        if (uniqueImages.length >= imageCount * 3) break;
      }

      const shuffledImages = uniqueImages.sort(() => Math.random() - 0.5);
      
      const selectedImages = [];
      const usedHashes = new Set();
      
      for (const url of shuffledImages) {
        const urlHash = url.split('/').pop().split('?')[0];
        if (!usedHashes.has(urlHash)) {
          selectedImages.push(url);
          usedHashes.add(urlHash);
        }
        if (selectedImages.length >= imageCount) break;
      }

      if (selectedImages.length < imageCount) {
        const retryResponse = await axios.get('https://hiroshi-api.onrender.com/image/pinterest', {
          params: { 
            search: searchTerm,
            limit: 100
          }
        });
        
        const retryImages = retryResponse.data?.data || [];
        const retryFiltered = retryImages.filter(url => {
          if (!url) return false;
          const decodedUrl = decodeURIComponent(url).toLowerCase();
          return decodedUrl.includes(cleanSearch);
        });
        
        for (const url of retryFiltered) {
          const urlHash = url.split('/').pop().split('?')[0];
          if (!usedHashes.has(urlHash) && isValidUrl(url)) {
            selectedImages.push(url);
            usedHashes.add(urlHash);
          }
          if (selectedImages.length >= imageCount) break;
        }
      }

      const resultImages = selectedImages.slice(0, imageCount);

      if (resultImages.length === 0) {
        return sendMessage(senderId, { text: 'No images found' }, token);
      }

      for (let i = 0; i < resultImages.length; i++) {
        const imageUrl = resultImages[i];
        if (imageUrl && isValidUrl(imageUrl)) {
          await sendMessage(senderId, {
            attachment: {
              type: 'image',
              payload: { url: imageUrl }
            }
          }, token);
          
          if (i < resultImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

    } catch (error) {
      console.log('Pinterest API error:', error.message);
      sendMessage(senderId, { text: 'Error fetching images' }, token);
    }
  }
};

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
