const axios = require('axios');
const cheerio = require('cheerio')

const fetchImageFromBing = async (query) => {
    try {
        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(
          query
        )}`;
    
        const { data } = await axios.get(searchUrl);
    
        const $ = cheerio.load(data);
        const imageUrls = [];
    
        $("img").each((i, el) => {
          const imgSrc = $(el).attr("src");
          if (imgSrc && imgSrc.startsWith("http")) {
            imageUrls.push(imgSrc);
          }
        });
    
        return imageUrls.length ? imageUrls[0] : null;
      } catch (error) {
        console.error("Error fetching image:", error);
        return null;
      }
};

module.exports = { fetchImageFromBing };
