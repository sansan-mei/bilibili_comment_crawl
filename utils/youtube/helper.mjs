/**
 * 获取YouTube视频ID
 * @param {string} url - 视频URL
 * @returns {string} - 视频ID
 */
export const getYoutubeVideoId = (url) => {
  const videoId = url.split("v=")[1];
  if (videoId) {
    return videoId;
  }
  return "";
};

/**
 * 获取YouTube API密钥
 * @returns {string} - API密钥
 */
export const getApiKey = () => {
  return process.env.YOUTUBE_API_KEY;
};
