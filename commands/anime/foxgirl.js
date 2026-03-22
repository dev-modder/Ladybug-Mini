/**
 * Ladybug Bot Mini V(5)
 * Foxgirl Command - Get random foxgirl anime images
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getTempDir, deleteTempFile } = require('../../utils/tempManager');

const BASE = 'https://api.princetechn.com/api/anime/foxgirl';
const API_KEY = 'prince';

module.exports = {
  name: 'foxgirl',
  aliases: ['kitsune', 'foxgirlsfw'],
  category: 'anime',
  desc: 'Get random foxgirl SFW anime images',
  usage: 'foxgirl',
  execute: async (sock, msg, args, extra) => {
    try {
      const url = `${BASE}?apikey=${API_KEY}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      if (!response.data || !response.data.result) {
        throw new Error('Invalid API response: missing image URL');
      }

      const imageUrl = response.data.result;

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image URL in API response');
      }

      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'image/*'
        },
        timeout: 30000
      });

      const imageBuffer = Buffer.from(imageResponse.data);

      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Empty image response');
      }

      const maxImageSize = 5 * 1024 * 1024; // 5MB
      if (imageBuffer.length > maxImageSize) {
        throw new Error(`Image too large: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
      }

      const contentType = imageResponse.headers['content-type'] || '';
      let extension = 'jpg';
      if (contentType.includes('png')) {
        extension = 'png';
      } else if (contentType.includes('jpeg')) {
        extension = 'jpg';
      } else if (imageUrl.match(/\.(png|jpg|jpeg)$/i)) {
        const match = imageUrl.match(/\.(png|jpg|jpeg)$/i);
        extension = match[1].toLowerCase();
      }

      const tempDir = getTempDir();
      const timestamp = Date.now();
      const tempImagePath = path.join(tempDir, `foxgirl_${timestamp}.${extension}`);

      let finalBuffer = null;

      try {
        fs.writeFileSync(tempImagePath, imageBuffer);
        finalBuffer = fs.readFileSync(tempImagePath);

        if (!finalBuffer || finalBuffer.length === 0) {
          throw new Error('Failed to read image from temp file');
        }

        await sock.sendMessage(extra.from, {
          image: finalBuffer
        }, { quoted: msg });

      } finally {
        try {
          deleteTempFile(tempImagePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

    } catch (error) {
      console.error('Error in foxgirl command:', error);

      if (error.response?.status === 404) {
        await extra.reply('❌ Image not found. Please try again.');
      } else if (error.response?.status === 429) {
        await extra.reply('❌ Rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        await extra.reply('❌ Request timed out. Please try again.');
      } else {
        await extra.reply(`❌ Failed to fetch foxgirl image: ${error.message}`);
      }
    }
  }
};
