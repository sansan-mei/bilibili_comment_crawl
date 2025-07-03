import YTDlp from "yt-dlp-wrap";

/**
 * 获取YouTube视频ID
 * @param {string} url - 视频URL
 * @returns {string} - 视频ID
 */
export const getYoutubeVideoId = (url) => {
  const videoId = url.split("v=")[1];
  if (videoId) {
    // 如果有&符号，只取&符号前面的部分
    return videoId.split("&")[0];
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

/**
 * 获取 YT-DLP 实例
 * @returns {YTDlp} YT-DLP 实例
 */
export const getYTDlpModule = () => {
  const path = process.env.YT_DLP_PATH;
  if (!path) {
    throw new Error(
      "你还没有设置 yt-dlp 的路径，请在环境变量中设置 YT_DLP_PATH"
    );
  }
  // @ts-ignore
  return new YTDlp.default(path);
};

/**
 * 合并 YouTube 数据
 * @param {YouTubeVideoInfo} videoInfo - 视频信息
 * @param {YouTubeComment[]} comments - 评论
 * @param {string} captionContents - 字幕内容
 * @returns {string} - 合并后的数据
 */
export const mergeYoutubeData = (videoInfo, comments, captionContents) => {
  const videoInfoTxt = JSON.stringify(videoInfo);
  const commentsTxt = JSON.stringify(comments);
  return `<video_info>
${videoInfoTxt}
</video_info>

<video_comments>
${commentsTxt}
</video_comments>

<video_caption>
${captionContents}
</video_caption>`;
};
